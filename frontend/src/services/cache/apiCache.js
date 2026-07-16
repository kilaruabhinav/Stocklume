const cacheStore = new Map();
const pendingRequests = new Map();

export function normalizeCacheKey(key) {
  return String(key || "")
    .trim()
    .replace(/\s+/g, " ")
    .toUpperCase();
}

export function getCachedData(key) {
  const normalizedKey = normalizeCacheKey(key);
  const cachedEntry = cacheStore.get(normalizedKey);

  if (!cachedEntry) {
    return null;
  }

  if (Date.now() > cachedEntry.expiresAt) {
    cacheStore.delete(normalizedKey);
    return null;
  }

  return cachedEntry.data;
}

export function setCachedData(key, data, ttlMs) {
  const normalizedKey = normalizeCacheKey(key);

  cacheStore.set(normalizedKey, {
    data,
    expiresAt: Date.now() + ttlMs
  });

  return data;
}

export async function getOrSetCachedData(key, fetcher, ttlMs, options = {}) {
  const normalizedKey = normalizeCacheKey(key);
  const cachedData = getCachedData(normalizedKey);

  if (cachedData !== null) {
    return cachedData;
  }

  if (pendingRequests.has(normalizedKey)) {
    return pendingRequests.get(normalizedKey);
  }

  // Reuse in-flight requests so repeated modal opens do not duplicate quota-heavy calls.
  const pendingRequest = Promise.resolve()
    .then(fetcher)
    .then((data) => {
      const shouldCache = options.shouldCache ? options.shouldCache(data) : data !== null && data !== undefined;

      if (shouldCache) {
        setCachedData(normalizedKey, data, ttlMs);
      }

      return data;
    })
    .finally(() => {
      pendingRequests.delete(normalizedKey);
    });

  pendingRequests.set(normalizedKey, pendingRequest);
  return pendingRequest;
}

export function clearApiCache(key) {
  if (key) {
    cacheStore.delete(normalizeCacheKey(key));
    pendingRequests.delete(normalizeCacheKey(key));
    return;
  }

  cacheStore.clear();
  pendingRequests.clear();
}
