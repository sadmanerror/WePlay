import asyncio
from datetime import datetime, timedelta, timezone
from sqlalchemy import text
from app.core.database import async_engine, Base
from app.core.security import get_password_hash
from app.models.sport import Sport
from app.models.user import User
from app.models.match import Match
from app.models.participant import MatchParticipant
from app.models.venue import Venue, VenueSlot



SPORTS_DATA = [
    {"id": "cricket", "name": "Cricket", "emoji": "🏏", "color": "#10b981"},
    {"id": "football", "name": "Football", "emoji": "⚽", "color": "#3b82f6"},
    {"id": "basketball", "name": "Basketball", "emoji": "🏀", "color": "#f97316"},
    {"id": "badminton", "name": "Badminton", "emoji": "🏸", "color": "#8b5cf6"},
]

USERS_DATA = [
    {
        "id": "u1",
        "name": "Rafiq Ahmed",
        "email": "rafiq@example.com",
        "preferred_sports": ["cricket", "football"],
        "reliability_score": 95,
        "matches_played": 48,
        "matches_hosted": 12,
        "bio": "Weekend warrior. Love organizing cricket matches in Gulshan.",
    },
    {
        "id": "u2",
        "name": "Nusrat Jahan",
        "email": "nusrat@example.com",
        "preferred_sports": ["badminton", "basketball"],
        "reliability_score": 92,
        "matches_played": 35,
        "matches_hosted": 8,
        "bio": "Badminton enthusiast from Banani. Always up for a game!",
    },
    {
        "id": "u3",
        "name": "Tanvir Hossain",
        "email": "tanvir@example.com",
        "preferred_sports": ["football"],
        "reliability_score": 88,
        "matches_played": 62,
        "matches_hosted": 15,
        "bio": "Football is life. Playing since I could walk.",
    },
    {
        "id": "u4",
        "name": "Mithila Rahman",
        "email": "mithila@example.com",
        "preferred_sports": ["basketball", "badminton"],
        "reliability_score": 85,
        "matches_played": 28,
        "matches_hosted": 3,
        "bio": "New to basketball, learning fast. Love team sports!",
    },
    {
        "id": "u5",
        "name": "Arman Khan",
        "email": "arman@example.com",
        "preferred_sports": ["cricket", "football", "basketball"],
        "reliability_score": 78,
        "matches_played": 41,
        "matches_hosted": 6,
        "bio": "All-rounder in sports. Can play anything anytime.",
    },
    {
        "id": "u6",
        "name": "Fahmida Sultana",
        "email": "fahmida@example.com",
        "preferred_sports": ["badminton"],
        "reliability_score": 97,
        "matches_played": 55,
        "matches_hosted": 20,
        "bio": "District-level badminton player. Happy to coach newcomers.",
    },
    {
        "id": "u7",
        "name": "Sakib Hasan",
        "email": "sakib@example.com",
        "preferred_sports": ["cricket"],
        "reliability_score": 72,
        "matches_played": 19,
        "matches_hosted": 2,
        "bio": "Fast bowler looking for regular gully cricket.",
    },
    {
        "id": "u8",
        "name": "Priya Das",
        "email": "priya@example.com",
        "preferred_sports": ["football", "basketball"],
        "reliability_score": 90,
        "matches_played": 33,
        "matches_hosted": 5,
        "bio": "Goalkeeper by choice. Always bring extra water bottles.",
    },
    {
        "id": "u9",
        "name": "Imran Chowdhury",
        "email": "imran@example.com",
        "preferred_sports": ["cricket", "badminton"],
        "reliability_score": 65,
        "matches_played": 14,
        "matches_hosted": 1,
        "bio": "Casual player. Weekends only.",
    },
    {
        "id": "u10",
        "name": "Tasnim Akter",
        "email": "tasnim@example.com",
        "preferred_sports": ["basketball"],
        "reliability_score": 82,
        "matches_played": 22,
        "matches_hosted": 4,
        "bio": "Point guard with a passion for streetball.",
    },
    {
        "id": "u11",
        "name": "Rezaul Karim",
        "email": "rezaul@example.com",
        "preferred_sports": ["football", "cricket"],
        "reliability_score": 58,
        "matches_played": 9,
        "matches_hosted": 0,
        "bio": "Just moved to Dhaka. Looking for sports buddies.",
    },
    {
        "id": "u12",
        "name": "Anika Tabassum",
        "email": "anika@example.com",
        "preferred_sports": ["badminton", "football"],
        "reliability_score": 91,
        "matches_played": 37,
        "matches_hosted": 9,
        "bio": "Morning badminton at Ramna is my therapy.",
    },
    {
        "id": "u13",
        "name": "Jubayer Al Mamun",
        "email": "jubayer@example.com",
        "preferred_sports": ["cricket", "football", "badminton", "basketball"],
        "reliability_score": 45,
        "matches_played": 7,
        "matches_hosted": 0,
        "bio": "Interested in everything, commits to nothing (working on it).",
    },
    {
        "id": "u14",
        "name": "Sharmin Akhter",
        "email": "sharmin@example.com",
        "preferred_sports": ["basketball", "football"],
        "reliability_score": 87,
        "matches_played": 29,
        "matches_hosted": 7,
        "bio": "Basketball captain at uni. Organizing weekend 3v3 tourneys.",
    },
    {
        "id": "u15",
        "name": "Mehedi Hasan",
        "email": "mehedi@example.com",
        "preferred_sports": ["cricket"],
        "reliability_score": 40,
        "matches_played": 5,
        "matches_hosted": 1,
        "bio": "Spin bowler. New here, give me a chance!",
    },
]

