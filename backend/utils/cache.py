from functools import lru_cache
import time
from typing import Any, Callable

class Cache:
    def __init__(self, maxsize: int = 100, ttl: int = 3600):
        self.maxsize = maxsize
        self.ttl = ttl
        self._cache = {}

    def get(self, key: str) -> Any:
        if key in self._cache:
            value, timestamp = self._cache[key]
            if time.time() - timestamp < self.ttl:
                return value
            del self._cache[key]
        return None

    def set(self, key: str, value: Any) -> None:
        self._cache[key] = (value, time.time())
        if len(self._cache) > self.maxsize:
            # 删除最旧的缓存项
            oldest_key = min(self._cache.items(), key=lambda x: x[1][1])[0]
            del self._cache[oldest_key]

    def clear(self) -> None:
        self._cache.clear()

# 创建全局缓存实例
cache = Cache()

def cached(ttl: int = 3600):
    def decorator(func: Callable) -> Callable:
        def wrapper(*args, **kwargs):
            key = f"{func.__name__}:{str(args)}:{str(kwargs)}"
            cached_value = cache.get(key)
            if cached_value is not None:
                return cached_value
            result = func(*args, **kwargs)
            cache.set(key, result)
            return result
        return wrapper
    return decorator 