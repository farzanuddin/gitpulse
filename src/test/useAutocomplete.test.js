import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useAutocomplete } from "../hooks/useAutocomplete";

const mockItems = [
  {
    id: 1,
    login: "user1",
    avatar_url: "https://example.com/1",
    html_url: "https://github.com/user1",
  },
  {
    id: 2,
    login: "user2",
    avatar_url: "https://example.com/2",
    html_url: "https://github.com/user2",
  },
];

describe("useAutocomplete", () => {
  beforeEach(() => {
    globalThis.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("starts with empty state", () => {
    const { result } = renderHook(() => useAutocomplete());
    expect(result.current.suggestions).toEqual([]);
    expect(result.current.showSuggestions).toBe(false);
    expect(result.current.isSuggesting).toBe(false);
    expect(result.current.activeSuggestionIndex).toBe(-1);
  });

  it("does not fetch for input shorter than min chars", () => {
    const { result } = renderHook(() => useAutocomplete());

    act(() => {
      result.current.handleInput("a");
    });

    expect(globalThis.fetch).not.toHaveBeenCalled();
    expect(result.current.showSuggestions).toBe(false);
  });

  it("fetches suggestions after debounce for valid input", async () => {
    globalThis.fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ items: mockItems }),
    });

    const { result } = renderHook(() => useAutocomplete());

    act(() => {
      result.current.handleInput("us");
    });

    await vi.waitFor(
      () => {
        expect(result.current.suggestions).toHaveLength(2);
      },
      { timeout: 2000 }
    );

    expect(result.current.showSuggestions).toBe(true);
  }, 10000);

  it("clears suggestions on clearSuggestions", () => {
    const { result } = renderHook(() => useAutocomplete());

    act(() => {
      result.current.setSuggestions(mockItems);
      result.current.setShowSuggestions(true);
    });

    act(() => {
      result.current.clearSuggestions();
    });

    expect(result.current.suggestions).toEqual([]);
    expect(result.current.showSuggestions).toBe(false);
    expect(result.current.isSuggesting).toBe(false);
    expect(result.current.activeSuggestionIndex).toBe(-1);
  });

  it("navigates with ArrowDown and ArrowUp", () => {
    const { result } = renderHook(() => useAutocomplete());

    act(() => {
      result.current.setSuggestions(mockItems);
      result.current.setShowSuggestions(true);
    });

    act(() => {
      result.current.handleInputKeyDown({ key: "ArrowDown", preventDefault: vi.fn() });
    });
    expect(result.current.activeSuggestionIndex).toBe(0);

    act(() => {
      result.current.handleInputKeyDown({ key: "ArrowDown", preventDefault: vi.fn() });
    });
    expect(result.current.activeSuggestionIndex).toBe(1);

    act(() => {
      result.current.handleInputKeyDown({ key: "ArrowUp", preventDefault: vi.fn() });
    });
    expect(result.current.activeSuggestionIndex).toBe(0);
  });

  it("non-destructive key presses return null", () => {
    const { result } = renderHook(() => useAutocomplete());

    act(() => {
      result.current.setSuggestions(mockItems);
      result.current.setShowSuggestions(true);
    });

    let returned;
    act(() => {
      returned = result.current.handleInputKeyDown({ key: "a", preventDefault: vi.fn() });
    });
    expect(returned).toBeNull();
  });

  it("wraps active index around with ArrowDown at last item", () => {
    const { result } = renderHook(() => useAutocomplete());

    act(() => {
      result.current.setSuggestions(mockItems);
      result.current.setShowSuggestions(true);
      result.current.setActiveSuggestionIndex(1);
    });

    act(() => {
      result.current.handleInputKeyDown({ key: "ArrowDown", preventDefault: vi.fn() });
    });

    expect(result.current.activeSuggestionIndex).toBe(0);
  });

  it("returns selected suggestion on Enter", () => {
    const { result } = renderHook(() => useAutocomplete());

    act(() => {
      result.current.setSuggestions(mockItems);
      result.current.setShowSuggestions(true);
      result.current.setActiveSuggestionIndex(0);
    });

    let selected;
    act(() => {
      selected = result.current.handleInputKeyDown({ key: "Enter", preventDefault: vi.fn() });
    });

    expect(selected).toEqual(mockItems[0]);
  });

  it("hides suggestions on Escape", () => {
    const { result } = renderHook(() => useAutocomplete());

    act(() => {
      result.current.setSuggestions(mockItems);
      result.current.setShowSuggestions(true);
      result.current.setActiveSuggestionIndex(0);
    });

    act(() => {
      result.current.handleInputKeyDown({ key: "Escape", preventDefault: vi.fn() });
    });

    expect(result.current.showSuggestions).toBe(false);
    expect(result.current.activeSuggestionIndex).toBe(-1);
  });

  it("shows suggestions on focus when suggestions exist", () => {
    const { result } = renderHook(() => useAutocomplete());

    act(() => {
      result.current.setSuggestions(mockItems);
    });

    act(() => {
      result.current.handleInputFocus();
    });

    expect(result.current.showSuggestions).toBe(true);
  });

  it("does nothing on focus when no suggestions", () => {
    const { result } = renderHook(() => useAutocomplete());

    act(() => {
      result.current.handleInputFocus();
    });

    expect(result.current.showSuggestions).toBe(false);
  });

  it("hides suggestions on blur after delay", () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useAutocomplete());

    act(() => {
      result.current.setShowSuggestions(true);
    });

    act(() => {
      result.current.handleInputBlur();
    });

    expect(result.current.showSuggestions).toBe(true);

    act(() => {
      vi.advanceTimersByTime(150);
    });

    expect(result.current.showSuggestions).toBe(false);
    vi.useRealTimers();
  });

  it("returns null when suggestions are empty", () => {
    const { result } = renderHook(() => useAutocomplete());

    let returned;
    act(() => {
      returned = result.current.handleInputKeyDown({ key: "ArrowDown", preventDefault: vi.fn() });
    });

    expect(returned).toBeNull();
  });
});
