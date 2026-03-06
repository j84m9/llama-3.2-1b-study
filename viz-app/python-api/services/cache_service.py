import hashlib
import time
from collections import OrderedDict


class LRUCache:
    """Simple in-memory LRU cache with TTL, replacing the Java Caffeine layer."""

    def __init__(self, max_size: int = 20, ttl_seconds: int = 1800):
        self._cache: OrderedDict[str, tuple[float, object]] = OrderedDict()
        self._max_size = max_size
        self._ttl = ttl_seconds

    def _make_key(self, *parts: str) -> str:
        h = hashlib.sha256()
        for p in parts:
            h.update(p.encode())
        return h.hexdigest()[:16]

    def get(self, *key_parts: str) -> object | None:
        key = self._make_key(*key_parts)
        item = self._cache.get(key)
        if item is None:
            return None
        ts, value = item
        if time.time() - ts > self._ttl:
            del self._cache[key]
            return None
        self._cache.move_to_end(key)
        return value

    def put(self, value: object, *key_parts: str) -> None:
        key = self._make_key(*key_parts)
        self._cache[key] = (time.time(), value)
        self._cache.move_to_end(key)
        while len(self._cache) > self._max_size:
            self._cache.popitem(last=False)


result_cache = LRUCache()
