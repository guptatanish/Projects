import base64
from datetime import datetime, timedelta, timezone
import hashlib
import hmac
import json
import secrets
from typing import Any

from app.core.config import settings


def _b64url_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode("ascii")


def _b64url_decode(segment: str) -> bytes:
    padding = "=" * (-len(segment) % 4)
    return base64.urlsafe_b64decode(f"{segment}{padding}".encode("ascii"))


def hash_password(password: str, iterations: int = 210_000) -> str:
    """Hash a plain-text password using a random salt and PBKDF2-HMAC-SHA256."""
    if not password:
        raise ValueError("Password cannot be empty.")
    salt = secrets.token_bytes(16)
    digest = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt,
        iterations,
    )
    return f"pbkdf2_sha256${iterations}${_b64url_encode(salt)}${_b64url_encode(digest)}"


def verify_password(plain_password: str, stored_hash: str) -> bool:
    """Verify a plain-text password against a stored PBKDF2 hash in constant time."""
    if not plain_password or not stored_hash:
        return False
    parts = stored_hash.split("$")
    if len(parts) != 4 or parts[0] != "pbkdf2_sha256":
        return False
    try:
        iterations = int(parts[1])
        salt = _b64url_decode(parts[2])
        expected_digest = _b64url_decode(parts[3])
    except Exception:
        return False

    actual_digest = hashlib.pbkdf2_hmac(
        "sha256",
        plain_password.encode("utf-8"),
        salt,
        iterations,
    )
    return hmac.compare_digest(actual_digest, expected_digest)


def create_access_token(
    subject: str | int,
    *,
    expires_minutes: int | None = None,
    extra_claims: dict[str, Any] | None = None,
) -> str:
    """Create a signed compact JWT string with `sub`, `iat`, and `exp` claims."""
    now = datetime.now(timezone.utc)
    ttl_minutes = (
        settings.access_token_expire_minutes
        if expires_minutes is None
        else expires_minutes
    )
    exp_dt = now + timedelta(minutes=ttl_minutes)

    header = {"alg": "HS256", "typ": "JWT"}
    payload: dict[str, Any] = {
        "sub": str(subject),
        "iat": int(now.timestamp()),
        "exp": int(exp_dt.timestamp()),
    }
    if extra_claims:
        for k, v in extra_claims.items():
            if k not in {"sub", "iat", "exp"}:
                payload[k] = v

    encoded_header = _b64url_encode(
        json.dumps(header, separators=(",", ":"), sort_keys=True).encode("utf-8")
    )
    encoded_payload = _b64url_encode(
        json.dumps(payload, separators=(",", ":"), sort_keys=True).encode("utf-8")
    )
    signing_input = f"{encoded_header}.{encoded_payload}".encode("ascii")
    signature = hmac.new(
        settings.jwt_secret_key.encode("utf-8"),
        signing_input,
        hashlib.sha256,
    ).digest()
    return f"{encoded_header}.{encoded_payload}.{_b64url_encode(signature)}"


def decode_access_token(token: str) -> dict[str, Any] | None:
    """Decode and verify a signed JWT; returns payload dict or None if invalid/expired."""
    if not token or not isinstance(token, str):
        return None
    segments = token.split(".")
    if len(segments) != 3:
        return None

    encoded_header, encoded_payload, encoded_sig = segments
    signing_input = f"{encoded_header}.{encoded_payload}".encode("ascii")
    expected_sig = hmac.new(
        settings.jwt_secret_key.encode("utf-8"),
        signing_input,
        hashlib.sha256,
    ).digest()

    try:
        actual_sig = _b64url_decode(encoded_sig)
        header_data = json.loads(_b64url_decode(encoded_header).decode("utf-8"))
        payload_data = json.loads(_b64url_decode(encoded_payload).decode("utf-8"))
    except Exception:
        return None

    if not isinstance(header_data, dict) or header_data.get("alg") != "HS256":
        return None
    if not isinstance(payload_data, dict):
        return None
    if not hmac.compare_digest(actual_sig, expected_sig):
        return None

    exp_val = payload_data.get("exp")
    sub_val = payload_data.get("sub")
    if not isinstance(exp_val, (int, float)) or not sub_val:
        return None

    now_ts = int(datetime.now(timezone.utc).timestamp())
    if now_ts >= int(exp_val):
        return None

    return payload_data