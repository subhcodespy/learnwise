"""
Unit tests for authentication, password hashing, and token validation.
"""

import pytest
from backend.app.core.security import get_password_hash, verify_password, create_access_token
from jose import jwt
from backend.app.core.config import settings

def test_password_hashing():
    raw_pwd = "safePassword123!"
    hashed = get_password_hash(raw_pwd)

    assert hashed != raw_pwd
    assert verify_password(raw_pwd, hashed) is True
    assert verify_password("wrongPassword", hashed) is False

def test_jwt_token_generation_and_decoding():
    user_id = "test_user_id_12345"
    token = create_access_token(user_id)

    payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    assert payload.get("sub") == user_id
    assert "exp" in payload
