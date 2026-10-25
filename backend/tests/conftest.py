import pytest
import sys
import os
from fastapi.testclient import TestClient

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.main import app
from app.repositories.base import repo
from app.core.auth import VerifiedUser, verified_user


@pytest.fixture(autouse=True)
def isolate_repository_state():
    """
    Ensure in-memory repository state is completely isolated across tests.

    Deep-copies Pydantic model instances so that in-place mutations
    (e.g. alert.status = 'escalated' inside add_review) made during one test
    do not bleed into subsequent tests through shared object references.
    A shallow dict copy preserves the same model objects; model_copy(deep=True)
    produces independent copies whose fields can be mutated without affecting
    the originals stored in the snapshot.
    """
    # Deep-copy each Pydantic model to prevent shared-reference mutations
    initial_alerts = {k: v.model_copy(deep=True) for k, v in repo._alerts.items()}
    initial_txns = {k: v.model_copy(deep=True) for k, v in repo._transactions.items()}
    initial_reviews = list(repo._reviews)
    yield
    repo.reset_alerts(initial_alerts)
    repo.reset_transactions(initial_txns)
    repo._reviews = list(initial_reviews)


@pytest.fixture
def client():
    with TestClient(app) as test_client:
        yield test_client


# ---------------------------------------------------------------------------
# authed_client — for integration tests that need to access protected routes
# but are testing business logic, not authentication itself.
#
# Uses FastAPI dependency_overrides to bypass verified_user with a stub that
# returns a fixed VerifiedUser.  Auth correctness is tested separately in
# tests/test_auth.py using real PyJWT-signed ES256 tokens and mock JWKS.
# ---------------------------------------------------------------------------
_STUB_USER = VerifiedUser(sub="00000000-0000-0000-0000-000000000099", email="test@sentinel.test")


@pytest.fixture
def authed_client():
    """TestClient with verified_user dependency stubbed out for integration tests."""
    app.dependency_overrides[verified_user] = lambda: _STUB_USER
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.pop(verified_user, None)
