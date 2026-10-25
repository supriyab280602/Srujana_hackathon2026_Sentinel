"""
Tests for Supabase ES256/JWKS authentication on GET /api/alerts.

Strategy
--------
- An in-memory EC P-256 test key pair is generated locally with ``cryptography``.
- Tokens are signed with ``PyJWT`` using the ES256 algorithm matching Supabase Auth.
- ``PyJWKClient.fetch_data`` is mocked in test fixtures so tests are 100% hermetic
  and never make network calls or depend on a real Supabase instance.
- Tests verify all required rejection paths:
  1. Valid ES256 token verifies successfully (200 OK).
  2. Missing, malformed, and tampered tokens are rejected (401).
  3. Expired tokens are rejected (401).
  4. Wrong issuer and wrong audience are rejected (401).
  5. Missing or invalid/empty subject is rejected (401).
  6. Unknown kid or missing kid is rejected (401).
  7. JWKS retrieval failure does not authenticate (503).
  8. Missing or empty configuration fails safely (503).
  9. An HS256 token is rejected by the ES256 verifier (401).
  10. Health endpoint remains public and alerts remain protected.
  11. Existing alert API business-logic tests continue to work with their overrides.
- Tests exercise actual asymmetric signature verification using the public key
  published in the mocked JWKS set.
- Sensitive credentials or tokens are never logged.
"""

from __future__ import annotations

import base64
import time
from typing import Any

import jwt
import pytest
from cryptography.hazmat.primitives.asymmetric import ec
from fastapi import status
from fastapi.testclient import TestClient
from jwt import PyJWKClient

from app.core import config as config_module
from app.core.auth import (
    _ALLOWED_ALGORITHM,
    _SUPABASE_AUDIENCE,
    clear_jwk_client_cache,
    get_expected_issuer,
    get_jwks_url,
    get_normalized_supabase_url,
    verified_user,
)
from app.main import app

# ---------------------------------------------------------------------------
# Test Keys and Constants
# ---------------------------------------------------------------------------
_TEST_PRIVATE_KEY = ec.generate_private_key(ec.SECP256R1())
_ANOTHER_PRIVATE_KEY = ec.generate_private_key(ec.SECP256R1())

_TEST_KID = "test-ec-kid-1"
_UNKNOWN_KID = "unknown-kid-999"

_TEST_SUPABASE_URL = "https://mock-sentinel-project.supabase.co"
_TEST_ISSUER = f"{_TEST_SUPABASE_URL}/auth/v1"
_TEST_USER_SUB = "00000000-0000-0000-0000-000000000001"
_TEST_USER_EMAIL = "investigator@sentinel.test"

ALERTS_URL = "/api/alerts"
HEALTH_URL = "/api/health"


def _ec_public_to_jwk(private_key: ec.EllipticCurvePrivateKey, kid: str) -> dict[str, str]:
    """Convert an EC P-256 private key's public component into a JWK dictionary."""
    pub_numbers = private_key.public_key().public_numbers()
    x = base64.urlsafe_b64encode(pub_numbers.x.to_bytes(32, "big")).rstrip(b"=").decode("ascii")
    y = base64.urlsafe_b64encode(pub_numbers.y.to_bytes(32, "big")).rstrip(b"=").decode("ascii")
    return {
        "kty": "EC",
        "crv": "P-256",
        "x": x,
        "y": y,
        "kid": kid,
        "use": "sig",
        "alg": "ES256",
    }


def _make_es256_token(
    private_key: ec.EllipticCurvePrivateKey = _TEST_PRIVATE_KEY,
    kid: str | None = _TEST_KID,
    sub: Any = _TEST_USER_SUB,
    aud: Any = _SUPABASE_AUDIENCE,
    iss: Any = _TEST_ISSUER,
    exp_offset: int | None = 3600,
    email: str | None = _TEST_USER_EMAIL,
    extra_claims: dict[str, Any] | None = None,
    headers: dict[str, Any] | None = None,
) -> str:
    """Return a freshly signed ES256 JWT with the given claims and headers."""
    now = int(time.time())
    payload: dict[str, Any] = {}
    if sub is not None:
        payload["sub"] = sub
    if aud is not None:
        payload["aud"] = aud
    if iss is not None:
        payload["iss"] = iss
    if exp_offset is not None:
        payload["exp"] = now + exp_offset
    payload["iat"] = now
    if email is not None:
        payload["email"] = email
    payload["role"] = "authenticated"
    if extra_claims:
        payload.update(extra_claims)

    token_headers: dict[str, Any] = {}
    if kid is not None:
        token_headers["kid"] = kid
    if headers:
        token_headers.update(headers)

    return jwt.encode(payload, private_key, algorithm=_ALLOWED_ALGORITHM, headers=token_headers)


def _valid_token() -> str:
    return _make_es256_token()


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

@pytest.fixture
def mock_jwks(monkeypatch: pytest.MonkeyPatch) -> str:
    """
    Hermetic JWKS fixture:
    - Sets SUPABASE_URL in configuration
    - Clears JWK client cache
    - Mocks PyJWKClient.fetch_data to return the public key corresponding to _TEST_PRIVATE_KEY
    - Ensures no real network access occurs
    """
    clear_jwk_client_cache()
    monkeypatch.setattr(config_module.settings, "SUPABASE_URL", _TEST_SUPABASE_URL)
    app.dependency_overrides.pop(verified_user, None)

    jwks_payload = {"keys": [_ec_public_to_jwk(_TEST_PRIVATE_KEY, _TEST_KID)]}
    monkeypatch.setattr(PyJWKClient, "fetch_data", lambda self: jwks_payload)

    yield _TEST_SUPABASE_URL

    clear_jwk_client_cache()
    app.dependency_overrides.pop(verified_user, None)


@pytest.fixture
def auth_client(mock_jwks: str) -> TestClient:
    """TestClient whose requests are verified against the mocked JWKS service."""
    with TestClient(app) as c:
        yield c


@pytest.fixture
def auth_header(mock_jwks: str) -> dict[str, str]:
    """Valid Authorization header with an ES256 token."""
    return {"Authorization": f"Bearer {_valid_token()}"}


# ---------------------------------------------------------------------------
# 10. Public endpoint — /api/health (must always be accessible without a token)
# ---------------------------------------------------------------------------

