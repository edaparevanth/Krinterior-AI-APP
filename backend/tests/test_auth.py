"""Auth endpoints tests for KRINTERIOR AI."""
import uuid


def test_signup_creates_user(api_client, api_base):
    email = f"test_{uuid.uuid4().hex[:10]}@krinterior.io"
    r = api_client.post(
        f"{api_base}/auth/signup",
        json={"email": email, "password": "Test@1234", "full_name": "Bob"},
        timeout=30,
    )
    assert r.status_code == 200, r.text
    data = r.json()
    assert "access_token" in data and data["access_token"]
    assert data["token_type"] == "bearer"
    assert data["user"]["email"] == email
    assert data["user"]["full_name"] == "Bob"
    assert "id" in data["user"]


def test_signup_duplicate_email_returns_400(api_client, api_base):
    email = f"dup_{uuid.uuid4().hex[:8]}@krinterior.io"
    payload = {"email": email, "password": "Test@1234"}
    r1 = api_client.post(f"{api_base}/auth/signup", json=payload, timeout=30)
    assert r1.status_code == 200, r1.text
    r2 = api_client.post(f"{api_base}/auth/signup", json=payload, timeout=30)
    assert r2.status_code == 400, r2.text
    assert "already" in r2.json().get("detail", "").lower()


def test_login_success(api_client, api_base, auth_session):
    r = api_client.post(
        f"{api_base}/auth/login",
        json={"email": auth_session["email"], "password": auth_session["password"]},
        timeout=30,
    )
    assert r.status_code == 200, r.text
    data = r.json()
    assert data["access_token"]
    assert data["user"]["email"] == auth_session["email"]


def test_login_wrong_password_returns_401(api_client, api_base, auth_session):
    r = api_client.post(
        f"{api_base}/auth/login",
        json={"email": auth_session["email"], "password": "WrongPass!"},
        timeout=30,
    )
    assert r.status_code == 401, r.text


def test_me_with_token(api_client, api_base, auth_headers, auth_session):
    r = api_client.get(f"{api_base}/auth/me", headers=auth_headers, timeout=30)
    assert r.status_code == 200, r.text
    data = r.json()
    assert data["email"] == auth_session["email"]
    assert "password_hash" not in data
    assert "_id" not in data


def test_me_without_token_returns_401(api_client, api_base):
    r = api_client.get(f"{api_base}/auth/me", timeout=30)
    assert r.status_code == 401
