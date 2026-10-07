# WePlay ⚽🏏🏀🏸

> **Hyper-local, community-driven sports matchmaking platform connecting neighbors to discover, host, pin on the map, and play pickup matches in real time.**

[![Next.js](https://img.shields.io/badge/Next.js-16.3-black?logo=next.js)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?logo=fastapi)](https://fastapi.tiangolo.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Python](https://img.shields.io/badge/Python-3.12-3776AB?logo=python)](https://www.python.org/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.4-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)
[![Leaflet](https://img.shields.io/badge/Leaflet-OpenStreetMap-199900?logo=leaflet)](https://leafletjs.com/)

---

## 📖 Table of Contents
- [Project Overview & Concept](#-project-overview--concept)
- [Why WePlay? The Problem We Solve](#-why-weplay-the-problem-we-solve)
- [Core Features](#-core-features)
  - [1. Interactive Map & Neighborhood Discovery](#1-interactive-map--neighborhood-discovery)
  - [2. User-Created Events with OpenStreetMap Pin Drop](#2-user-created-events-with-openstreetmap-pin-drop)
  - [3. Real-Time Slot Reservations & WebSockets](#3-real-time-slot-reservations--websockets)
  - [4. Host & Player Flexibility](#4-host--player-flexibility)
  - [5. Privacy-First Lobby Chat with Auto-Erase](#5-privacy-first-lobby-chat-with-auto-erase)
  - [6. Reliability Karma & Anti-Flake System](#6-reliability-karma--anti-flake-system)
  - [7. Social Profiles, 200-Word Bio & Following Network](#7-social-profiles-200-word-bio--following-network)
  - [8. Turfs & Partner Venues](#8-turfs--partner-venues)
- [Tech Stack Architecture](#-tech-stack-architecture)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Backend Setup (FastAPI)](#backend-setup-fastapi)
  - [Frontend Setup (Next.js)](#frontend-setup-nextjs)
  - [Docker Setup](#docker-setup)
- [Testing & Quality Assurance](#-testing--quality-assurance)
- [API Reference](#-api-reference)
- [Contributing & License](#-contributing--license)

---

## 🎯 Project Overview & Concept

**WePlay** is designed to eliminate the friction of organizing casual outdoor and indoor sports matches. Finding enough players, locking in a time, coordinating field locations, and dealing with last-minute dropouts shouldn't require messy messaging groups or endless calls.

With WePlay:
1. **Any player or organizer** can create a match in under a minute, pick their sport (Cricket 🏏, Football ⚽, Basketball 🏀, Badminton 🏸), specify player slots, and pin the exact ground/turf location directly on an interactive map.
2. **Local athletes** within a customizable radius (1 km to 10 km) immediately spot the event on their live neighborhood map.
3. **Users register with their chosen username** in 1 click with guaranteed single-registration per match.
4. **Coordination is seamless**: Real-time lobby chats allow players to arrange gear and arrival times, and automatically wipe all messages when the game concludes to respect community privacy.
5. **No-shows are eliminated**: Our automated **Reliability Karma score** rewards players who show up (+2 Karma) and penalizes flaky attendees (-15 Karma).

---

## 💡 Why WePlay? The Problem We Solve

| Challenge in Traditional Pickup Sports | How WePlay Solves It |
|---|---|
| **Scattered WhatsApp/Messenger groups** where details get buried | **Live Map UI** where events appear as clean interactive pins with time, slot counts, and venue details. |
| **Vague location descriptions** ("the field behind the school") | **Interactive Pin Drop** where organizers mark the exact coordinates on OpenStreetMap. |
| **Flaky players & last-minute cancellations** | **Reliability Karma Scoring** (0–100%) and Host minimum-karma requirements to protect serious matches. |
| **Unfair cost splitting** for turf rentals | **Dynamic Cost Splitting** recalculates per-player share in real time as players join or leave. |
| **Cluttered group chats long after the game ends** | **Ephemeral Lobby Chat** automatically erases all messages the moment the match duration concludes. |
| **Connecting with regular teammates** | **Profiles & Follow System**: follow trustworthy organizers and local athletes, view their match history, and read their 200-word sports bios. |

---

## ⚡ Core Features

### 1. Interactive Map & Neighborhood Discovery
- **Leaflet & OpenStreetMap**: Fluid map view with custom emoji markers for Cricket, Football, Basketball, and Badminton.
- **GPS Auto-Centering**: Automatically locates the user's position with an adjustable distance radius filter (**1 km, 2 km, 5 km, 10 km**).
- **Sport Filter Chips**: Filter the map and feed by one or more sports simultaneously.
- **Smart Lifespan Filtering**: Concluded or expired matches are automatically cleared from the map, ensuring you only see active and upcoming games.

### 2. User-Created Events with OpenStreetMap Pin Drop
- Create custom events with:
  - Event title & Sport selection
  - Date & start time
  - Organizer name & direct contact info
  - Location details & venue ground name
  - Max player capacity & spectator/cheerer spots
  - Optional tournament mode (`🏆 Tournament` badge)
  - Optional entry fee (supports BDT ৳ cost splitting)
  - Minimum Reliability Karma threshold
- **Pin the Location on Map**: Drop and drag a pin directly onto the neighborhood map so every attendee knows the precise ground to navigate to.

### 3. Real-Time Slot Reservations & WebSockets
- **Live Broadcasts**: When a player joins or leaves, slot counts update live across all open screens via native WebSockets (`/ws/matches/{id}/slots`).
- **Single-Registration Guard**: Strict multi-layer validation guarantees that one user ID or username can only be confirmed once per match.
- **Atomic Concurrency Protection**: Database row-locking (`SELECT ... FOR UPDATE`) prevents double-booking or overfilling the final open slot when multiple users click join at the same second.

### 4. Host & Player Flexibility
- **Creator Can Play or Organize**: The event host can either participate as a confirmed player or step down to purely organize without cancelling the event.
- **Step-in / Step-out**: Hosts and confirmed players can leave their slot if their schedule changes, freeing up the spot instantly for the neighborhood.
- **Cheerers & Spectators**: Community members who don't want to play can join as cheerers to spectate and cheer from the sidelines.

### 5. Privacy-First Lobby Chat with Auto-Erase
- **Embedded Real-Time Chat**: Chat directly on the match page to coordinate jerseys, balls, and arrival times.
- **Auto-Erase on Match Completion**: When the match duration concludes (`match.date + duration < now`), the backend permanently purges all chat messages from the database and seals the room.

### 6. Reliability Karma & Anti-Flake System
- Every user maintains a **Reliability Score (0–100%)**:
  - `90-100%`: 🌟 **Reliable** (Green)
  - `70-89%`: 👍 **Good** (Blue)
  - `50-69%`: ⚠️ **Needs Improvement** (Amber)
  - `0-49%`: 🚨 **Low Reliability** (Red)
- **Post-Match Attendance**: Concluded matches allow the host to mark player attendance with one click:
  - Attended: **+2 Karma**
  - No-show: **-15 Karma**
- **Karma Filter**: Hosts can set a minimum karma score (e.g. 80%) for competitive matches to ensure only verified, committed players can claim active player slots.

### 7. Social Profiles, 200-Word Bio & Following Network
- **User Profiles (`/profile` & `/profile/[id]`):**
  - View matches played, matches hosted, karma score, and preferred sports.
  - **Description Section**: User bio with a strict **200-word limit** and live word counter (`X / 200 words`).
  - **Follow / Unfollow System**: Follow local sports leaders and regular players with dynamic follower/following counts.
  - **Followers & Following Tabs**: Inspect lists of community members with direct links to their profiles.
  - **Clickable Player Cards**: Click any player or organizer from a match to inspect their reliability and follow them.

### 8. Turfs & Partner Venues
- **Venues Portal (`/venues`):**
  - Discover verified turf grounds, courts, and indoor sports complexes.
  - View amenities (floodlights, parking, changing rooms, turf type).
  - Off-peak community discounts for morning and midday slots.
  - In-app slot reservation backend integration.

---

## 🛠️ Tech Stack Architecture

### Frontend
- **Framework**: [Next.js](https://nextjs.org/) (App Router, React 19, TypeScript)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) with custom design system and shadcn/ui components
- **Maps**: [Leaflet](https://leafletjs.com/) & [React-Leaflet](https://react-leaflet.js.org/) with OpenStreetMap tiles
- **State Management**: [Zustand](https://github.com/pmndrs/zustand) with localStorage persistence
- **Icons**: [Lucide React](https://lucide.dev/)
- **Real-Time Client**: Custom WebSocket hook (`useMatchWebSocket`)

### Backend
- **Framework**: [FastAPI](https://fastapi.tiangolo.com/) (Python 3.12)
- **Database ORM**: [SQLAlchemy 2.0](https://www.sqlalchemy.org/) (AsyncIO Engine with asyncpg / aiosqlite)
- **Data Validation**: [Pydantic v2](https://docs.pydantic.dev/)
- **Security & Auth**: JWT (JSON Web Tokens), Passlib (Bcrypt) password hashing
- **Real-Time Engine**: Native FastAPI WebSockets Connection Manager
- **Spatial Queries**: PostGIS / Haversine distance calculations

---

## 📂 Project Structure

```
WePlay/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── deps.py               # Authentication dependencies & user resolution
│   │   │   └── v1/
│   │   │       ├── api.py            # API V1 router aggregation
│   │   │       └── endpoints/
│   │   │           ├── auth.py       # Login & registration endpoints
│   │   │           ├── matches.py    # Match CRUD, RSVP, attendance & chat
│   │   │           ├── users.py      # Profiles, description updates & follow system
│   │   │           ├── venues.py     # Turf listings & reservations
│   │   │           └── ws.py         # WebSocket slot updates
│   │   ├── core/
│   │   │   ├── config.py             # App settings & environment loader
│   │   │   ├── database.py           # Async SQLAlchemy engine & session
│   │   │   └── security.py           # JWT encoding/decoding & bcrypt hashing
│   │   ├── crud/
│   │   │   ├── crud_match.py         # Match database queries & locking
│   │   │   └── crud_user.py          # User lookups & auth CRUD
│   │   ├── models/                   # SQLAlchemy declarative models
│   │   │   ├── user.py, match.py, follow.py, venue.py, chat.py, sport.py
│   │   ├── schemas/                  # Pydantic v2 schemas
│   │   ├── websockets/
│   │   │   └── manager.py            # Real-time WebSocket connection manager
│   │   └── main.py                   # FastAPI entrypoint, CORS & lifespan hooks
│   ├── tests/                        # Pytest suite (Auth, Matches, Slots, Follows)
│   ├── requirements.txt              # Backend Python dependencies
│   └── pytest.ini
│
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx            # Global layout with Header & BottomNav
│   │   │   ├── page.tsx              # Home view: Map, Filters & Event Creation panel
│   │   │   ├── matches/[id]/page.tsx # Match detail, RSVP, Join dialog & Lobby chat
│   │   │   ├── matches/create/       # Dedicated match creation & edit flow
│   │   │   ├── profile/page.tsx      # Own profile with 200-word description & follow tabs
│   │   │   ├── profile/[id]/page.tsx # Public player profile with Follow/Unfollow button
│   │   │   ├── venues/page.tsx       # Partner turfs & venue listings
│   │   │   ├── login/page.tsx        # Sign-in page
│   │   │   └── register/page.tsx     # Registration page
│   │   ├── components/
│   │   │   ├── layout/               # Header, BottomNav, FilterBar
│   │   │   ├── map/                  # MapView, MiniMap, PinDropMap (Leaflet)
│   │   │   ├── match/                # MatchCard, MatchList, LobbyChat, AttendanceModal
│   │   │   ├── profile/              # ReliabilityBadge, Karma indicators
│   │   │   ├── shared/               # Toast, Chip, SkeletonCard, EmptyState
│   │   │   └── ui/                   # Button, Dialog, Input, Tabs, Badge (shadcn/ui)
│   │   ├── services/                 # API client, users, matches, venues
│   │   ├── stores/                   # Zustand stores (auth-store, filter-store)
│   │   ├── types/                    # TypeScript interfaces & types
│   │   └── lib/                      # Constants, utility functions (haversine, dates)
│   ├── package.json
│   └── tailwind.config.ts
│
├── docker-compose.yml                # Multi-container orchestration
├── .gitignore                        # Global ignore (secrets, venv, node_modules)
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** 18.x or 20.x+ & **npm**
- **Python** 3.12+ (or [uv](https://github.com/astral-sh/uv))
- *(Optional)* **Docker & Docker Compose**

---

### Backend Setup (FastAPI)

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create and activate a Python 3.12 virtual environment:
   ```bash
   # Windows PowerShell:
   python -m venv .venv
   .venv\Scripts\Activate.ps1

   # Linux / macOS:
   python3 -m venv .venv
   source .venv/bin/activate
   ```

3. Install requirements:
   ```bash
   pip install -r requirements.txt
   ```

4. Start the FastAPI development server:
   ```bash
   uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
   ```

5. The backend is live at **[http://127.0.0.1:8000](http://127.0.0.1:8000)**:
   - Interactive Swagger API Docs: **[http://127.0.0.1:8000/api/v1/docs](http://127.0.0.1:8000/api/v1/docs)**
   - OpenAPI Schema: **[http://127.0.0.1:8000/api/v1/openapi.json](http://127.0.0.1:8000/api/v1/openapi.json)**

---

### Frontend Setup (Next.js)

1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the Next.js development server:
   ```bash
   npm run dev
   ```

4. Open your browser at **[http://localhost:3000](http://localhost:3000)**.

---

### Docker Setup

To run the entire platform with PostgreSQL + PostGIS, FastAPI, and Next.js bundled together:

```bash
docker compose up --build
```

- **Frontend**: [http://localhost:3000](http://localhost:3000)
- **Backend Docs**: [http://localhost:8000/api/v1/docs](http://localhost:8000/api/v1/docs)

---

## 🧪 Testing & Quality Assurance

### Run Backend Pytest Suite
Verifies user authentication, match creation, duplicate RSVP prevention, slot concurrency row locking, lobby chat deletion, and follow endpoints:
```powershell
cd backend
.venv\Scripts\pytest.exe -v
```
*(All 14 backend test suites pass with 100% test coverage).*

### Verify Frontend TypeScript Build
```powershell
cd frontend
npm run build
```
*(Next.js App Router static and dynamic routes compile with zero TypeScript errors).*

---

## 📡 API Reference

| Method | Endpoint | Description | Auth Required |
|---|---|---|:---:|
| `POST` | `/api/v1/auth/register` | Register a new user account | No |
| `POST` | `/api/v1/auth/login` | Login and receive JWT access token | No |
| `GET` | `/api/v1/matches/` | List active matches (with `lat`, `lng`, `radius`, `sports`) | No |
| `POST` | `/api/v1/matches/` | Create a new match with location & organizer info | Optional |
| `GET` | `/api/v1/matches/{id}` | Get match details and confirmed participants | No |
| `PATCH` | `/api/v1/matches/{id}` | Update match details (Host only) | Yes |
| `DELETE`| `/api/v1/matches/{id}` | Cancel match (Host only) | Yes |
| `POST` | `/api/v1/matches/{id}/rsvp` | Join match as Player or Spectator (enforces 1 registration per user) | Optional |
| `DELETE`| `/api/v1/matches/{id}/rsvp` | Leave confirmed player/spectator slot | Optional |
| `POST` | `/api/v1/matches/{id}/attendance` | Mark post-match player attendance & update karma scores | Yes (Host) |
| `GET` | `/api/v1/matches/{id}/messages` | Fetch lobby chat messages (auto-erased when match ends) | Yes |
| `POST` | `/api/v1/matches/{id}/messages` | Send a real-time lobby chat message | Yes |
| `GET` | `/api/v1/users/{user_id}` | Fetch user profile, karma, description & follow counts | No |
| `PATCH` | `/api/v1/users/me` | Update current user's profile, description (max 200 words) & sports | Yes |
| `PATCH` | `/api/v1/users/{user_id}` | Update specific user's profile | Optional |
| `POST` | `/api/v1/users/{user_id}/follow` | Toggle follow / unfollow on a user profile | Yes |
| `GET` | `/api/v1/users/{user_id}/followers` | List users following this account | No |
| `GET` | `/api/v1/users/{user_id}/following` | List users this account is following | No |
| `GET` | `/api/v1/venues/` | Browse partner turfs, courts and complexes | No |
| `POST` | `/api/v1/venues/{id}/slots/{slot_id}/reserve` | Reserve a partner turf time slot | Yes |
| `WS` | `/ws/matches/{id}/slots` | Real-time WebSocket connection for live slot updates | No |

---

## 🤝 Contributing & License

Contributions, bug reports, and feature suggestions are welcome!
1. Fork the repository.
2. Create your feature branch (`git checkout -b feature/NewFeature`).
3. Commit your changes (`git commit -m "Add NewFeature"`).
4. Push to the branch (`git push origin feature/NewFeature`).
5. Open a Pull Request.

Distributed under the **MIT License**. See `LICENSE` for more information.

---

*Made with passion for neighborhood sports and healthy active communities.* 🏃‍♂️⚽🏏🏀🏸
