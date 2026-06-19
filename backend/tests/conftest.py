"""Shared fixtures for KRINTERIOR AI backend tests."""
import base64
import io
import os
import uuid

import pytest
import requests

BASE_URL = os.environ.get(
    "EXPO_PUBLIC_BACKEND_URL",
    "https://vastu-spaces-1.preview.emergentagent.com",
).rstrip("/")
API = f"{BASE_URL}/api"


@pytest.fixture(scope="session")
def api_base():
    return API


@pytest.fixture(scope="session")
def api_client():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="session")
def unique_email():
    # Unique email per test session avoids 400-already-registered noise
    return f"test_{uuid.uuid4().hex[:10]}@krinterior.io"


@pytest.fixture(scope="session")
def auth_session(api_client, unique_email):
    """Sign up a fresh user and return (token, user, password)."""
    pw = "Test@1234"
    r = api_client.post(
        f"{API}/auth/signup",
        json={"email": unique_email, "password": pw, "full_name": "Test User"},
        timeout=30,
    )
    assert r.status_code == 200, f"signup failed: {r.status_code} {r.text}"
    data = r.json()
    return {"token": data["access_token"], "user": data["user"], "password": pw, "email": unique_email}


@pytest.fixture(scope="session")
def auth_headers(auth_session):
    return {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {auth_session['token']}",
    }


@pytest.fixture(scope="session")
def small_image_b64():
    """A minimal valid PNG (1x1 grey)."""
    # Pre-generated 1x1 PNG bytes
    png_hex = (
        "89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4"
        "890000000d49444154789c63f8cfc0f01f00050001ffa7a5ad6c0000000049454e44ae426082"
    )
    raw = bytes.fromhex(png_hex)
    return base64.b64encode(raw).decode()
