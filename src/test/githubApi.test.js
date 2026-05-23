import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  GitHubApiError,
  githubFetch,
  githubFetchJson,
  getErrorMessage,
  ERROR_MESSAGES,
} from "../lib/githubApi";

describe("GitHubApiError", () => {
  it("sets name, message, and status", () => {
    const error = new GitHubApiError("Not found", 404);
    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe("GitHubApiError");
    expect(error.message).toBe("Not found");
    expect(error.status).toBe(404);
  });
});

describe("getErrorMessage", () => {
  it("returns userNotFound for 404", () => {
    expect(getErrorMessage({ status: 404 })).toBe(ERROR_MESSAGES.userNotFound);
  });

  it("returns rateLimit for 403", () => {
    expect(getErrorMessage({ status: 403 })).toBe(ERROR_MESSAGES.rateLimit);
  });

  it("returns network for TypeError", () => {
    expect(getErrorMessage({ name: "TypeError" })).toBe(ERROR_MESSAGES.network);
  });

  it("returns generic for unknown error", () => {
    expect(getErrorMessage({})).toBe(ERROR_MESSAGES.generic);
  });

  it("returns generic for null/undefined", () => {
    expect(getErrorMessage(null)).toBe(ERROR_MESSAGES.generic);
    expect(getErrorMessage(undefined)).toBe(ERROR_MESSAGES.generic);
  });
});

describe("githubFetch", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns response on success", async () => {
    const mockResponse = { ok: true, json: () => Promise.resolve({ login: "testuser" }) };
    globalThis.fetch = vi.fn().mockResolvedValue(mockResponse);

    const response = await githubFetch("https://api.github.com/users/testuser");
    expect(response).toBe(mockResponse);
  });

  it("throws GitHubApiError on non-ok response", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: false, status: 404 });

    await expect(githubFetch("https://api.github.com/users/nonexistent")).rejects.toThrow(
      GitHubApiError
    );
  });

  it("throws GitHubApiError with correct status on 403", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: false, status: 403 });

    try {
      await githubFetch("https://api.github.com/users/test");
    } catch (error) {
      expect(error).toBeInstanceOf(GitHubApiError);
      expect(error.status).toBe(403);
    }
  });

  it("passes signal to fetch", async () => {
    const controller = new AbortController();
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: true });
    await githubFetch("https://api.github.com/users/test", controller.signal);
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ signal: controller.signal })
    );
  });
});

describe("githubFetchJson", () => {
  it("returns parsed JSON", async () => {
    const data = { login: "testuser" };
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(data),
    });

    const result = await githubFetchJson("https://api.github.com/users/testuser");
    expect(result).toEqual(data);
  });
});
