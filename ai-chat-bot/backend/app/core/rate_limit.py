from collections import deque
from datetime import datetime, timezone
from threading import Lock
import time

from app.core.config import settings
from app.core.errors import RateLimitExceededError


class InMemoryRateLimiter:
    """Thread-safe sliding-window minute rate limiter with a UTC daily request cap."""

    def __init__(
        self,
        max_requests_per_minute: int = 20,
        max_requests_per_day: int = 300,
        window_seconds: float = 60.0,
    ) -> None:
        self.max_requests_per_minute = max(1, max_requests_per_minute)
        self.max_requests_per_day = max(1, max_requests_per_day)
        self.window_seconds = float(window_seconds)
        self._lock = Lock()
        self._minute_hits: dict[str, deque[float]] = {}
        self._daily_hits: dict[str, tuple[str, int]] = {}
        self._last_prune_mono: float = time.monotonic()

    def _prune_stale_locked(self, now_mono: float, today_utc: str) -> None:
        """Evict expired minute timestamps and keys from prior UTC days periodically."""
        if now_mono - self._last_prune_mono < 60.0:
            return
        self._last_prune_mono = now_mono

        cutoff = now_mono - self.window_seconds
        expired_minute_keys: list[str] = []
        for key, bucket in self._minute_hits.items():
            while bucket and bucket[0] <= cutoff:
                bucket.popleft()
            if not bucket:
                expired_minute_keys.append(key)
        for key in expired_minute_keys:
            del self._minute_hits[key]

        stale_day_keys = [
            key
            for key, (day_str, _) in self._daily_hits.items()
            if day_str != today_utc
        ]
        for key in stale_day_keys:
            del self._daily_hits[key]

    def check_and_record(self, key: str = "default") -> None:
        """Record a request for `key` or raise RateLimitExceededError if over quota."""
        normalized_key = (key or "default").strip() or "default"
        now_mono = time.monotonic()
        today_utc = datetime.now(timezone.utc).strftime("%Y-%m-%d")

        with self._lock:
            self._prune_stale_locked(now_mono, today_utc)

            day_key, day_count = self._daily_hits.get(normalized_key, (today_utc, 0))
            if day_key != today_utc:
                day_key = today_utc
                day_count = 0

            if day_count >= self.max_requests_per_day:
                raise RateLimitExceededError(
                    f"Daily request limit ({self.max_requests_per_day}/day) reached. Please try again tomorrow."
                )

            bucket = self._minute_hits.get(normalized_key)
            if bucket is None:
                bucket = deque()
                self._minute_hits[normalized_key] = bucket

            cutoff = now_mono - self.window_seconds
            while bucket and bucket[0] <= cutoff:
                bucket.popleft()

            if len(bucket) >= self.max_requests_per_minute:
                raise RateLimitExceededError(
                    f"Rate limit exceeded ({self.max_requests_per_minute} requests per minute). Please slow down and try again."
                )

            bucket.append(now_mono)
            self._daily_hits[normalized_key] = (day_key, day_count + 1)

    def reset(self) -> None:
        """Clear all recorded rate-limit counters (useful for tests/local checks)."""
        with self._lock:
            self._minute_hits.clear()
            self._daily_hits.clear()


chat_rate_limiter = InMemoryRateLimiter(
    max_requests_per_minute=settings.rate_limit_per_minute,
    max_requests_per_day=settings.rate_limit_per_day,
    window_seconds=60.0,
)

auth_rate_limiter = InMemoryRateLimiter(
    max_requests_per_minute=settings.auth_rate_limit_per_minute,
    max_requests_per_day=settings.auth_rate_limit_per_day,
    window_seconds=60.0,
)
