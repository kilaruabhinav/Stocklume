import logging
import math
import threading
import time
from collections import defaultdict, deque
from dataclasses import dataclass

from fastapi import HTTPException, Request


logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class RateLimitRule:
    requests: int
    window_seconds: int
    message: str = "Too many requests. Please try again shortly."


RATE_LIMITS = {
    "login": RateLimitRule(5, 60),
    "register": RateLimitRule(3, 60),
    "simulation_buy": RateLimitRule(
        10,
        60,
        "Too many trade requests. Please wait a moment before trying again."
    ),
    "simulation_sell": RateLimitRule(
        10,
        60,
        "Too many trade requests. Please wait a moment before trying again."
    ),
    "simulation_reset": RateLimitRule(3, 60),
    "market": RateLimitRule(60, 60),
    "general_news": RateLimitRule(20, 60),
    "authenticated_read": RateLimitRule(60, 60)
}


class InMemoryRateLimiter:
    def __init__(self, clock=None):
        self._clock = clock or time.monotonic
        self._requests = defaultdict(deque)
        self._lock = threading.Lock()
        self._checks = 0

    def check(self, category, identity):
        rule = RATE_LIMITS[category]
        now = self._clock()
        cutoff = now - rule.window_seconds
        key = (category, identity)

        with self._lock:
            request_times = self._requests[key]

            while request_times and request_times[0] <= cutoff:
                request_times.popleft()

            if len(request_times) >= rule.requests:
                retry_after = max(
                    1,
                    math.ceil(
                        request_times[0] + rule.window_seconds - now
                    )
                )
                logger.warning(
                    "Rate limit exceeded: category=%s authenticated=%s",
                    category,
                    identity.startswith("user:")
                )
                raise HTTPException(
                    status_code=429,
                    detail=rule.message,
                    headers={"Retry-After": str(retry_after)}
                )

            request_times.append(now)
            self._checks += 1

            if self._checks % 1000 == 0:
                self._cleanup_expired_entries(now)

    def reset(self):
        with self._lock:
            self._requests.clear()
            self._checks = 0

    def _cleanup_expired_entries(self, now):
        empty_keys = []

        for key, request_times in self._requests.items():
            category = key[0]
            cutoff = now - RATE_LIMITS[category].window_seconds

            while request_times and request_times[0] <= cutoff:
                request_times.popleft()

            if not request_times:
                empty_keys.append(key)

        for key in empty_keys:
            del self._requests[key]


rate_limiter = InMemoryRateLimiter()


def enforce_client_rate_limit(request: Request, category):
    client_host = request.client.host if request.client else "unknown"
    rate_limiter.check(category, f"client:{client_host}")


def enforce_user_rate_limit(user_id, category):
    rate_limiter.check(category, f"user:{user_id}")
