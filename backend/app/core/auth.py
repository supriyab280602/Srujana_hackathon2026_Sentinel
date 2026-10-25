"""
Sentinel Authentication Dependency
===================================
Verifies Supabase access tokens issued to authenticated users using
asymmetric ES256 signing and Supabase's published JWKS endpoint.

Supabase Auth uses ECC (P-256) asymmetric key pairs with algorithm ES256.
Public keys are published at:
    {SUPABASE_URL}/auth/v1/.well-known/jwks.json

Usage
-----
Inject :func:`verified_user` into any FastAPI route to require authentication::

    from app.core.auth import verified_user, VerifiedUser

    @router.get("/protected")
    def protected(user: VerifiedUser = Depends(verified_user)):
        return {"sub": user.sub}

Token format
------------
The bearer token must carry the following claims:
- ``sub``  – subject (Supabase user UUID, non-empty)
- ``aud``  – ``"authenticated"`` (issued by Supabase for signed-in users)
- ``exp``  – expiry timestamp (validated automatically by PyJWT)
- ``iss``  – ``"{SUPABASE_URL}/auth/v1"`` (expected issuer)

HTTP responses
--------------
- ``401 Unauthorized``        – token missing, malformed, expired, wrong audience,
                                wrong issuer, unknown key ID, or bad signature
- ``503 Service Unavailable`` – ``SUPABASE_URL`` not configured or JWKS
                                endpoint connection failure; never silently passes tokens
"""

from __future__ import annotations

import logging
from typing import Annotated, Any

import jwt
from jwt import PyJWKClient
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel, Field

from app.core.config import settings

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Bearer-token extractor
# auto_error=False prevents FastAPI from raising 403 automatically on missing
# headers so we can return a consistent 401 response.
# ---------------------------------------------------------------------------
_bearer_scheme = HTTPBearer(auto_error=False)

# Supabase always issues tokens with this audience claim for signed-in users.
_SUPABASE_AUDIENCE = "authenticated"

# Algorithm mandated for asymmetric verification (ECC P-256)
_ALLOWED_ALGORITHM = "ES256"


class VerifiedUser(BaseModel):
    """Identity extracted from a verified Supabase token."""

    sub: str  # Supabase user UUID
    email: str | None = None  # present in most Supabase tokens, optional here
    role: str | None = None  # standard Supabase role or app_metadata role
    app_metadata: dict[str, Any] = Field(default_factory=dict)


# ---------------------------------------------------------------------------
# JWKS Client Management & URL Normalization
# ---------------------------------------------------------------------------
_jwk_clients: dict[str, PyJWKClient] = {}


def get_normalized_supabase_url() -> str | None:
    """Return configured SUPABASE_URL stripped of trailing slashes, or None."""
    raw = getattr(settings, "SUPABASE_URL", None)
    if not raw:
        return None
    cleaned = raw.strip().rstrip("/")
    return cleaned if cleaned else None


def get_jwks_url(supabase_url: str) -> str:
    """Return the published JWKS endpoint for the given Supabase URL."""
    return f"{supabase_url}/auth/v1/.well-known/jwks.json"


def get_expected_issuer(supabase_url: str) -> str:
    """Return the expected JWT issuer for the given Supabase URL."""
    return f"{supabase_url}/auth/v1"


def get_jwk_client(jwks_url: str) -> PyJWKClient:
    """
    Get or create a cached PyJWKClient for the given JWKS URL.
    Uses default caching (cache_jwk_set=True, lifespan=300) with key rotation support.
    """
    client = _jwk_clients.get(jwks_url)
    if client is None:
        client = PyJWKClient(jwks_url, cache_jwk_set=True, lifespan=300)
        _jwk_clients[jwks_url] = client
    return client


def clear_jwk_client_cache() -> None:
    """Clear internal JWK client cache (used in testing or reconfiguration)."""
    _jwk_clients.clear()


def verified_user(
    credentials: Annotated[
        HTTPAuthorizationCredentials | None,
        Depends(_bearer_scheme),
    ],
) -> VerifiedUser:
    """
    FastAPI dependency that validates a Supabase ES256 bearer token against JWKS.

    Returns a :class:`VerifiedUser` on success.
    Raises :class:`HTTPException`:
    - 503 if ``SUPABASE_URL`` is not configured or JWKS endpoint is unreachable.
    - 401 if the token is absent, malformed, expired, wrong audience, wrong issuer,
      wrong algorithm, or has an invalid/unknown signature key.
    """
    supabase_url = get_normalized_supabase_url()
    if not supabase_url:
        logger.error(
            "SUPABASE_URL is not configured — cannot verify bearer tokens. "
            "Set the environment variable and restart the server."
        )
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Authentication service is not configured.",
        )

    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing authorization token.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = credentials.credentials
    jwks_url = get_jwks_url(supabase_url)
    expected_issuer = get_expected_issuer(supabase_url)
    jwk_client = get_jwk_client(jwks_url)

    try:
        signing_key = jwk_client.get_signing_key_from_jwt(token)
        payload = jwt.decode(
            token,
            signing_key.key,
            algorithms=[_ALLOWED_ALGORITHM],
            audience=_SUPABASE_AUDIENCE,
            issuer=expected_issuer,
            options={
                "require": ["sub", "exp", "aud", "iss"],
            },
        )
    except jwt.PyJWKClientConnectionError:
        logger.error("Failed to connect to JWKS endpoint for token verification.")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Authentication service unavailable.",
        )
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.InvalidAudienceError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token audience.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.InvalidIssuerError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token issuer.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.InvalidSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token signature verification failed.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.DecodeError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token is malformed.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except (jwt.PyJWKClientError, jwt.PyJWKSetError, jwt.PyJWKError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token key ID is unknown or invalid.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.InvalidAlgorithmError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token algorithm.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.MissingRequiredClaimError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token is missing required claim.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.PyJWTError as exc:
        logger.warning("JWT verification failed with %s", type(exc).__name__)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token verification failed.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    sub = payload.get("sub")
    if not sub or not isinstance(sub, str) or not sub.strip():
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token is missing or invalid 'sub' claim.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    app_metadata = payload.get("app_metadata")
    safe_app_metadata = app_metadata if isinstance(app_metadata, dict) else {}
    raw_role = safe_app_metadata.get("role") or payload.get("role")
    role_str = raw_role if isinstance(raw_role, str) and raw_role.strip() else None

    return VerifiedUser(
        sub=sub,
        email=payload.get("email"),
        role=role_str,
        app_metadata=safe_app_metadata,
    )
