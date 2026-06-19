"""Design generation, projects CRUD, and vastu analysis tests."""
import pytest


# Module-level shared state for sequential project flow
_state = {}


def test_unauthenticated_endpoints_return_401(api_client, api_base):
    for path, method in [
        ("/projects", "get"),
        ("/projects/abc", "get"),
        ("/projects/abc", "delete"),
    ]:
        r = getattr(api_client, method)(f"{api_base}{path}", timeout=30)
        assert r.status_code == 401, f"{method} {path}: {r.status_code}"

    # POST endpoints
    r = api_client.post(f"{api_base}/design/generate", json={}, timeout=30)
    assert r.status_code == 401
    r = api_client.post(f"{api_base}/projects", json={}, timeout=30)
    assert r.status_code == 401
    r = api_client.post(f"{api_base}/vastu/analyze", json={"project_id": "x"}, timeout=30)
    assert r.status_code == 401


def test_empty_projects_list(api_client, api_base, auth_headers):
    r = api_client.get(f"{api_base}/projects", headers=auth_headers, timeout=30)
    assert r.status_code == 200
    assert isinstance(r.json(), list)


@pytest.mark.timeout(200)
def test_design_generate(api_client, api_base, auth_headers, small_image_b64):
    """Generate a design via AI. Takes 30-90s typically."""
    payload = {
        "image_base64": small_image_b64,
        "room_type": "Living Room",
        "budget": 200000,
        "color_palette": "Warm Beige",
        "requirements": "Need modern luxury sofa",
    }
    r = api_client.post(
        f"{api_base}/design/generate",
        json=payload,
        headers=auth_headers,
        timeout=180,
    )
    assert r.status_code == 200, f"{r.status_code} {r.text[:500]}"
    data = r.json()

    # Validate shape
    assert "generated_image" in data and isinstance(data["generated_image"], str)
    assert len(data["generated_image"]) > 100

    assert isinstance(data["furniture_estimate"], list)
    assert len(data["furniture_estimate"]) >= 1
    item = data["furniture_estimate"][0]
    assert "name" in item and "category" in item and "price_inr" in item
    assert isinstance(item["price_inr"], int)

    assert isinstance(data["total_cost"], int)
    assert data["total_cost"] > 0

    sa = data["space_analysis"]
    assert isinstance(sa, dict)
    # at least some array fields expected
    array_fields = [k for k, v in sa.items() if isinstance(v, list)]
    assert len(array_fields) >= 1

    vr = data["vastu_report"]
    assert isinstance(vr, dict)
    assert "score" in vr
    assert "summary" in vr
    assert isinstance(vr.get("positive_aspects"), list)
    assert isinstance(vr.get("issues"), list)
    assert isinstance(vr.get("recommendations"), list)

    assert isinstance(data["vastu_score"], int)
    assert 0 <= data["vastu_score"] <= 100

    # cache for project save test
    _state["design"] = data
    _state["original_image"] = small_image_b64


def test_create_and_get_project(api_client, api_base, auth_headers):
    if "design" not in _state:
        pytest.skip("design generation didn't run")
    d = _state["design"]
    body = {
        "name": "TEST_LivingRoom_1",
        "original_image": _state["original_image"],
        "generated_image": d["generated_image"],
        "room_type": "Living Room",
        "budget": 200000,
        "color_palette": "Warm Beige",
        "requirements": "Need modern luxury sofa",
        "furniture_estimate": d["furniture_estimate"],
        "total_cost": d["total_cost"],
        "vastu_score": d["vastu_score"],
        "vastu_report": d["vastu_report"],
        "space_analysis": d["space_analysis"],
    }
    r = api_client.post(f"{api_base}/projects", json=body, headers=auth_headers, timeout=60)
    assert r.status_code == 200, r.text
    proj = r.json()
    assert proj["id"]
    assert proj["name"] == "TEST_LivingRoom_1"
    assert "_id" not in proj
    _state["project_id"] = proj["id"]

    # List should include it (without images)
    r = api_client.get(f"{api_base}/projects", headers=auth_headers, timeout=30)
    assert r.status_code == 200
    arr = r.json()
    assert any(p["id"] == proj["id"] for p in arr)
    listed = next(p for p in arr if p["id"] == proj["id"])
    assert "original_image" not in listed
    assert "generated_image" not in listed

    # Detail should include images
    r = api_client.get(
        f"{api_base}/projects/{proj['id']}", headers=auth_headers, timeout=30
    )
    assert r.status_code == 200
    full = r.json()
    assert full["original_image"]
    assert full["generated_image"]
    assert full["vastu_report"]


def test_rename_project(api_client, api_base, auth_headers):
    pid = _state.get("project_id")
    if not pid:
        pytest.skip("no project created")
    r = api_client.patch(
        f"{api_base}/projects/{pid}",
        json={"name": "TEST_Renamed"},
        headers=auth_headers,
        timeout=30,
    )
    assert r.status_code == 200, r.text
    assert r.json()["name"] == "TEST_Renamed"

    # Verify via GET
    r = api_client.get(f"{api_base}/projects/{pid}", headers=auth_headers, timeout=30)
    assert r.json()["name"] == "TEST_Renamed"


def test_vastu_analyze(api_client, api_base, auth_headers):
    pid = _state.get("project_id")
    if not pid:
        pytest.skip("no project created")
    r = api_client.post(
        f"{api_base}/vastu/analyze",
        json={"project_id": pid},
        headers=auth_headers,
        timeout=120,
    )
    assert r.status_code == 200, r.text
    data = r.json()
    assert isinstance(data["vastu_score"], int)
    assert 0 <= data["vastu_score"] <= 100
    vr = data["vastu_report"]
    assert "summary" in vr
    assert "positive_aspects" in vr


def test_vastu_analyze_invalid_id(api_client, api_base, auth_headers):
    r = api_client.post(
        f"{api_base}/vastu/analyze",
        json={"project_id": "nonexistent-id-xyz"},
        headers=auth_headers,
        timeout=30,
    )
    assert r.status_code == 404


def test_delete_project(api_client, api_base, auth_headers):
    pid = _state.get("project_id")
    if not pid:
        pytest.skip("no project created")
    r = api_client.delete(f"{api_base}/projects/{pid}", headers=auth_headers, timeout=30)
    assert r.status_code == 200
    assert r.json().get("ok") is True

    # GET should return 404 now
    r = api_client.get(f"{api_base}/projects/{pid}", headers=auth_headers, timeout=30)
    assert r.status_code == 404

    # Delete again -> 404
    r = api_client.delete(f"{api_base}/projects/{pid}", headers=auth_headers, timeout=30)
    assert r.status_code == 404
