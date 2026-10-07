import pytest
from datetime import datetime, timedelta, timezone
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_rsvp_join_and_leave(client: AsyncClient, test_user, test_user_2, auth_headers, auth_headers_user_2):
    now = datetime.now(timezone.utc)
    # Host creates a 2-player match (Host is player 1)
    create_res = await client.post(
        "/api/v1/matches/",
        json={
            "title": "2-Player Tennis Match",
            "sportId": "badminton",
            "venueName": "Court 1",
            "location": {"lat": 23.7500, "lng": 90.3800},
            "date": (now + timedelta(days=1)).isoformat(),
            "durationMinutes": 60,
            "maxPlayers": 2,
            "description": "Quick game",
        },
        headers=auth_headers,
    )
    match_id = create_res.json()["id"]
    assert create_res.json()["currentPlayers"] == 1
    assert create_res.json()["status"] == "open"

    # Host tries to join again -> should fail with already confirmed
    dup_res = await client.post(f"/api/v1/matches/{match_id}/rsvp", json={"role": "player"}, headers=auth_headers)
    assert dup_res.status_code == 400
    assert "already confirmed" in dup_res.json()["detail"]

    # Player 2 joins -> fills the last slot (2/2)
    join_res = await client.post(f"/api/v1/matches/{match_id}/rsvp", json={"role": "player"}, headers=auth_headers_user_2)
    assert join_res.status_code == 200
    data = join_res.json()
    assert data["currentPlayers"] == 2
    assert data["status"] == "full"  # Status transitions to 'full'

    # Another user tries to join when full -> rejected
    # Register user 3
    reg_res = await client.post(
        "/api/v1/auth/register",
        json={
            "name": "Player Three",
            "email": "player3@example.com",
            "password": "password123",
            "preferred_sports": ["badminton"],
        }
    )
    token_3 = reg_res.json()["access_token"]
    blocked_res = await client.post(
        f"/api/v1/matches/{match_id}/rsvp",
        json={"role": "player"},
        headers={"Authorization": f"Bearer {token_3}"},
    )
    assert blocked_res.status_code == 400
    assert "status is full" in blocked_res.json()["detail"].lower() or "filled" in blocked_res.json()["detail"].lower()

    # Player 2 leaves -> slot is freed, status returns to 'open'
    leave_res = await client.delete(f"/api/v1/matches/{match_id}/rsvp", headers=auth_headers_user_2)
    assert leave_res.status_code == 200
    leave_data = leave_res.json()
    assert leave_data["currentPlayers"] == 1
    assert leave_data["status"] == "open"