LOCATIONS = {
    "gulshan": (23.7925, 90.4078),
    "banani": (23.7940, 90.4023),
    "dhanmondi": (23.7465, 90.3760),
    "uttara": (23.8759, 90.3795),
    "mirpur": (23.8069, 90.3653),
    "bashundhara": (23.8195, 90.4270),
    "motijheel": (23.7332, 90.4185),
    "lalmatia": (23.7530, 90.3700),
    "baridhara": (23.7998, 90.4215),
    "mohammadpur": (23.7660, 90.3590),
    "tejgaon": (23.7580, 90.3930),
    "badda": (23.7840, 90.4260),
    "khilgaon": (23.7470, 90.4310),
    "ramna": (23.7390, 90.4050),
    "shahbag": (23.7380, 90.3960),
}


async def seed():
    print("🌱 Starting database seeding...")
    async with async_engine.begin() as conn:
        # Check PostGIS
        if conn.dialect.name == "postgresql":
            await conn.execute(text("CREATE EXTENSION IF NOT EXISTS postgis;"))
        await conn.run_sync(Base.metadata.create_all)

    from app.core.database import AsyncSessionLocal
    async with AsyncSessionLocal() as session:
        # 1. Seed Sports
        for s in SPORTS_DATA:
            sport = await session.get(Sport, s["id"])
            if not sport:
                session.add(Sport(**s))
        await session.commit()
        print("✅ Sports seeded")

        # 2. Seed Users
        password_hash = get_password_hash("password123")
        for u in USERS_DATA:
            existing = await session.get(User, u["id"])
            if not existing:
                session.add(User(
                    id=u["id"],
                    name=u["name"],
                    email=u["email"],
                    hashed_password=password_hash,
                    preferred_sports=u["preferred_sports"],
                    reliability_score=u["reliability_score"],
                    matches_played=u["matches_played"],
                    matches_hosted=u["matches_hosted"],
                    bio=u["bio"],
                ))
        await session.commit()
        print("✅ 15 Users seeded")

        # 3. Seed Matches
        now = datetime.now(timezone.utc)
        matches_sample = [
            # Open matches
            ("m1", "u1", "cricket", "Sunday Gully Cricket — Need 3 More!", "Gulshan Park Open Ground", "gulshan", 1, 9, 180, 12, 9, None, 0.0, "Casual tape-ball cricket. Bring your own bat if you have one.", "open"),
            ("m2", "u3", "football", "Evening 7-a-Side Football", "Banani DOHS Field", "banani", 0, 18, 90, 14, 8, 20, 200.0, "Regular 7v7 on the turf. Bibs provided. Need 6 more to fill both sides!", "open"),
            ("m3", "u6", "badminton", "Morning Badminton Doubles", "Dhanmondi Indoor Court", "dhanmondi", 2, 7, 120, 4, 2, None, 500.0, "Doubles match at indoor court. Court fee split between 4 players.", "open"),
            ("m4", "u10", "basketball", "Weekend Streetball 3v3", "Uttara Basketball Court", "uttara", 3, 16, 90, 6, 3, None, 0.0, "Half-court 3v3. First to 21 wins. Energy drinks provided!", "open"),
            ("m5", "u5", "cricket", "After-Office Cricket Session", "Mirpur National Cricket Ground (Side Field)", "mirpur", 1, 17, 120, 16, 7, None, 100.0, "8-a-side tennis ball cricket. Floodlights till 8pm.", "open"),
            ("m6", "u8", "football", "Friendly 5-a-Side at Bashundhara", "Bashundhara Sports Complex", "bashundhara", 4, 19, 60, 10, 4, 15, 350.0, "Indoor 5v5 on the new turf with changing rooms and lights.", "open"),
            ("m7", "u12", "badminton", "Beginner-Friendly Badminton", "Ramna Park Courts", "ramna", 2, 15, 90, 8, 3, None, 0.0, "Open session for beginners and casual players. Extra rackets available!", "open"),
            ("m8", "u14", "basketball", "Morning Hoops at Shahbag", "Shahbag Outdoor Courts", "shahbag", 1, 6, 120, 10, 5, None, 0.0, "Early morning 5v5 full court. We keep score!", "open"),
            ("m9", "u2", "cricket", "Women's Cricket Meetup", "Baridhara General Area Ground", "baridhara", 5, 10, 150, 14, 6, None, 0.0, "Women's cricket practice session. All skill levels welcome.", "open"),
            ("m10", "u11", "football", "Newcomers Football Mixer", "Mohammadpur Town Hall Ground", "mohammadpur", 6, 17, 90, 16, 4, None, 0.0, "New to the area? Come play! We shuffle teams every 15 minutes.", "open"),

            # Almost full matches
            ("m11", "u1", "cricket", "Last Spot! T20 Cricket Match", "Tejgaon Cricket Field", "tejgaon", 0, 15, 180, 12, 11, None, 150.0, "Proper T20 with umpire. Just need 1 more player!", "open"),
            ("m12", "u3", "football", "2 Spots Left — Futsal Tonight", "Badda Arena Turf", "badda", 0, 20, 60, 10, 8, 10, 400.0, "Indoor futsal on premium turf. Fast-paced and competitive!", "open"),
            ("m13", "u6", "badminton", "Singles Match — Need 1 Opponent", "Lalmatia Indoor Hall", "lalmatia", 1, 19, 60, 2, 1, None, 300.0, "Competitive singles opponent wanted. Intermediate to advanced level.", "open"),
            ("m14", "u10", "basketball", "1 More for 3v3 Tournament", "Khilgaon Court", "khilgaon", 2, 14, 180, 6, 5, None, 250.0, "Mini tournament format with 3 teams rotating. Prizes for winners!", "open"),
            ("m15", "u5", "cricket", "Almost Full — Weekend Warriors", "Motijheel Field", "motijheel", 3, 8, 240, 14, 12, 30, 100.0, "Full-day cricket with lunch break. Biryani at halftime!", "open"),

            # Full matches
            ("m16", "u3", "football", "Friday Night Football — FULL", "Gulshan Sports Club", "gulshan", 2, 21, 90, 14, 14, 20, 300.0, "Weekly Friday night match. Fully booked!", "full"),
            ("m17", "u6", "badminton", "Doubles Championship — FULL", "Uttara Sports Academy", "uttara", 4, 10, 180, 4, 4, None, 600.0, "Competitive doubles tournament. All 4 spots filled.", "full"),
            ("m18", "u14", "basketball", "5v5 Full Court — FULL", "Dhanmondi Basketball Arena", "dhanmondi", 1, 17, 120, 10, 10, None, 0.0, "Regular 5v5 pickup game.", "full"),

            # Cancelled & Completed
            ("m19", "u7", "cricket", "Cancelled — Rain Forecast ☔", "Banani Field 11", "banani", 0, 10, 120, 12, 6, None, 0.0, "Cancelled due to bad weather.", "cancelled"),
            ("m20", "u9", "badminton", "Cancelled — Court Unavailable", "Mirpur Indoor", "mirpur", 1, 18, 90, 4, 2, None, 400.0, "Court double-booked by venue.", "cancelled"),
            ("m21", "u11", "football", "Cancelled — Not Enough Players", "Tejgaon Industrial Ground", "tejgaon", -1, 16, 90, 14, 4, None, 0.0, "Not enough participants joined.", "cancelled"),
            ("m22", "u13", "basketball", "Cancelled — Personal Emergency", "Badda Court", "badda", 2, 15, 60, 6, 4, None, 0.0, "Host personal emergency.", "cancelled"),
            ("m23", "u1", "cricket", "Last Saturday's Epic Match", "Gulshan Park Open Ground", "gulshan", -3, 9, 180, 12, 12, None, 0.0, "Team A won by 3 runs!", "completed"),
            ("m24", "u8", "football", "Midweek Kick-About (Done)", "Banani DOHS Field", "banani", -2, 18, 90, 14, 12, None, 200.0, "Great 4-3 thriller.", "completed"),
            ("m25", "u6", "badminton", "Weekend Badminton (Completed)", "Ramna Park Courts", "ramna", -5, 7, 120, 4, 4, None, 300.0, "Fun doubles session.", "completed"),
        ]

        for m in matches_sample:
            mid, host_id, sport_id, title, venue, loc_key, days, hour, dur, max_p, cur_p, max_s, fee, desc, status = m
            lat, lng = LOCATIONS[loc_key]
            m_date = now + timedelta(days=days)
            m_date = m_date.replace(hour=hour, minute=0, second=0, microsecond=0)
            point_wkt = f"SRID=4326;POINT({lng} {lat})"

            existing_m = await session.get(Match, mid)
            if not existing_m:
                match_obj = Match(
                    id=mid,
                    host_id=host_id,
                    sport_id=sport_id,
                    title=title,
                    venue_name=venue,
                    latitude=lat,
                    longitude=lng,
                    location=point_wkt,
                    date=m_date,
                    duration_minutes=dur,
                    max_players=max_p,
                    current_players=cur_p,
                    max_spectators=max_s,
                    current_spectators=2 if max_s else 0,
                    entry_fee=fee,
                    description=desc,
                    status=status,
                )
                session.add(match_obj)

                # Add participants
                # Host
                session.add(MatchParticipant(
                    match_id=mid,
                    user_id=host_id,
                    role="player",
                    status="confirmed",
                    joined_at=now - timedelta(hours=24),
                ))

                # Extra random players up to cur_p
                other_users = [u["id"] for u in USERS_DATA if u["id"] != host_id]
                for i in range(min(cur_p - 1, len(other_users))):
                    session.add(MatchParticipant(
                        match_id=mid,
                        user_id=other_users[i],
                        role="player",
                        status="confirmed",
                        joined_at=now - timedelta(hours=12 - i),
                    ))

        # Seed partner venues (Phase 3)
        venue_1 = Venue(
            id="v1",
            name="Apex Arena Football Turf",
            address="Road 11, Block D, Banani, Dhaka",
            latitude=23.7937,
            longitude=90.4066,
            location="SRID=4326;POINT(90.4066 23.7937)",
            sports="football",
            image_url="https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=600&auto=format&fit=crop",
            hourly_rate=1800.0,
            rating=4.9,
            is_verified=True,
        )
        session.add(venue_1)

        venue_2 = Venue(
            id="v2",
            name="Gulshan Smashers Badminton Club",
            address="Gulshan 2, Near Park, Dhaka",
            latitude=23.7925,
            longitude=90.4167,
            location="SRID=4326;POINT(90.4167 23.7925)",
            sports="badminton",
            image_url="https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=600&auto=format&fit=crop",
            hourly_rate=1000.0,
            rating=4.8,
            is_verified=True,
        )
        session.add(venue_2)

        # Add slots
        session.add(VenueSlot(
            id="v1-s1",
            venue_id="v1",
            start_time=now + timedelta(days=1, hours=9),
            end_time=now + timedelta(days=1, hours=10, minutes=30),
            price=1200.0,
            is_off_peak=True,
            is_booked=False,
        ))
        session.add(VenueSlot(
            id="v1-s2",
            venue_id="v1",
            start_time=now + timedelta(days=1, hours=18),
            end_time=now + timedelta(days=1, hours=19, minutes=30),
            price=1800.0,
            is_off_peak=False,
            is_booked=False,
        ))
        session.add(VenueSlot(
            id="v2-s1",
            venue_id="v2",
            start_time=now + timedelta(days=1, hours=10),
            end_time=now + timedelta(days=1, hours=11),
            price=600.0,
            is_off_peak=True,
            is_booked=False,
        ))

        await session.commit()
        print("✅ 25 Matches, Participants & Partner Venues seeded successfully!")

    print("🎉 Seeding complete!")



if __name__ == "__main__":
    asyncio.run(seed())
