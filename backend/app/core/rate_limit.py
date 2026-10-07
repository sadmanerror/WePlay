import time
from collections import defaultdict
from typing import Dict, List
from fastapi import HTTPException, status, Request


class InMemoryRateLimiter:
    """Simple in-memory token/sliding-window rate limiter for auth and chat endpoints."""

    def __init__(self, requests_limit: int = 15, window_seconds: int = 60):
        self.requests_limit = requests_limit
        self.window_seconds = window_seconds
        self.client_requests: Dict[str, List[float]] = defaultdict(list)

    def check(self, request: Request, identifier: str = None) -> bool:
        client_ip = identifier or (request.client.host if request.client else "unknown")
        now = time.time()
        window_start = now - self.window_seconds

        # Clean expired timestamps
        self.client_requests[client_ip] = [
            t for t in self.client_requests[client_ip] if t > window_start
        ]

        if len(self.client_requests[client_ip]) >= self.requests_limit:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Rate limit exceeded. Please wait a moment before trying again.",
            )

        self.client_requests[client_ip].append(now)
        return True


# Dedicated rate limiters
auth_limiter = InMemoryRateLimiter(requests_limit=10, window_seconds=60)
chat_limiter = InMemoryRateLimiter(requests_limit=60, window_seconds=60)
