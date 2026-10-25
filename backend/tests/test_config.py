"""
Tests for Sentinel Backend Configuration & Environment Loading
================================================================
Verifies that:
1. Environment variables from backend/.env are loaded reliably.
2. Explicitly supplied environment variables always take precedence (override=False).
3. Nonexistent environment files handle gracefully without crashing.
4. Missing or unconfigured SUPABASE_URL fails closed (HTTP 503) on protected routes.
5. Trailing slashes in SUPABASE_URL are normalized cleanly.
"""
import os
from pathlib import Path
import pytest
from fastapi.testclient import TestClient

from app.core import config as config_module
from app.core.config import Settings, load_backend_env, BACKEND_DIR, DEFAULT_ENV_PATH
from app.core.auth import verified_user, clear_jwk_client_cache
from app.main import app


class TestEnvironmentLoading:
    """Verifies that .env files load properly and respect precedence."""

    def test_default_env_path_points_to_backend_dir(self) -> None:
        """DEFAULT_ENV_PATH must resolve to backend/.env."""
        assert DEFAULT_ENV_PATH == BACKEND_DIR / ".env"
        assert BACKEND_DIR.name == "backend"

    def test_load_backend_env_loads_file_when_present(self, tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
        """load_backend_env reads key-values from specified dotenv file."""
        test_env = tmp_path / ".env.test"
        test_env.write_text("TEST_CONFIG_SETTING_FOO=sentinel_custom_val\n", encoding="utf-8")

        monkeypatch.delenv("TEST_CONFIG_SETTING_FOO", raising=False)
        loaded = load_backend_env(dotenv_path=test_env)
        assert loaded is True
        assert os.environ.get("TEST_CONFIG_SETTING_FOO") == "sentinel_custom_val"

    def test_explicit_env_variable_takes_precedence_over_env_file(
        self, tmp_path: Path, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        """
        Explicitly supplied environment variables must NEVER be overwritten by .env (override=False).
        """
        test_env = tmp_path / ".env.precedence"
        test_env.write_text("SUPABASE_URL=https://file-value.supabase.co\n", encoding="utf-8")

        # Explicit environment variable already exists
        monkeypatch.setenv("SUPABASE_URL", "https://explicit-shell-value.supabase.co")

        load_backend_env(dotenv_path=test_env, override=False)

        # Value must remain the explicit shell value
        assert os.environ.get("SUPABASE_URL") == "https://explicit-shell-value.supabase.co"

    def test_load_backend_env_returns_false_for_nonexistent_file(self) -> None:
        """Nonexistent path returns False without raising exceptions."""
        nonexistent = Path("/nonexistent/path/to/.env.fake")
        assert load_backend_env(dotenv_path=nonexistent) is False


class TestSettingsNormalization:
    """Verifies settings model initialization and URL normalization."""

    def test_normalized_supabase_url_strips_trailing_slashes(self, monkeypatch: pytest.MonkeyPatch) -> None:
        monkeypatch.setenv("SUPABASE_URL", "https://sample.supabase.co///")
        settings = Settings()
        assert settings.normalized_supabase_url == "https://sample.supabase.co"

    def test_normalized_supabase_url_returns_none_when_empty_or_whitespace(
        self, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        monkeypatch.setenv("SUPABASE_URL", "   ")
        settings = Settings()
        assert settings.normalized_supabase_url is None

    def test_normalized_supabase_url_returns_none_when_unset(self, monkeypatch: pytest.MonkeyPatch) -> None:
        monkeypatch.delenv("SUPABASE_URL", raising=False)
        settings = Settings()
        assert settings.normalized_supabase_url is None

    def test_cors_origins_json_parsing(self, monkeypatch: pytest.MonkeyPatch) -> None:
        monkeypatch.setenv("CORS_ORIGINS", '["http://trusted.domain:3000"]')
        settings = Settings()
        assert settings.CORS_ORIGINS == ["http://trusted.domain:3000"]


class TestFailClosedSecurityOnMissingConfig:
    """Verifies that missing Supabase configuration fails closed across protected routes."""

    @pytest.mark.parametrize(
        "endpoint,method,payload",
        [
            ("/api/alerts", "GET", None),
            ("/api/alerts/ALT-8902", "GET", None),
            ("/api/accounts/ACC-7749/transactions", "GET", None),
            ("/api/accounts/ACC-7749/network", "GET", None),
            (
                "/api/investigations/CASE-01/review",
                "POST",
                {"alert_id": "ALT-8902", "decision": "confirm_fraud", "notes": "Testing fail closed."},
            ),
            (
                "/api/transactions/score",
                "POST",
                {
                    "transaction": {
                        "sender_account_id": "ACC-1",
                        "receiver_account_id": "ACC-2",
                        "amount": 100.0,
                        "channel": "wire",
                    }
                },
            ),
        ],
    )
    def test_protected_routes_fail_closed_with_503_when_supabase_unconfigured(
        self,
        endpoint: str,
        method: str,
        payload: dict | None,
        monkeypatch: pytest.MonkeyPatch,
    ) -> None:
        """
        When SUPABASE_URL is unconfigured, protected routes MUST return 503
        and must NEVER bypass JWT validation.
        """
        clear_jwk_client_cache()
        monkeypatch.setattr(config_module.settings, "SUPABASE_URL", None)
        app.dependency_overrides.pop(verified_user, None)

        with TestClient(app) as test_client:
            headers = {"Authorization": "Bearer fake.token.here"}
            if method == "GET":
                response = test_client.get(endpoint, headers=headers)
            else:
                response = test_client.post(endpoint, json=payload, headers=headers)

            assert response.status_code == 503
            assert response.status_code != 200
            assert "not configured" in response.json().get("detail", "").lower()
