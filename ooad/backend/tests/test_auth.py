# backend/tests/test_auth.py
"""Basic authentication tests for the AutoCare FastAPI backend.
These tests cover:
- Successful registration
- Duplicate email rejection
- Successful login and token issuance
- Password hashing verification (indirect via login)
"""

import asyncio
import os
from pathlib import Path

import pytest
from httpx import AsyncClient

# Ensure the test database is isolated – we use the same SQLite file but
# the seed script will create fresh data each run. For a real CI pipeline,
# you would point DATABASE_URL to a temporary file.

@pytest.fixture(scope="module")
def anyio_backend():
    return "asyncio"

@pytest.fixture(scope="module")
async def client():
    # Import the app after setting the environment variable so that the
    # Settings object reads the test configuration.
    os.environ["DATABASE_URL"] = "sqlite:///./test_autocare.db"
    os.environ["SECRET_KEY"] = "test-secret-key"
    os.environ["ALGORITHM"] = "HS256"
    os.environ["ACCESS_TOKEN_EXPIRE_MINUTES"] = "60"
    os.environ["CORS_ORIGINS"] = "http://localhost:5173"
    from app.main import app
    async with AsyncClient(app=app, base_url="http://testserver") as ac:
        # Drop all tables and recreate to start from a clean slate.
        from app.core.database import Base, engine
        Base.metadata.drop_all(bind=engine)
        Base.metadata.create_all(bind=engine)
        yield ac

@pytest.mark.anyio
async def test_register_success(client: AsyncClient):
    payload = {
        "name": "Test User",
        "email": "test@example.com",
        "password": "StrongPass123!",
    }
    response = await client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == payload["email"]
    assert "id" in data

@pytest.mark.anyio
async def test_register_duplicate_email(client: AsyncClient):
    payload = {
        "name": "Another User",
        "email": "test@example.com",  # same as previous test
        "password": "AnotherPass321!",
    }
    response = await client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 400
    assert response.json()["detail"] == "Email already registered"

@pytest.mark.anyio
async def test_login_success(client: AsyncClient):
    login_payload = {"email": "test@example.com", "password": "StrongPass123!"}
    response = await client.post("/api/v1/auth/login", json=login_payload)
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"

@pytest.mark.anyio
async def test_login_invalid_password(client: AsyncClient):
    login_payload = {"email": "test@example.com", "password": "WrongPass"}
    response = await client.post("/api/v1/auth/login", json=login_payload)
    assert response.status_code == 401
    assert response.json()["detail"] == "Incorrect email or password"
