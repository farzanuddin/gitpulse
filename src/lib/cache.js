const CACHE_MAX_ENTRIES = 30;
const CACHE_TTL_MS = 15 * 60 * 1000;

export const getCached = (cacheMap, key) => {
  const cachedEntry = cacheMap.get(key);

  if (!cachedEntry) {
    return null;
  }

  if (Date.now() - cachedEntry.cachedAt > CACHE_TTL_MS) {
    cacheMap.delete(key);
    return null;
  }

  cacheMap.delete(key);
  cacheMap.set(key, cachedEntry);

  return cachedEntry.data;
};

export const setCached = (cacheMap, key, data) => {
  if (cacheMap.has(key)) {
    cacheMap.delete(key);
  }

  cacheMap.set(key, {
    data,
    cachedAt: Date.now(),
  });

  if (cacheMap.size > CACHE_MAX_ENTRIES) {
    const oldestKey = cacheMap.keys().next().value;
    cacheMap.delete(oldestKey);
  }
};
