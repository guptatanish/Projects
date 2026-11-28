from dataclasses import dataclass
from threading import Lock
import time
from typing import Any


@dataclass
class _CacheEntry:
    expires_at: float
    value: Any


class BoundedTTLCache:
    """Thread-safe bounded cache with TTL expiration and oldest-entry eviction."""

    def __init__(self, *, max_entries: int = 128, ttl_seconds: float = 300.0) -> None:
        self.max_entries = max(1, max_entries)
        self.ttl_seconds = max(1.0, float(ttl_seconds))
        self._lock = Lock()
        self._entries: dict[str, _CacheEntry] = {}

    def _evict_expired_locked(self, now_mono: float) -> None:
        expired = [k for k, entry in self._entries.items() if entry.expires_at <= now_mono]
        for k in expired:
            del self._entries[k]

    def get(self, key: str) -> Any | None:
        """Return cached value if present and not expired, else None."""
        now_mono = time.monotonic()
        with self._lock:
            self._evict_expired_locked(now_mono)
            entry = self._entries.get(key)
            if entry is None:
                return None
            if entry.expires_at <= now_mono:
                del self._entries[key]
                return None
            return entry.value

    def set(self, key: str, value: Any, *, ttl_seconds: float | None = None) -> None:
        """Store `value` under `key` with TTL and enforce `max_entries` bound."""
        now_mono = time.monotonic()
        ttl = self.ttl_seconds if ttl_seconds is None else max(1.0, float(ttl_seconds))
        with self._lock:
            self._evict_expired_locked(now_mono)
            if len(self._entries) >= self.max_entries and key not in self._entries:
                oldest_key = min(self._entries.items(), key=lambda item: item[1].expires_at)[0]
                del self._entries[oldest_key]
            self._entries[key] = _CacheEntry(
                expires_at=now_mono + ttl,
                value=value,
            )

    def clear(self) -> None:
        """Clear all cached entries."""
        with self._lock:
            self._entries.clear()


response_cache = BoundedTTLCache(max_entries=128, ttl_seconds=300.0)
