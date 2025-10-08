"""CSRF protection middleware for state-changing admin endpoints."""
from __future__ import annotations

import hmac
import secrets
import time
from typing import Optional

from fastapi import Request, HTTPException, status
from .config import CONFIG

CSRF_TOKEN_HEADER = "X-CSRF-Token"
CSRF_COOKIE_NAME = "third-eye-csrf"
CSRF_TOKEN_TTL = 3600

_CSRF_SECRET = secrets.token_urlsafe(32)


def generate_csrf_token() -> str:
    timestamp = str(int(time.time()))
    token = secrets.token_urlsafe(32)
    signature = hmac.new(
        _CSRF_SECRET.encode(),
        f"{token}:{timestamp}".encode(),
        digestmod="sha256"
    ).hexdigest()
    return f"{token}:{timestamp}:{signature}"


def validate_csrf_token(token: str) -> bool:
    try:
        parts = token.split(":")
        if len(parts) != 3:
            return False

        token_value, timestamp_str, signature = parts
        timestamp = int(timestamp_str)

        if time.time() - timestamp > CSRF_TOKEN_TTL:
            return False

        expected_signature = hmac.new(
            _CSRF_SECRET.encode(),
            f"{token_value}:{timestamp_str}".encode(),
            digestmod="sha256"
        ).hexdigest()

        return hmac.compare_digest(signature, expected_signature)
    except (ValueError, AttributeError):
        return False


async def csrf_protect(request: Request) -> None:
    if request.method in ("GET", "HEAD", "OPTIONS"):
        return

    role = getattr(request.state, "role", "")
    if role != "admin":
        return

    token_from_header = request.headers.get(CSRF_TOKEN_HEADER)
    token_from_cookie = request.cookies.get(CSRF_COOKIE_NAME)

    if not token_from_header or not token_from_cookie:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="CSRF token missing"
        )

    if token_from_header != token_from_cookie:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="CSRF token mismatch"
        )

    if not validate_csrf_token(token_from_header):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="CSRF token invalid or expired"
        )


def get_csrf_token_from_request(request: Request) -> Optional[str]:
    return request.cookies.get(CSRF_COOKIE_NAME)
