import copy
from urllib.parse import quote

import pytest
from fastapi.testclient import TestClient

from src import app as app_module


@pytest.fixture(autouse=True)
def isolate_activities():
    """Backup and restore the in-memory activities between tests."""
    backup = copy.deepcopy(app_module.activities)
    yield
    # restore original state
    app_module.activities.clear()
    app_module.activities.update(backup)


client = TestClient(app_module.app)


def test_get_activities_returns_data():
    resp = client.get("/activities")
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, dict)
    # basic expected activity
    assert "Chess Club" in data


def test_signup_and_unregister_flow():
    activity = "Chess Club"
    email = "testuser@example.com"

    # sign up
    resp = client.post(f"/activities/{quote(activity)}/signup?email={quote(email)}")
    assert resp.status_code == 200
    assert "Signed up" in resp.json().get("message", "")

    # verify participant present
    resp2 = client.get("/activities")
    assert resp2.status_code == 200
    participants = resp2.json()[activity]["participants"]
    assert email in participants

    # unregister
    resp3 = client.delete(f"/activities/{quote(activity)}/unregister?email={quote(email)}")
    assert resp3.status_code == 200
    assert "Unregistered" in resp3.json().get("message", "")

    # verify removed
    resp4 = client.get("/activities")
    assert email not in resp4.json()[activity]["participants"]


def test_signup_duplicate_returns_400():
    activity = "Chess Club"
    # michael@mergington.edu is already in Chess Club in the sample data
    existing = "michael@mergington.edu"
    resp = client.post(f"/activities/{quote(activity)}/signup?email={quote(existing)}")
    assert resp.status_code == 400
