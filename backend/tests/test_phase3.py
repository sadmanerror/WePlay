import pytest
from datetime import datetime, timedelta, timezone
from httpx import AsyncClient
from app.crud import crud_venue


@pytest.mark.asyncio
async def test_verified_tournament_flag(client: AsyncClient, test_user, auth_headers):
    now = datetime.now(timezone.utc)
    # Host creates a verified community tournament
    create_res = await client.post(
        "/api/v1/matches/",
        json={
            "title": "Championship 5v5 Final",
            "sportId": "football",
            "venueName": "National Stadium Outer Turf",
            "location": {"lat": 23.7300, "lng": 90.4100},
            "date": (now + timedelta(days=5)).isoformat(),
            "durationMinutes": 120,
            "maxPlayers": 14,
            "isTournament": True,
            "tournamentName": "Dhaka Premier Cup 2026",
            "description": "Annual neighborhood football tournament",
        },
        headers=auth_headers,
    )
    assert create_res.status_code == 201
    data = create_res.json()
    assert data["isTournament"] is True
    assert data["tournamentName"] == "Dhaka Premier Cup 2026"

    # Fetch match by ID and verify tournament flag is persisted
    match_id = data["id"]
    get_res = await client.get(f"/api/v1/matches/{match_id}")
    assert get_res.status_code == 200
    assert get_res.json()["isTournament"] is True
    assert get_res.json()["tournamentName"] == "Dhaka Premier Cup 2026"


@pytest.mark.asyncio
async def test_venue_listing_and_slot_reservation(client: AsyncClient, db_session, test_user, test_user_2, auth_headers, auth_headers_user_2):
    now = datetime.now(timezone.utc)
    # Create venue
    venue = await crud_venue.create_venue(
        db=db_session,
        name="Apex Arena Turf",
        address="Road 11, Banani, Dhaka",
        lat=23.7937,
        lng=90.4066,
        sports=["football", "cricket"],
        hourly_rate=1500.0,
        owner_id=test_user.id,
    )

    # Add 2 slots: one standard peak slot and one off-peak discount slot
    slot_standard = await crud_venue.add_slot(
        db=db_session,
        venue_id=venue.id,
        start_time=now + timedelta(days=1, hours=18),
        end_time=now + timedelta(days=1, hours=20),
        price=3000.0,
        is_off_peak=False,
    )

    slot_offpeak = await crud_venue.add_slot(
        db=db_session,
        venue_id=venue.id,
        start_time=now + timedelta(days=1, hours=10),
        end_time=now + timedelta(days=1, hours=12),
        price=1800.0,
        is_off_peak=True,
    )

    # 1. Test List Venues endpoint
    list_res = await client.get("/api/v1/venues/")
    assert list_res.status_code == 200
    venues_list = list_res.json()
    assert len(venues_list) >= 1
    found = next((v for v in venues_list if v["id"] == venue.id), None)
    assert found is not None
    assert len(found["slots"]) == 2
    assert any(s["isOffPeak"] is True for s in found["slots"])

    # 2. Test Get Venue Details
    detail_res = await client.get(f"/api/v1/venues/{venue.id}")
    assert detail_res.status_code == 200
    assert detail_res.json()["name"] == "Apex Arena Turf"
    assert detail_res.json()["isVerified"] is True

    # 3. Test In-App Reservation Stub
    reserve_res = await client.post(
        f"/api/v1/venues/{venue.id}/slots/{slot_offpeak.id}/reserve",
        headers=auth_headers_user_2,
    )
    assert reserve_res.status_code == 200
    res_data = reserve_res.json()
    assert res_data["status"] == "confirmed"
    assert res_data["amount"] == 1800.0
    assert res_data["userId"] == test_user_2.id
    assert res_data["slot"]["isBooked"] is True

    # 4. Double booking prevention
    dup_res = await client.post(
        f"/api/v1/venues/{venue.id}/slots/{slot_offpeak.id}/reserve",
        headers=auth_headers,
    )
    assert dup_res.status_code == 400
    assert "already been reserved" in dup_res.json()["detail"].lower()
