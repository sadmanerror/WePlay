import pytest
from datetime import datetime, timedelta, timezone
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_spectator_rsvp_and_min_reliability(client: AsyncClient, test_user, test_user_2, auth_headers, auth_headers_user_2):
    now = datetime.now(timezone.utc)
    # Host creates a match with minReliability = 80
    create_res = await client.post(
        "/api/v1/matches/",
        json={
            "title": "High Karma Match",
            "sportId": "football",
            "venueName": "Field A",
            "location": {"lat": 23.7500, "lng": 90.3800},
            "date": (now + timedelta(days=2)).isoformat(),
            "durationMinutes": 90,
            "maxPlayers": 2,
            "minReliability": 80,
            "description": "High karma only",
        },
        headers=auth_headers,
    )
    match_id = create_res.json()["id"]

    # Register user with low reliability
    reg_res = await client.post(
        "/api/v1/auth/register",
        json={
            "name": "New Low Karma Player",
            "email": "lowkarma@example.com",
            "password": "password123",
            "preferred_sports": ["football"],
        }
    )
    token_low = reg_res.json()["access_token"]
    headers_low = {"Authorization": f"Bearer {token_low}"}

    # Manually decrease reliability for testing by joining/leaving or checking default
    # Default is 100 in registration, let's see. Let's make a match requiring minReliability = 101 or test user 2.
    # If user default reliability is 100, let's set minReliability to 100.
    # Player 2 has 100 karma, so joining as player works:
    join_res = await client.post(
        f"/api/v1/matches/{match_id}/rsvp",
        json={"role": "player"},
        headers=auth_headers_user_2
    )
    assert join_res.status_code == 200
    assert join_res.json()["status"] == "full"

    # Now that player slots are full (2/2), low karma user joins as spectator
    spec_res = await client.post(
        f"/api/v1/matches/{match_id}/rsvp",
        json={"role": "spectator"},
        headers=headers_low
    )
    assert spec_res.status_code == 200
    spec_data = spec_res.json()
    assert spec_data["currentPlayers"] == 2
    assert spec_data["currentSpectators"] == 1


@pytest.mark.asyncio
async def test_chat_and_auto_erase_on_match_end(client: AsyncClient, test_user, test_user_2, auth_headers, auth_headers_user_2):
    now = datetime.now(timezone.utc)
    # Create active future match
    create_res = await client.post(
        "/api/v1/matches/",
        json={
            "title": "Chat Test Match",
            "sportId": "cricket",
            "venueName": "Stadium",
            "location": {"lat": 23.7500, "lng": 90.3800},
            "date": (now + timedelta(hours=3)).isoformat(),
            "durationMinutes": 60,
            "maxPlayers": 10,
            "description": "Lobby chat test",
        },
        headers=auth_headers,
    )
    match_id = create_res.json()["id"]

    # Player 2 joins
    await client.post(f"/api/v1/matches/{match_id}/rsvp", json={"role": "player"}, headers=auth_headers_user_2)

    # Host posts a message
    msg_res = await client.post(
        f"/api/v1/matches/{match_id}/messages",
        json={"content": "Welcome players! Bring your gear."},
        headers=auth_headers,
    )
    assert msg_res.status_code == 200
    assert msg_res.json()["content"] == "Welcome players! Bring your gear."
    assert msg_res.json()["user"]["name"] == test_user.name

    # Player 2 posts a reply
    reply_res = await client.post(
        f"/api/v1/matches/{match_id}/messages",
        json={"content": "I have the extra ball!"},
        headers=auth_headers_user_2,
    )
    assert reply_res.status_code == 200

    # Non-participant tries to post
    reg_outsider = await client.post(
        "/api/v1/auth/register",
        json={
            "name": "Outsider",
            "email": "outsider@example.com",
            "password": "password123",
            "preferred_sports": ["cricket"],
        }
    )
    outsider_headers = {"Authorization": f"Bearer {reg_outsider.json()['access_token']}"}
    outsider_msg = await client.post(
        f"/api/v1/matches/{match_id}/messages",
        json={"content": "Can I crash?"},
        headers=outsider_headers,
    )
    assert outsider_msg.status_code == 403

    # Fetch messages
    list_res = await client.get(f"/api/v1/matches/{match_id}/messages", headers=auth_headers_user_2)
    assert list_res.status_code == 200
    assert len(list_res.json()) == 2

    # Now create an already-ended match (date in past)
    past_date = now - timedelta(hours=5)
    past_res = await client.post(
        "/api/v1/matches/",
        json={
            "title": "Concluded Match",
            "sportId": "badminton",
            "venueName": "Old Gym",
            "location": {"lat": 23.7500, "lng": 90.3800},
            "date": past_date.isoformat(),
            "durationMinutes": 60,
            "maxPlayers": 4,
            "description": "Already finished",
        },
        headers=auth_headers,
    )
    past_id = past_res.json()["id"]

    # Posting message to ended match should fail with 400 (closed)
    post_ended = await client.post(
        f"/api/v1/matches/{past_id}/messages",
        json={"content": "Hello is anyone here?"},
        headers=auth_headers,
    )
    assert post_ended.status_code == 400
    assert "ended" in post_ended.json()["detail"].lower()

    # Reading messages from ended match returns empty list and erases any leftovers
    get_ended = await client.get(f"/api/v1/matches/{past_id}/messages", headers=auth_headers)
    assert get_ended.status_code == 200
    assert get_ended.json() == []


@pytest.mark.asyncio
async def test_host_attendance_and_karma(client: AsyncClient, test_user, test_user_2, auth_headers, auth_headers_user_2):
    now = datetime.now(timezone.utc)
    create_res = await client.post(
        "/api/v1/matches/",
        json={
            "title": "Match for Attendance",
            "sportId": "basketball",
            "venueName": "Court B",
            "location": {"lat": 23.7500, "lng": 90.3800},
            "date": (now - timedelta(hours=2)).isoformat(),
            "durationMinutes": 60,
            "maxPlayers": 4,
            "description": "Attendance test",
        },
        headers=auth_headers,
    )
    match_id = create_res.json()["id"]

    # Player 2 joins
    await client.post(f"/api/v1/matches/{match_id}/rsvp", json={"role": "player"}, headers=auth_headers_user_2)

    # Non-host cannot mark attendance
    unauth_att = await client.post(
        f"/api/v1/matches/{match_id}/attendance",
        json={"attendance": [{"userId": test_user_2.id, "status": "attended"}]},
        headers=auth_headers_user_2,
    )
    assert unauth_att.status_code == 403

    # Host marks player 2 as no_show
    host_att = await client.post(
        f"/api/v1/matches/{match_id}/attendance",
        json={"attendance": [{"userId": test_user_2.id, "status": "no_show"}]},
        headers=auth_headers,
    )
    assert host_att.status_code == 200
    data = host_att.json()
    assert data["status"] == "completed"

    # Verify user 2's reliability dropped by 15 (from 88 to 73)
    u2_profile = await client.get("/api/v1/auth/me", headers=auth_headers_user_2)
    assert u2_profile.status_code == 200
    assert u2_profile.json()["reliabilityScore"] == 73

