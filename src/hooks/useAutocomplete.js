import { useCallback, useRef, useState } from "react";
import { githubFetchJson } from "../lib/githubApi";

const AUTOCOMPLETE_MIN_CHARS = 2;
const AUTOCOMPLETE_DELAY_MS = 240;
const AUTOCOMPLETE_LIMIT = 6;

const getUserSuggestions = async (query, signal) => {
  const json = await githubFetchJson(
    `https://api.github.com/search/users?q=${encodeURIComponent(query)}+in:login&type=user&per_page=${AUTOCOMPLETE_LIMIT}`,
    signal
  );

  if (!Array.isArray(json?.items)) {
    return [];
  }

  return json.items.map((user) => ({
    id: user.id,
    login: user.login,
    avatar_url: user.avatar_url,
    html_url: user.html_url,
  }));
};

export const useAutocomplete = () => {
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);

  const suggestionsCache = useRef(new Map());
  const activeController = useRef(null);
  const debounceRef = useRef(null);
  const hideTimeoutRef = useRef(null);

  const clearSuggestions = useCallback(() => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
    }

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    activeController.current?.abort();
    setSuggestions([]);
    setShowSuggestions(false);
    setIsSuggesting(false);
    setActiveSuggestionIndex(-1);
  }, []);

  const fetchSuggestions = useCallback(async (query) => {
    activeController.current?.abort();

    const controller = new AbortController();
    activeController.current = controller;

    setIsSuggesting(true);

    try {
      const fetched = await getUserSuggestions(query, controller.signal);
      setSuggestions(fetched);
      setShowSuggestions(true);
      return fetched;
    } catch (errorObj) {
      if (errorObj?.name !== "AbortError") {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    } finally {
      if (activeController.current === controller) {
        activeController.current = null;
      }

      setIsSuggesting(false);
    }
  }, []);

  const handleInput = useCallback(
    (nextValue) => {
      const trimmed = nextValue.trim();
      const normalizedQuery = trimmed.toLowerCase();

      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }

      setActiveSuggestionIndex(-1);

      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      if (trimmed.length < AUTOCOMPLETE_MIN_CHARS) {
        activeController.current?.abort();
        setSuggestions([]);
        setShowSuggestions(false);
        setIsSuggesting(false);
        return;
      }

      const cachedSuggestions = suggestionsCache.current.get(normalizedQuery);

      if (cachedSuggestions) {
        setSuggestions(cachedSuggestions);
        setShowSuggestions(true);
        setIsSuggesting(false);
        return;
      }

      debounceRef.current = setTimeout(async () => {
        const fetched = await fetchSuggestions(trimmed);
        suggestionsCache.current.set(normalizedQuery, fetched);
      }, AUTOCOMPLETE_DELAY_MS);
    },
    [fetchSuggestions]
  );

  const handleInputKeyDown = useCallback(
    (event) => {
      if (!showSuggestions || !suggestions.length) {
        return null;
      }

      if (event.key === "ArrowDown") {
        event.preventDefault();
        setActiveSuggestionIndex((prev) => (prev + 1) % suggestions.length);
        return null;
      }

      if (event.key === "ArrowUp") {
        event.preventDefault();
        setActiveSuggestionIndex((prev) => (prev <= 0 ? suggestions.length - 1 : prev - 1));
        return null;
      }

      if (event.key === "Enter" && activeSuggestionIndex >= 0) {
        event.preventDefault();
        return suggestions[activeSuggestionIndex];
      }

      if (event.key === "Escape") {
        event.preventDefault();
        setShowSuggestions(false);
        setActiveSuggestionIndex(-1);
        return null;
      }

      return null;
    },
    [activeSuggestionIndex, showSuggestions, suggestions]
  );

  const handleInputFocus = useCallback(() => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
    }

    if (suggestions.length) {
      setShowSuggestions(true);
    }
  }, [suggestions.length]);

  const handleInputBlur = useCallback(() => {
    hideTimeoutRef.current = setTimeout(() => {
      setShowSuggestions(false);
      setActiveSuggestionIndex(-1);
    }, 120);
  }, []);

  return {
    suggestions,
    showSuggestions,
    isSuggesting,
    activeSuggestionIndex,
    clearSuggestions,
    setShowSuggestions,
    setActiveSuggestionIndex,
    setSuggestions,
    handleInput,
    handleInputKeyDown,
    handleInputFocus,
    handleInputBlur,
  };
};
