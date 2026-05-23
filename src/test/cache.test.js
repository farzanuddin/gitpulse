import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { getCached, setCached } from "../lib/cache";

describe("cache", () => {
  let cacheMap;

  beforeEach(() => {
    vi.useFakeTimers();
    cacheMap = new Map();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("setCached", () => {
    it("stores data with a timestamp", () => {
      setCached(cacheMap, "user1", { name: "Alice" });
      const entry = cacheMap.get("user1");
      expect(entry.data).toEqual({ name: "Alice" });
      expect(entry.cachedAt).toBeGreaterThan(0);
    });

    it("replaces existing entry for same key", () => {
      setCached(cacheMap, "key", { version: 1 });
      setCached(cacheMap, "key", { version: 2 });
      expect(cacheMap.get("key").data).toEqual({ version: 2 });
    });

    it("evicts oldest entry when over max size", () => {
      for (let i = 0; i < 31; i++) {
        setCached(cacheMap, `key${i}`, i);
      }
      expect(cacheMap.size).toBe(30);
      expect(cacheMap.has("key0")).toBe(false);
      expect(cacheMap.has("key1")).toBe(true);
    });
  });

  describe("getCached", () => {
    it("returns null for missing key", () => {
      expect(getCached(cacheMap, "nonexistent")).toBeNull();
    });

    it("returns cached data when within TTL", () => {
      setCached(cacheMap, "user1", { name: "Alice" });
      vi.advanceTimersByTime(5 * 60 * 1000); // 5 min
      expect(getCached(cacheMap, "user1")).toEqual({ name: "Alice" });
    });

    it("returns null and deletes expired entry", () => {
      setCached(cacheMap, "user1", { name: "Alice" });
      vi.advanceTimersByTime(16 * 60 * 1000); // > 15 min
      expect(getCached(cacheMap, "user1")).toBeNull();
      expect(cacheMap.has("user1")).toBe(false);
    });

    it("refreshes LRU position on access", () => {
      setCached(cacheMap, "a", 1);
      setCached(cacheMap, "b", 2);

      getCached(cacheMap, "a");

      // After iterating, 'a' should be newest, 'b' oldest
      const keys = [...cacheMap.keys()];
      expect(keys[0]).toBe("b");
      expect(keys[1]).toBe("a");
    });
  });
});