class TestPublicHealth:
    def test_health_requires_no_token(self, client: TestClient) -> None:
        """GET /api/health must return 200 without any authorization header."""
        response = client.get(HEALTH_URL)
        assert response.status_code == status.HTTP_200_OK

    def test_health_ignores_token(self, auth_client: TestClient, auth_header: dict) -> None:
        """GET /api/health must return 200 even when a token is supplied."""
        response = auth_client.get(HEALTH_URL, headers=auth_header)
        assert response.status_code == status.HTTP_200_OK


# ---------------------------------------------------------------------------
# 1. Valid ES256 token — must succeed
# ---------------------------------------------------------------------------

class TestValidToken:
    def test_valid_token_returns_200(
        self, auth_client: TestClient, auth_header: dict
    ) -> None:
        """A correctly signed ES256 token matching JWKS key must return 200."""
        response = auth_client.get(ALERTS_URL, headers=auth_header)
        assert response.status_code == status.HTTP_200_OK

    def test_valid_token_response_is_list(
        self, auth_client: TestClient, auth_header: dict
    ) -> None:
        """The successful response body must be a JSON array of alerts."""
        response = auth_client.get(ALERTS_URL, headers=auth_header)
        assert isinstance(response.json(), list)

    def test_valid_token_with_trailing_slash_in_config(
        self, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        """Trailing slashes in SUPABASE_URL must be normalized safely."""
        clear_jwk_client_cache()
        monkeypatch.setattr(config_module.settings, "SUPABASE_URL", f"{_TEST_SUPABASE_URL}/")
        app.dependency_overrides.pop(verified_user, None)

        jwks_payload = {"keys": [_ec_public_to_jwk(_TEST_PRIVATE_KEY, _TEST_KID)]}
        monkeypatch.setattr(PyJWKClient, "fetch_data", lambda self: jwks_payload)

        # Expected issuer should be cleanly derived without double-slashes
        assert get_expected_issuer(get_normalized_supabase_url()) == _TEST_ISSUER
        assert get_jwks_url(get_normalized_supabase_url()) == f"{_TEST_SUPABASE_URL}/auth/v1/.well-known/jwks.json"

        token = _valid_token()
        with TestClient(app) as client:
            response = client.get(ALERTS_URL, headers={"Authorization": f"Bearer {token}"})
            assert response.status_code == status.HTTP_200_OK

        clear_jwk_client_cache()


# ---------------------------------------------------------------------------
# 2. Missing, malformed, and tampered tokens
# ---------------------------------------------------------------------------

class TestMissingAndMalformedToken:
    def test_no_authorization_header_returns_401(
        self, auth_client: TestClient
    ) -> None:
        """GET /api/alerts without any Authorization header must return 401."""
        response = auth_client.get(ALERTS_URL)
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        assert response.json().get("detail") == "Missing authorization token."

    def test_empty_bearer_returns_401(self, auth_client: TestClient) -> None:
        """An empty bearer credential must return 401."""
        response = auth_client.get(ALERTS_URL, headers={"Authorization": "Bearer "})
        assert response.status_code in {
            status.HTTP_401_UNAUTHORIZED,
            status.HTTP_403_FORBIDDEN,
        }

    def test_wrong_scheme_returns_401(self, auth_client: TestClient) -> None:
        """A non-Bearer scheme must not grant access."""
        response = auth_client.get(
            ALERTS_URL,
            headers={"Authorization": f"Basic {_valid_token()}"},
        )
        assert response.status_code in {
            status.HTTP_401_UNAUTHORIZED,
            status.HTTP_403_FORBIDDEN,
        }

    def test_garbage_token_returns_401(self, auth_client: TestClient) -> None:
        """A non-JWT string must be rejected as malformed."""
        response = auth_client.get(
            ALERTS_URL, headers={"Authorization": "Bearer not.a.jwt"}
        )
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        assert "malformed" in response.json().get("detail", "").lower()

    def test_single_segment_token_returns_401(self, auth_client: TestClient) -> None:
        """A JWT with only one dot-separated segment must be rejected as malformed."""
        response = auth_client.get(
            ALERTS_URL, headers={"Authorization": "Bearer onlyone"}
        )
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        assert "malformed" in response.json().get("detail", "").lower()

    def test_tampered_payload_returns_401(self, auth_client: TestClient) -> None:
        """A token whose payload has been modified must be rejected."""
        valid = _valid_token()
        parts = valid.split(".")
        assert len(parts) == 3

        # Mutate payload section
        payload_bytes = bytearray(base64.urlsafe_b64decode(parts[1] + "=="))
        payload_bytes[0] ^= 0xFF
        parts[1] = base64.urlsafe_b64encode(payload_bytes).rstrip(b"=").decode()
        tampered = ".".join(parts)

        response = auth_client.get(
            ALERTS_URL, headers={"Authorization": f"Bearer {tampered}"}
        )
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_tampered_signature_returns_401(self, auth_client: TestClient) -> None:
        """A token whose signature bytes have been modified must be rejected."""
        valid = _valid_token()
        parts = valid.split(".")
        sig_bytes = bytearray(base64.urlsafe_b64decode(parts[2] + "=="))
        sig_bytes[0] ^= 0xFF
        parts[2] = base64.urlsafe_b64encode(sig_bytes).rstrip(b"=").decode()
        tampered = ".".join(parts)

        response = auth_client.get(
            ALERTS_URL, headers={"Authorization": f"Bearer {tampered}"}
        )
        assert response.status_code == status.HTTP_401_UNAUTHORIZED


# ---------------------------------------------------------------------------
# 3. Expired token
# ---------------------------------------------------------------------------

class TestExpiredToken:
    def test_expired_token_returns_401(self, auth_client: TestClient) -> None:
        """A token whose 'exp' timestamp is in the past must be rejected with 401."""
        expired = _make_es256_token(exp_offset=-10)
        response = auth_client.get(
            ALERTS_URL, headers={"Authorization": f"Bearer {expired}"}
        )
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        assert "expir" in response.json().get("detail", "").lower()


# ---------------------------------------------------------------------------
# 4. Wrong issuer and wrong audience
# ---------------------------------------------------------------------------

class TestIssuerAndAudience:
    def test_wrong_issuer_returns_401(self, auth_client: TestClient) -> None:
        """A token with an issuer other than {SUPABASE_URL}/auth/v1 must be rejected."""
        wrong_iss_token = _make_es256_token(iss="https://malicious-project.supabase.co/auth/v1")
        response = auth_client.get(
            ALERTS_URL, headers={"Authorization": f"Bearer {wrong_iss_token}"}
        )
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        assert "issuer" in response.json().get("detail", "").lower()

    def test_missing_issuer_returns_401(self, auth_client: TestClient) -> None:
        """A token missing the 'iss' claim must be rejected."""
        no_iss_token = _make_es256_token(iss=None)
        response = auth_client.get(
            ALERTS_URL, headers={"Authorization": f"Bearer {no_iss_token}"}
        )
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_wrong_audience_returns_401(self, auth_client: TestClient) -> None:
        """A token with aud='anon' instead of 'authenticated' must be rejected."""
        wrong_aud_token = _make_es256_token(aud="anon")
        response = auth_client.get(
            ALERTS_URL, headers={"Authorization": f"Bearer {wrong_aud_token}"}
        )
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        assert "audience" in response.json().get("detail", "").lower()

    def test_missing_audience_returns_401(self, auth_client: TestClient) -> None:
        """A token missing the 'aud' claim must be rejected."""
        no_aud_token = _make_es256_token(aud=None)
        response = auth_client.get(
            ALERTS_URL, headers={"Authorization": f"Bearer {no_aud_token}"}
        )
        assert response.status_code == status.HTTP_401_UNAUTHORIZED


# ---------------------------------------------------------------------------
# 5. Missing or invalid subject (sub)
# ---------------------------------------------------------------------------

class TestSubjectClaim:
    def test_missing_subject_returns_401(self, auth_client: TestClient) -> None:
        """A token without 'sub' claim must be rejected."""
        no_sub_token = _make_es256_token(sub=None)
        response = auth_client.get(
            ALERTS_URL, headers={"Authorization": f"Bearer {no_sub_token}"}
        )
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_empty_string_subject_returns_401(self, auth_client: TestClient) -> None:
        """A token with an empty string subject must be rejected."""
        empty_sub_token = _make_es256_token(sub="")
        response = auth_client.get(
            ALERTS_URL, headers={"Authorization": f"Bearer {empty_sub_token}"}
        )
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        assert "sub" in response.json().get("detail", "").lower()

    def test_whitespace_subject_returns_401(self, auth_client: TestClient) -> None:
        """A token with a whitespace-only subject must be rejected."""
        ws_sub_token = _make_es256_token(sub="   ")
        response = auth_client.get(
            ALERTS_URL, headers={"Authorization": f"Bearer {ws_sub_token}"}
        )
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        assert "sub" in response.json().get("detail", "").lower()


# ---------------------------------------------------------------------------
# 6. Unknown or missing kid
# ---------------------------------------------------------------------------

class TestKeyIdHandling:
    def test_unknown_kid_returns_401(self, auth_client: TestClient) -> None:
        """A token referencing an unknown kid not in the JWKS must be rejected."""
        unknown_kid_token = _make_es256_token(kid=_UNKNOWN_KID)
        response = auth_client.get(
            ALERTS_URL, headers={"Authorization": f"Bearer {unknown_kid_token}"}
        )
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        assert "key id" in response.json().get("detail", "").lower()

    def test_missing_kid_header_returns_401(self, auth_client: TestClient) -> None:
        """A token without a 'kid' header must be rejected."""
        no_kid_token = _make_es256_token(kid=None)
        response = auth_client.get(
            ALERTS_URL, headers={"Authorization": f"Bearer {no_kid_token}"}
        )
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_different_ec_key_returns_401(self, auth_client: TestClient) -> None:
        """A token signed with another EC key but claiming kid=_TEST_KID fails verification."""
        forged_token = _make_es256_token(private_key=_ANOTHER_PRIVATE_KEY, kid=_TEST_KID)
        response = auth_client.get(
            ALERTS_URL, headers={"Authorization": f"Bearer {forged_token}"}
        )
        assert response.status_code == status.HTTP_401_UNAUTHORIZED


# ---------------------------------------------------------------------------
# 7. JWKS retrieval failure does not authenticate
# ---------------------------------------------------------------------------

class TestJwksRetrievalFailure:
    def test_jwks_connection_error_returns_503(
        self, monkeypatch: pytest.MonkeyPatch, client: TestClient
    ) -> None:
        """
        When the JWKS endpoint is unreachable, the server must fail closed with 503,
        never authenticating the request.
        """
        clear_jwk_client_cache()
        monkeypatch.setattr(config_module.settings, "SUPABASE_URL", _TEST_SUPABASE_URL)
        app.dependency_overrides.pop(verified_user, None)

        def _raise_connection_error(self):
            raise jwt.PyJWKClientConnectionError("Network connection to JWKS failed")

        monkeypatch.setattr(PyJWKClient, "fetch_data", _raise_connection_error)

        token = _valid_token()
        response = client.get(ALERTS_URL, headers={"Authorization": f"Bearer {token}"})
        assert response.status_code == status.HTTP_503_SERVICE_UNAVAILABLE
        assert response.status_code != status.HTTP_200_OK
        assert "unavailable" in response.json().get("detail", "").lower()

        clear_jwk_client_cache()


# ---------------------------------------------------------------------------
# 8. Missing configuration fails safely (503)
# ---------------------------------------------------------------------------

class TestMissingConfiguration:
    def test_missing_supabase_url_returns_503(
        self, monkeypatch: pytest.MonkeyPatch, client: TestClient
    ) -> None:
        """When SUPABASE_URL is not set (None), the endpoint returns 503."""
        clear_jwk_client_cache()
        monkeypatch.setattr(config_module.settings, "SUPABASE_URL", None)
        app.dependency_overrides.pop(verified_user, None)

        token = _valid_token()
        response = client.get(ALERTS_URL, headers={"Authorization": f"Bearer {token}"})
        assert response.status_code == status.HTTP_503_SERVICE_UNAVAILABLE
        assert "not configured" in response.json().get("detail", "").lower()

    def test_empty_supabase_url_returns_503(
        self, monkeypatch: pytest.MonkeyPatch, client: TestClient
    ) -> None:
        """When SUPABASE_URL is an empty or whitespace string, the endpoint returns 503."""
        clear_jwk_client_cache()
        monkeypatch.setattr(config_module.settings, "SUPABASE_URL", "   ")
        app.dependency_overrides.pop(verified_user, None)

        token = _valid_token()
        response = client.get(ALERTS_URL, headers={"Authorization": f"Bearer {token}"})
        assert response.status_code == status.HTTP_503_SERVICE_UNAVAILABLE


# ---------------------------------------------------------------------------
# 9. HS256 token is rejected by the ES256 verifier
# ---------------------------------------------------------------------------

class TestRejectHs256Token:
    def test_hs256_token_rejected_by_es256_verifier(
        self, auth_client: TestClient
    ) -> None:
        """
        A token signed with HS256 must be rejected. The verifier restricts accepted
        algorithms strictly to ES256 and never falls back to symmetric HS256.
        """
        now = int(time.time())
        hs_payload = {
            "sub": _TEST_USER_SUB,
            "aud": _SUPABASE_AUDIENCE,
            "iss": _TEST_ISSUER,
            "exp": now + 3600,
            "iat": now,
        }
        # Present an HS256 token even with kid=_TEST_KID
        hs_token = jwt.encode(
            hs_payload,
            "symmetric-secret-key-that-should-never-work-32b",
            algorithm="HS256",
            headers={"kid": _TEST_KID},
        )
        response = auth_client.get(
            ALERTS_URL, headers={"Authorization": f"Bearer {hs_token}"}
        )
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        assert response.status_code != status.HTTP_200_OK

    def test_hs256_token_without_kid_rejected(
        self, auth_client: TestClient
    ) -> None:
        """An HS256 token without a kid is also rejected with 401."""
        now = int(time.time())
        hs_payload = {
            "sub": _TEST_USER_SUB,
            "aud": _SUPABASE_AUDIENCE,
            "iss": _TEST_ISSUER,
            "exp": now + 3600,
            "iat": now,
        }
        hs_token = jwt.encode(
            hs_payload,
            "symmetric-secret-key-that-should-never-work-32b",
            algorithm="HS256",
        )
        response = auth_client.get(
            ALERTS_URL, headers={"Authorization": f"Bearer {hs_token}"}
        )
        assert response.status_code == status.HTTP_401_UNAUTHORIZED


# ---------------------------------------------------------------------------
# Scope boundary — Sensitive endpoints are protected
# ---------------------------------------------------------------------------

class TestScopeBoundary:
    def test_alert_by_id_requires_token(self, client: TestClient) -> None:
        """
        GET /api/alerts/{alert_id} is protected and must reject unauthenticated requests.
        """
        response = client.get("/api/alerts/ALT-8902")
        assert response.status_code in {status.HTTP_401_UNAUTHORIZED, status.HTTP_503_SERVICE_UNAVAILABLE}

    def test_account_transactions_requires_token(self, client: TestClient) -> None:
        """
        GET /api/accounts/{account_id}/transactions is protected and must reject unauthenticated requests.
        """
        response = client.get("/api/accounts/ACC-7749/transactions")
        assert response.status_code in {status.HTTP_401_UNAUTHORIZED, status.HTTP_503_SERVICE_UNAVAILABLE}

    def test_account_network_requires_token(self, client: TestClient) -> None:
        """
        GET /api/accounts/{account_id}/network is protected and must reject unauthenticated requests.
        """
        response = client.get("/api/accounts/ACC-7749/network")
        assert response.status_code in {status.HTTP_401_UNAUTHORIZED, status.HTTP_503_SERVICE_UNAVAILABLE}


# ---------------------------------------------------------------------------
# Safe diagnostics — PyJWTError logging at WARNING level
# ---------------------------------------------------------------------------

class TestSafeDiagnostics:
    def test_immature_token_logs_warning_with_class_name(
        self, auth_client: TestClient, caplog: pytest.LogCaptureFixture
    ) -> None:
        """
        When a token triggers ImmatureSignatureError (e.g. iat in the future),
        the verifier must log the exception class name at WARNING level,
        not leak the message/token, and return the generic 401 response.
        """
        now = int(time.time())
        future_token = _make_es256_token(extra_claims={"iat": now + 300})

        with caplog.at_level("WARNING"):
            response = auth_client.get(
                ALERTS_URL, headers={"Authorization": f"Bearer {future_token}"}
            )

        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        assert response.json().get("detail") == "Token verification failed."

        warning_records = [r for r in caplog.records if r.levelname == "WARNING"]
        assert len(warning_records) >= 1
        assert any("ImmatureSignatureError" in r.message for r in warning_records)

        # Confirm no sensitive tokens or bearer headers were leaked into logs
        for r in caplog.records:
            assert future_token not in r.message
            assert "Bearer" not in r.message

    def test_pyjwt_error_logs_only_class_name_without_exception_message(
        self, auth_client: TestClient, monkeypatch: pytest.MonkeyPatch, caplog: pytest.LogCaptureFixture
    ) -> None:
        """
        When PyJWT raises an unhandled PyJWTError, verify only the class name is logged
        at WARNING level without the exception message or sensitive data.
        """
        token = _valid_token()
        secret_msg = "super-sensitive-internal-message-12345"

        def _mock_decode(*args, **kwargs):
            raise jwt.InvalidKeyError(secret_msg)

        monkeypatch.setattr(jwt, "decode", _mock_decode)

        with caplog.at_level("WARNING"):
            response = auth_client.get(
                ALERTS_URL, headers={"Authorization": f"Bearer {token}"}
            )

        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        assert response.json().get("detail") == "Token verification failed."

        warning_records = [r for r in caplog.records if r.levelname == "WARNING"]
        assert any("InvalidKeyError" in r.message for r in warning_records)

        # Confirm the exception message string and token are not logged
        for r in caplog.records:
            assert secret_msg not in r.message
            assert token not in r.message


# ---------------------------------------------------------------------------
# Investigation Review Authentication & Identity Integrity
# ---------------------------------------------------------------------------

class TestInvestigationReviewAuth:
    """
    Tests for authentication and reviewer identity integrity on
    POST /api/investigations/{investigation_id}/review.
    """

    REVIEW_URL = "/api/investigations/ALT-8902/review"
    SAMPLE_PAYLOAD = {
        "alert_id": "ALT-8902",
        "decision": "confirm_fraud",
        "notes": "Adjudication under verified token.",
        "investigator_id": "attacker-spoofed-id",
        "tags": ["fraud_confirmed"],
    }

    def test_review_missing_token_returns_401(self, auth_client: TestClient) -> None:
        """POST /api/investigations/.../review without Authorization header must return 401."""
        response = auth_client.post(self.REVIEW_URL, json=self.SAMPLE_PAYLOAD)
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        assert response.json().get("detail") == "Missing authorization token."

    def test_review_malformed_token_returns_401(self, auth_client: TestClient) -> None:
        """POST /api/investigations/.../review with a malformed token must return 401."""
        response = auth_client.post(
            self.REVIEW_URL,
            json=self.SAMPLE_PAYLOAD,
            headers={"Authorization": "Bearer not.a.jwt"},
        )
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_review_tampered_signature_returns_401(self, auth_client: TestClient) -> None:
        """POST /api/investigations/.../review with tampered signature must return 401."""
        parts = _valid_token().split(".")
        sig_bytes = bytearray(base64.urlsafe_b64decode(parts[2] + "=="))
        sig_bytes[0] ^= 0xFF
        parts[2] = base64.urlsafe_b64encode(sig_bytes).rstrip(b"=").decode()
        tampered = ".".join(parts)

        response = auth_client.post(
            self.REVIEW_URL,
            json=self.SAMPLE_PAYLOAD,
            headers={"Authorization": f"Bearer {tampered}"},
        )
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_review_expired_token_returns_401(self, auth_client: TestClient) -> None:
        """POST /api/investigations/.../review with an expired token must return 401."""
        expired = _make_es256_token(exp_offset=-60)
        response = auth_client.post(
            self.REVIEW_URL,
            json=self.SAMPLE_PAYLOAD,
            headers={"Authorization": f"Bearer {expired}"},
        )
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        assert "expir" in response.json().get("detail", "").lower()

    def test_review_valid_token_succeeds(
        self, auth_client: TestClient, auth_header: dict[str, str]
    ) -> None:
        """A valid authenticated request successfully submits a review and records adjudication."""
        response = auth_client.post(
            self.REVIEW_URL,
            json=self.SAMPLE_PAYLOAD,
            headers=auth_header,
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["alert_id"] == "ALT-8902"
        assert data["decision"] == "confirm_fraud"
        assert data["status"] == "recorded"
        assert "review_id" in data

    def test_review_persists_verified_sub_ignoring_body_investigator_id(
        self, auth_client: TestClient, auth_header: dict[str, str]
    ) -> None:
        """
        The stored reviewer identity must come from the authenticated token subject,
        never from the client-supplied 'investigator_id' in the JSON body.
        """
        spoofed_payload = {
            "alert_id": "ALT-8902",
            "decision": "needs_escalation",
            "notes": "Verifying reviewer identity cannot be spoofed.",
            "investigator_id": "malicious-actor-spoofing-senior-agent",
        }
        response = auth_client.post(
            self.REVIEW_URL,
            json=spoofed_payload,
            headers=auth_header,
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        # Identity MUST be the verified user's sub, NOT the spoofed payload string
        assert data["investigator_id"] == _TEST_USER_SUB
        assert data["investigator_id"] != "malicious-actor-spoofing-senior-agent"

    def test_review_omitted_investigator_id_succeeds_with_verified_sub(
        self, auth_client: TestClient, auth_header: dict[str, str]
    ) -> None:
        """When investigator_id is omitted from the request body, token subject is used."""
        clean_payload = {
            "alert_id": "ALT-8902",
            "decision": "false_positive",
            "notes": "Legitimate transaction confirmed by customer contact.",
        }
        response = auth_client.post(
            self.REVIEW_URL,
            json=clean_payload,
            headers=auth_header,
        )
        assert response.status_code == status.HTTP_200_OK
        assert response.json()["investigator_id"] == _TEST_USER_SUB

    def test_review_invalid_decision_returns_422(
        self, auth_client: TestClient, auth_header: dict[str, str]
    ) -> None:
        """An invalid decision enum value must be rejected with 422 Unprocessable Entity."""
        bad_decision_payload = {
            "alert_id": "ALT-8902",
            "decision": "invalid_decision_verdict",
            "notes": "Testing validation error",
        }
        response = auth_client.post(
            self.REVIEW_URL,
            json=bad_decision_payload,
            headers=auth_header,
        )
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    def test_review_status_transitions(
        self, auth_client: TestClient, auth_header: dict[str, str]
    ) -> None:
        """Confirm all three valid decisions transition alert status correctly."""
        # 1. confirm_fraud -> escalated
        auth_client.post(
            self.REVIEW_URL,
            json={"alert_id": "ALT-8902", "decision": "confirm_fraud", "notes": "step 1"},
            headers=auth_header,
        )
        assert auth_client.get("/api/alerts/ALT-8902", headers=auth_header).json()["status"] == "escalated"

        # 2. false_positive -> dismissed
        auth_client.post(
            self.REVIEW_URL,
            json={"alert_id": "ALT-8902", "decision": "false_positive", "notes": "step 2"},
            headers=auth_header,
        )
        assert auth_client.get("/api/alerts/ALT-8902", headers=auth_header).json()["status"] == "dismissed"

        # 3. needs_escalation -> under_review
        auth_client.post(
            self.REVIEW_URL,
            json={"alert_id": "ALT-8902", "decision": "needs_escalation", "notes": "step 3"},
            headers=auth_header,
        )
        assert auth_client.get("/api/alerts/ALT-8902", headers=auth_header).json()["status"] == "under_review"

    def test_review_mismatched_alert_id_returns_400(
        self, auth_client: TestClient, auth_header: dict[str, str]
    ) -> None:
        """
        Submitting a review where path investigation_id does not match body alert_id
        must return 400 Bad Request and must NOT alter any records.
        """
        # REVIEW_URL is /api/investigations/ALT-8902/review
        mismatched_payload = {
            "alert_id": "ALT-8899",
            "decision": "confirm_fraud",
            "notes": "Attempting cross-alert mutation attack",
        }
        response = auth_client.post(
            self.REVIEW_URL,
            json=mismatched_payload,
            headers=auth_header,
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "mismatch" in response.json().get("detail", "").lower()

        # Confirm neither record was mutated
        alert_8902 = auth_client.get("/api/alerts/ALT-8902", headers=auth_header).json()
        alert_8899 = auth_client.get("/api/alerts/ALT-8899", headers=auth_header).json()
        assert alert_8902["status"] == "open"
        assert alert_8899["status"] == "under_review"

    def test_review_matching_nonexistent_id_returns_404(
        self, auth_client: TestClient, auth_header: dict[str, str]
    ) -> None:
        """
        Submitting a review where path and body match but alert does not exist
        must return 404 Not Found.
        """
        payload = {
            "alert_id": "ALT-NONEXISTENT",
            "decision": "false_positive",
            "notes": "Nonexistent record",
        }
        response = auth_client.post(
            "/api/investigations/ALT-NONEXISTENT/review",
            json=payload,
            headers=auth_header,
        )
        assert response.status_code == status.HTTP_404_NOT_FOUND




# ---------------------------------------------------------------------------
# Transaction Scoring Authentication & Side-Effect Protection
# ---------------------------------------------------------------------------

class TestTransactionScoringAuth:
    """
    Tests for authentication and authorization on POST /api/transactions/score.
    Ensures anonymous write access is closed and the endpoint requires a verified Supabase bearer token.
    """

    SCORE_URL = "/api/transactions/score"
    HIGH_RISK_PAYLOAD = {
        "transaction": {
            "sender_account_id": "ACC-7749",
            "receiver_account_id": "ACC-4410",
            "amount": 25000.0,
            "currency": "USD",
            "channel": "crypto",
            "location_country": "US",
        },
        "account_history_lookback_days": 30,
        "include_graph_context": True,
    }
    LOW_RISK_PAYLOAD = {
        "transaction": {
            "sender_account_id": "ACC-CLEAN",
            "receiver_account_id": "ACC-GROCERY",
            "amount": 42.50,
            "currency": "USD",
            "channel": "card",
            "location_country": "US",
        },
        "account_history_lookback_days": 30,
        "include_graph_context": False,
    }

    def test_score_missing_token_returns_401(self, auth_client: TestClient) -> None:
        """POST /api/transactions/score without Authorization header must return 401."""
        response = auth_client.post(self.SCORE_URL, json=self.HIGH_RISK_PAYLOAD)
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        assert response.json().get("detail") == "Missing authorization token."

    def test_score_malformed_token_returns_401(self, auth_client: TestClient) -> None:
        """POST /api/transactions/score with a malformed token must return 401."""
        response = auth_client.post(
            self.SCORE_URL,
            json=self.HIGH_RISK_PAYLOAD,
            headers={"Authorization": "Bearer not.a.jwt"},
        )
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        assert "malformed" in response.json().get("detail", "").lower()

    def test_score_tampered_signature_returns_401(self, auth_client: TestClient) -> None:
        """POST /api/transactions/score with a tampered token signature must return 401."""
        parts = _valid_token().split(".")
        sig_bytes = bytearray(base64.urlsafe_b64decode(parts[2] + "=="))
        sig_bytes[0] ^= 0xFF
        parts[2] = base64.urlsafe_b64encode(sig_bytes).rstrip(b"=").decode()
        tampered = ".".join(parts)

        response = auth_client.post(
            self.SCORE_URL,
            json=self.HIGH_RISK_PAYLOAD,
            headers={"Authorization": f"Bearer {tampered}"},
        )
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        assert "signature" in response.json().get("detail", "").lower()

    def test_score_expired_token_returns_401(self, auth_client: TestClient) -> None:
        """POST /api/transactions/score with an expired token must return 401."""
        expired = _make_es256_token(exp_offset=-60)
        response = auth_client.post(
            self.SCORE_URL,
            json=self.HIGH_RISK_PAYLOAD,
            headers={"Authorization": f"Bearer {expired}"},
        )
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        assert "expir" in response.json().get("detail", "").lower()

    def test_score_wrong_issuer_returns_401(self, auth_client: TestClient) -> None:
        """POST /api/transactions/score with a wrong issuer must return 401."""
        bad_token = _make_es256_token(iss="https://untrusted-issuer.example.com/auth/v1")
        response = auth_client.post(
            self.SCORE_URL,
            json=self.HIGH_RISK_PAYLOAD,
            headers={"Authorization": f"Bearer {bad_token}"},
        )
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        assert "issuer" in response.json().get("detail", "").lower()

    def test_score_wrong_audience_returns_401(self, auth_client: TestClient) -> None:
        """POST /api/transactions/score with a wrong audience must return 401."""
        bad_token = _make_es256_token(aud="unauthorized-service")
        response = auth_client.post(
            self.SCORE_URL,
            json=self.HIGH_RISK_PAYLOAD,
            headers={"Authorization": f"Bearer {bad_token}"},
        )
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        assert "audience" in response.json().get("detail", "").lower()

    def test_rejected_request_produces_no_side_effects(
        self, auth_client: TestClient, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        """
        Rejected requests (missing or invalid tokens) must not invoke the scoring
        pipeline or create any transaction or alert side effects in the repository.
        """
        from app.repositories.base import repo
        from app.services.scoring_service import scoring_service

        txns_before = len(repo._transactions)
        alerts_before = len(repo._alerts)

        score_called = False
        original_score = scoring_service.score_transaction

        def _spy_score(*args, **kwargs):
            nonlocal score_called
            score_called = True
            return original_score(*args, **kwargs)

        monkeypatch.setattr(scoring_service, "score_transaction", _spy_score)

        # 1. Missing token
        resp1 = auth_client.post(self.SCORE_URL, json=self.HIGH_RISK_PAYLOAD)
        assert resp1.status_code == status.HTTP_401_UNAUTHORIZED

        # 2. Invalid/expired token
        expired = _make_es256_token(exp_offset=-60)
        resp2 = auth_client.post(
            self.SCORE_URL,
            json=self.HIGH_RISK_PAYLOAD,
            headers={"Authorization": f"Bearer {expired}"},
        )
        assert resp2.status_code == status.HTTP_401_UNAUTHORIZED

        # Verify scoring service was never invoked
        assert not score_called, "Scoring service was invoked on an unauthenticated request"

        # Verify no transactions or alerts were persisted
        assert len(repo._transactions) == txns_before, "A transaction was persisted by an unauthenticated request"
        assert len(repo._alerts) == alerts_before, "An alert was persisted by an unauthenticated request"

    def test_score_valid_token_high_risk_succeeds_and_persists_alert(
        self, auth_client: TestClient, auth_header: dict[str, str]
    ) -> None:
        """
        A valid authenticated request successfully executes scoring, returns the expected
        contract, persists the transaction, and creates an alert for high-risk transactions.
        """
        from app.repositories.base import repo

        txns_before = len(repo._transactions)
        alerts_before = len(repo._alerts)

        response = auth_client.post(
            self.SCORE_URL,
            json=self.HIGH_RISK_PAYLOAD,
            headers=auth_header,
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.json()

        # Contract assertions
        assert "risk_score" in data
        assert data["risk_score"] > 0
        assert data["is_alert_triggered"] is True
        assert data["suggested_severity"] in ["medium", "high", "critical"]
        assert "factors" in data
        assert data["confidence"] > 0
        assert "scored_at" in data
        assert data["transaction_id"] is not None
        assert data["transaction_id"].startswith("TXN-")

        # Persistence assertions
        assert len(repo._transactions) == txns_before + 1
        assert len(repo._alerts) == alerts_before + 1
        assert data["transaction_id"] in repo._transactions

    def test_score_valid_token_low_risk_succeeds_without_alert(
        self, auth_client: TestClient, auth_header: dict[str, str]
    ) -> None:
        """
        A valid authenticated request for a low-risk transaction persists the transaction
        without triggering an alert.
        """
        from app.repositories.base import repo

        alerts_before = len(repo._alerts)

        response = auth_client.post(
            self.SCORE_URL,
            json=self.LOW_RISK_PAYLOAD,
            headers=auth_header,
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["risk_score"] < 50.0
        assert data["is_alert_triggered"] is False
        assert data["suggested_severity"] == "low"
        assert len(repo._alerts) == alerts_before

    def test_score_invalid_payload_with_valid_token_returns_422(
        self, auth_client: TestClient, auth_header: dict[str, str]
    ) -> None:
        """
        An authenticated request with invalid schema payload returns 422 Unprocessable Entity,
        confirming Pydantic request validation operates as expected behind authentication.
        """
        invalid_payload = {
            "transaction": {
                "sender_account_id": "ACC-7749",
                # missing receiver_account_id and amount
            }
        }
        response = auth_client.post(
            self.SCORE_URL,
            json=invalid_payload,
            headers=auth_header,
        )
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    def test_score_unknown_kid_returns_401(self, auth_client: TestClient) -> None:
        """POST /api/transactions/score with an unknown kid must return 401."""
        unknown_kid_token = _make_es256_token(kid=_UNKNOWN_KID)
        response = auth_client.post(
            self.SCORE_URL,
            json=self.HIGH_RISK_PAYLOAD,
            headers={"Authorization": f"Bearer {unknown_kid_token}"},
        )
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        assert "key id" in response.json().get("detail", "").lower()

    def test_score_missing_sub_returns_401(self, auth_client: TestClient) -> None:
        """POST /api/transactions/score with missing subject claim must return 401."""
        no_sub_token = _make_es256_token(sub=None)
        response = auth_client.post(
            self.SCORE_URL,
            json=self.HIGH_RISK_PAYLOAD,
            headers={"Authorization": f"Bearer {no_sub_token}"},
        )
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_score_hs256_token_returns_401(self, auth_client: TestClient) -> None:
        """POST /api/transactions/score with an HS256 symmetric token must be rejected."""
        now = int(time.time())
        hs_payload = {
            "sub": _TEST_USER_SUB,
            "aud": _SUPABASE_AUDIENCE,
            "iss": _TEST_ISSUER,
            "exp": now + 3600,
            "iat": now,
        }
        hs_token = jwt.encode(
            hs_payload,
            "symmetric-secret-key-that-should-never-work-32b",
            algorithm="HS256",
            headers={"kid": _TEST_KID},
        )
        response = auth_client.post(
            self.SCORE_URL,
            json=self.HIGH_RISK_PAYLOAD,
            headers={"Authorization": f"Bearer {hs_token}"},
        )
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_score_non_bearer_scheme_returns_401(self, auth_client: TestClient) -> None:
        """A Basic authorization header must be rejected with 401."""
        response = auth_client.post(
            self.SCORE_URL,
            json=self.HIGH_RISK_PAYLOAD,
            headers={"Authorization": f"Basic {_valid_token()}"},
        )
        assert response.status_code == status.HTTP_401_UNAUTHORIZED


# ---------------------------------------------------------------------------
# GET /api/alerts/{alert_id} Authentication & Protection
# ---------------------------------------------------------------------------

class TestAlertByIdAuth:
    """
    Tests for authentication on GET /api/alerts/{alert_id}.
    """

    ALERT_URL = "/api/alerts/ALT-8902"

    def test_alert_by_id_missing_token_returns_401(self, auth_client: TestClient) -> None:
        """GET /api/alerts/{id} without token returns 401."""
        response = auth_client.get(self.ALERT_URL)
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        assert response.json().get("detail") == "Missing authorization token."

    def test_alert_by_id_malformed_token_returns_401(self, auth_client: TestClient) -> None:
        """GET /api/alerts/{id} with malformed token returns 401."""
        response = auth_client.get(
            self.ALERT_URL,
            headers={"Authorization": "Bearer not.a.jwt"},
        )
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_alert_by_id_expired_token_returns_401(self, auth_client: TestClient) -> None:
        """GET /api/alerts/{id} with expired token returns 401."""
        expired = _make_es256_token(exp_offset=-60)
        response = auth_client.get(
            self.ALERT_URL,
            headers={"Authorization": f"Bearer {expired}"},
        )
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_alert_by_id_tampered_token_returns_401(self, auth_client: TestClient) -> None:
        """GET /api/alerts/{id} with tampered token returns 401."""
        parts = _valid_token().split(".")
        sig_bytes = bytearray(base64.urlsafe_b64decode(parts[2] + "=="))
        sig_bytes[0] ^= 0xFF
        parts[2] = base64.urlsafe_b64encode(sig_bytes).rstrip(b"=").decode()
        tampered = ".".join(parts)

        response = auth_client.get(
            self.ALERT_URL,
            headers={"Authorization": f"Bearer {tampered}"},
        )
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_alert_by_id_valid_token_succeeds(
        self, auth_client: TestClient, auth_header: dict[str, str]
    ) -> None:
        """GET /api/alerts/{id} with valid token returns 200 OK and alert payload."""
        response = auth_client.get(self.ALERT_URL, headers=auth_header)
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["id"] == "ALT-8902"
        assert data["severity"] == "critical"
        assert data["risk_score"] == 94.0

    def test_alert_by_id_valid_token_not_found_returns_404(
        self, auth_client: TestClient, auth_header: dict[str, str]
    ) -> None:
        """GET /api/alerts/{id} with valid token returns 404 if not found."""
        response = auth_client.get("/api/alerts/NON-EXISTENT", headers=auth_header)
        assert response.status_code == status.HTTP_404_NOT_FOUND


# ---------------------------------------------------------------------------
# GET /api/accounts/{account_id}/transactions Authentication & Protection
# ---------------------------------------------------------------------------

class TestAccountTransactionsAuth:
    """
    Tests for authentication on GET /api/accounts/{account_id}/transactions.
    """

    TXN_URL = "/api/accounts/ACC-7749/transactions"

    def test_transactions_missing_token_returns_401(self, auth_client: TestClient) -> None:
        """GET /api/accounts/{id}/transactions without token returns 401."""
        response = auth_client.get(self.TXN_URL)
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        assert response.json().get("detail") == "Missing authorization token."

    def test_transactions_malformed_token_returns_401(self, auth_client: TestClient) -> None:
        """GET /api/accounts/{id}/transactions with malformed token returns 401."""
        response = auth_client.get(
            self.TXN_URL,
            headers={"Authorization": "Bearer not.a.jwt"},
        )
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_transactions_expired_token_returns_401(self, auth_client: TestClient) -> None:
        """GET /api/accounts/{id}/transactions with expired token returns 401."""
        expired = _make_es256_token(exp_offset=-60)
        response = auth_client.get(
            self.TXN_URL,
            headers={"Authorization": f"Bearer {expired}"},
        )
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_transactions_tampered_token_returns_401(self, auth_client: TestClient) -> None:
        """GET /api/accounts/{id}/transactions with tampered token returns 401."""
        parts = _valid_token().split(".")
        sig_bytes = bytearray(base64.urlsafe_b64decode(parts[2] + "=="))
        sig_bytes[0] ^= 0xFF
        parts[2] = base64.urlsafe_b64encode(sig_bytes).rstrip(b"=").decode()
        tampered = ".".join(parts)

        response = auth_client.get(
            self.TXN_URL,
            headers={"Authorization": f"Bearer {tampered}"},
        )
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_transactions_valid_token_succeeds(
        self, auth_client: TestClient, auth_header: dict[str, str]
    ) -> None:
        """GET /api/accounts/{id}/transactions with valid token returns 200 OK and transactions."""
        response = auth_client.get(self.TXN_URL, headers=auth_header)
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 1

    def test_transactions_valid_token_empty_account_returns_empty_list(
        self, auth_client: TestClient, auth_header: dict[str, str]
    ) -> None:
        """GET /api/accounts/{id}/transactions with valid token returns empty list for unknown account."""
        response = auth_client.get("/api/accounts/ACC-NONEXISTENT/transactions", headers=auth_header)
        assert response.status_code == status.HTTP_200_OK
        assert response.json() == []


# ---------------------------------------------------------------------------
# GET /api/accounts/{account_id}/network Authentication & Protection
# ---------------------------------------------------------------------------

class TestAccountNetworkAuth:
    """
    Tests for authentication on GET /api/accounts/{account_id}/network.
    """

    NETWORK_URL = "/api/accounts/ACC-7749/network"

    def test_network_missing_token_returns_401(self, auth_client: TestClient) -> None:
        """GET /api/accounts/{id}/network without token returns 401."""
        response = auth_client.get(self.NETWORK_URL)
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        assert response.json().get("detail") == "Missing authorization token."

    def test_network_malformed_token_returns_401(self, auth_client: TestClient) -> None:
        """GET /api/accounts/{id}/network with malformed token returns 401."""
        response = auth_client.get(
            self.NETWORK_URL,
            headers={"Authorization": "Bearer not.a.jwt"},
        )
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_network_expired_token_returns_401(self, auth_client: TestClient) -> None:
        """GET /api/accounts/{id}/network with expired token returns 401."""
        expired = _make_es256_token(exp_offset=-60)
        response = auth_client.get(
            self.NETWORK_URL,
            headers={"Authorization": f"Bearer {expired}"},
        )
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_network_tampered_token_returns_401(self, auth_client: TestClient) -> None:
        """GET /api/accounts/{id}/network with tampered token returns 401."""
        parts = _valid_token().split(".")
        sig_bytes = bytearray(base64.urlsafe_b64decode(parts[2] + "=="))
        sig_bytes[0] ^= 0xFF
        parts[2] = base64.urlsafe_b64encode(sig_bytes).rstrip(b"=").decode()
        tampered = ".".join(parts)

        response = auth_client.get(
            self.NETWORK_URL,
            headers={"Authorization": f"Bearer {tampered}"},
        )
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_network_valid_token_succeeds(
        self, auth_client: TestClient, auth_header: dict[str, str]
    ) -> None:
        """GET /api/accounts/{id}/network with valid token returns 200 OK and network graph."""
        response = auth_client.get(self.NETWORK_URL, headers=auth_header)
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["account_id"] == "ACC-7749"
        assert "nodes" in data
        assert "edges" in data

    def test_network_valid_token_replay_mode_succeeds(
        self, auth_client: TestClient, auth_header: dict[str, str]
    ) -> None:
        """GET /api/accounts/{id}/network with valid token supports as_of_step replay."""
        response = auth_client.get(f"{self.NETWORK_URL}?as_of_step=1", headers=auth_header)
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["metrics"]["current_replay_step"] == 1


