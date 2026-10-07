import pytest
import pytest_asyncio
import asyncio
from typing import AsyncGenerator
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from app.main import app
from app.core.database import Base, get_db
from app.models.sport import Sport
from app.models.user import User
from app.core.security import get_password_hash, create_access_token

TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"

test_engine = create_async_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
)

TestingSessionLocal = async_sessionmaker(
    bind=test_engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


@pytest.fixture(scope="session")
def event_loop():
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest_asyncio.fixture(scope="function")
async def db_session() -> AsyncGenerator[AsyncSession, None]:
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        # Seed sports
        await conn.run_sync(
            lambda sync_conn: sync_conn.execute(
                Sport.__table__.insert(),
                [
                    {"id": "cricket", "name": "Cricket", "emoji": "🏏", "color": "#10b981"},
                    {"id": "football", "name": "Football", "emoji": "⚽", "color": "#3b82f6"},
                    {"id": "basketball", "name": "Basketball", "emoji": "🏀", "color": "#f97316"},
                    {"id": "badminton", "name": "Badminton", "emoji": "🏸", "color": "#8b5cf6"},
                ]
            )
        )

    async with TestingSessionLocal() as session:
        yield session

    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest_asyncio.fixture(scope="function")
async def client(db_session: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac
    app.dependency_overrides.clear()


@pytest_asyncio.fixture(scope="function")
async def test_user(db_session: AsyncSession) -> User:
    user = User(
        id="test-user-1",
        email="player1@example.com",
        hashed_password=get_password_hash("password123"),
        name="Player One",
        preferred_sports=["cricket", "football"],
        reliability_score=95,
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


@pytest_asyncio.fixture(scope="function")
async def test_user_2(db_session: AsyncSession) -> User:
    user = User(
        id="test-user-2",
        email="player2@example.com",
        hashed_password=get_password_hash("password123"),
        name="Player Two",
        preferred_sports=["badminton"],
        reliability_score=88,
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


@pytest.fixture
def auth_headers(test_user: User) -> dict:
    token = create_access_token(test_user.id)
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def auth_headers_user_2(test_user_2: User) -> dict:
    token = create_access_token(test_user_2.id)
    return {"Authorization": f"Bearer {token}"}
