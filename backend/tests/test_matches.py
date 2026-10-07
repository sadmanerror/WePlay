import pytest
from datetime import datetime, timedelta, timezone
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_create_and_get_match(client: AsyncClient, test_user, auth_headers):
    match_date = (datetime.now(timezone.utc) + timedelta(days=2)).isoformat()
    create_payload = {
        "title": "Gulshan Cricket Match",
        "sportId": "cricket",
        "venueName": "Gulshan Park",
        "location": {"lat": 23.7925, "lng": 90.4078},
        "date": match_date,
        "durationMinutes": 90,
        "maxPlayers": 10,
        "entryFee": 150.0,
        "description": "Fun weekend cricket game.",
    }
    response = await client.post("/api/v1/matches/", json=create_payload, headers=auth_headers)
    assert response.status_code == 201
    data = response.json()
    assert data["title"] == "Gulshan Cricket Match"
    assert data["hostId"] == test_user.id
    assert data["currentPlayers"] == 1  # Host is first confirmed player
    assert data["status"] == "open"
    match_id = data["id"]

    # Fetch detail
    get_res = await client.get(f"/api/v1/matches/{match_id}")
    assert get_res.status_code == 200
    assert get_res.json()["venueName"] == "Gulshan Park"


@pytest.mark.asyncio
async def test_list_matches_radius_filtering(client: AsyncClient, auth_headers):
    now = datetime.now(timezone.utc)
    # Match in Gulshan (23.7925, 90.4078)
    await client.post(
        "/api/v1/matches/",
        json={
            "title": "Gulshan Game",
            "sportId": "football",
            "venueName": "Gulshan Field",
            "location": {"lat": 23.7925, "lng": 90.4078},
            "date": (now + timedelta(days=1)).isoformat(),
            "durationMinutes": 60,
            "maxPlayers": 10,
            "entryFee": 0,
            "description": "Nearby match",
        },
        headers=auth_headers,
    )

    # Match in Uttara (23.8759, 90.3795) - ~9.5 km away from Gulshan
    await client.post(
        "/api/v1/matches/",
        json={
            "title": "Uttara Game",
            "sportId": "basketball",
            "venueName": "Uttara Court",
            "location": {"lat": 23.8759, "lng": 90.3795},
            "date": (now + timedelta(days=2)).isoformat(),
            "durationMinutes": 60,
            "maxPlayers": 6,
            "entryFee": 0,
            "description": "Far match",
        },
        headers=auth_headers,
    )

    # Search from Gulshan with 5km radius -> Should only return Gulshan Game
    res_5km = await client.get("/api/v1/matches/?lat=23.7925&lng=90.4078&radius=5")
    assert res_5km.status_code == 200
    items_5km = res_5km.json()
    assert len(items_5km) == 1
    assert items_5km[0]["title"] == "Gulshan Game"

    # Search from Gulshan with 15km radius -> Should return both
    res_15km = await client.get("/api/v1/matches/?lat=23.7925&lng=90.4078&radius=15")
    assert res_15km.status_code == 200
    assert len(res_15km.json()) == 2


@pytest.mark.asyncio
async def test_host_edit_and_cancel_match(client: AsyncClient, test_user, auth_headers, auth_headers_user_2):
    now = datetime.now(timezone.utc)
    create_res = await client.post(
        "/api/v1/matches/",
        json={
            "title": "Original Title",
            "sportId": "badminton",
            "venueName": "Banani Club",
            "location": {"lat": 23.7940, "lng": 90.4023},
            "date": (now + timedelta(days=3)).isoformat(),
            "durationMinutes": 60,
            "maxPlayers": 4,
            "description": "Desc",
        },
        headers=auth_headers,
    )
    match_id = create_res.json()["id"]

    # Non-host cannot edit
    unauth_edit = await client.patch(
        f"/api/v1/matches/{match_id}",
        json={"title": "Hacked Title"},
        headers=auth_headers_user_2,
    )
    assert unauth_edit.status_code == 403

    # Host can edit
    edit_res = await client.patch(
        f"/api/v1/matches/{match_id}",
        json={"title": "Updated Title", "venueName": "New Banani Club"},
        headers=auth_headers,
    )
    assert edit_res.status_code == 200
    assert edit_res.json()["title"] == "Updated Title"

    # Host can cancel
    cancel_res = await client.delete(f"/api/v1/matches/{match_id}", headers=auth_headers)
    assert cancel_res.status_code == 200
    assert cancel_res.json()["status"] == "cancelled"
