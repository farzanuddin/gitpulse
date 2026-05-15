import { useCallback, useEffect, useRef, useState } from "react";
import { createHeaderStatus } from "../utils/headerStatus";
import { pickDisplayUserFields } from "../utils/githubUser";
import { githubFetchJson, getErrorMessage, ERROR_MESSAGES } from "../lib/githubApi";

const DEFAULT_USER = "farzanuddin";
const CACHE_MAX_ENTRIES = 30;
const CACHE_TTL_MS = 15 * 60 * 1000;
const RECENT_REPOS_LIMIT = 3;
const AUTOCOMPLETE_MIN_CHARS = 2;
const AUTOCOMPLETE_DELAY_MS = 240;
const AUTOCOMPLETE_LIMIT = 6;

const getGithubUserInformation = async (userName, signal) => {
  return githubFetchJson(`https://api.github.com/users/${encodeURIComponent(userName)}`, signal);
};

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

const getRecentRepos = async (userName, signal) => {
  try {
    const repos = await githubFetchJson(
      `https://api.github.com/users/${encodeURIComponent(userName)}/repos?sort=pushed&per_page=12&type=owner`,
      signal
    );

    return repos
      .filter((repo) => !repo.fork)
      .slice(0, RECENT_REPOS_LIMIT)
      .map((repo) => ({
        id: repo.id,
        name: repo.name,
        html_url: repo.html_url,
        pushed_at: repo.pushed_at,
        stargazers_count: repo.stargazers_count,
      }));
  } catch (errorObj) {
    if (errorObj?.name === "AbortError") {
      throw errorObj;
    }

    return [];
  }
};

const getCachedUser = (cacheMap, key) => {
  const cachedEntry = cacheMap.get(key);

  if (!cachedEntry) {
    return null;
  }

  if (Date.now() - cachedEntry.cachedAt > CACHE_TTL_MS) {
    cacheMap.delete(key);
    return null;
  }

  // refresh LRU position
  cacheMap.delete(key);
  cacheMap.set(key, cachedEntry);

  return cachedEntry.data;
};

const setCachedUser = (cacheMap, key, data) => {
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

export const useGithubUserSearch = ({ onStatusChange }) => {
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [data, setData] = useState(null);
  const [shake, setShake] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isCachedResult, setIsCachedResult] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
  const [areSuggestionsDisabled, setAreSuggestionsDisabled] = useState(false);

  const searchInputRef = useRef(null);
  const userCache = useRef(new Map());
  const suggestionsCache = useRef(new Map());
  const activeRequestId = useRef(0);
  const activeController = useRef(null);
  const activeSuggestionsController = useRef(null);
  const shakeTimeoutRef = useRef(null);
  const suggestionDebounceRef = useRef(null);
  const hideSuggestionsTimeoutRef = useRef(null);
  const onStatusChangeRef = useRef(onStatusChange);
  onStatusChangeRef.current = onStatusChange;

  const triggerShake = useCallback(() => {
    if (shakeTimeoutRef.current) {
      clearTimeout(shakeTimeoutRef.current);
    }

    setShake(true);
    shakeTimeoutRef.current = setTimeout(() => {
      setShake(false);
    }, 500);
  }, []);

  const searchUser = useCallback(
    async (username) => {
      const normalizedUsername = username.trim();
      const cacheKey = normalizedUsername.toLowerCase();

      if (!normalizedUsername) {
        setError(ERROR_MESSAGES.emptySearch);
        triggerShake();
        return;
      }

      if (hideSuggestionsTimeoutRef.current) {
        clearTimeout(hideSuggestionsTimeoutRef.current);
      }

      setShowSuggestions(false);
      setActiveSuggestionIndex(-1);

      const cachedResult = getCachedUser(userCache.current, cacheKey);

      if (cachedResult) {
        setError("");
        setIsCachedResult(true);
        setData(cachedResult);
        return;
      }

      activeController.current?.abort();

      const controller = new AbortController();
      activeController.current = controller;

      const requestId = activeRequestId.current + 1;
      activeRequestId.current = requestId;

      setLoading(true);
      setError("");

      try {
        const [userData, recentRepos] = await Promise.all([
          getGithubUserInformation(normalizedUsername, controller.signal),
          getRecentRepos(normalizedUsername, controller.signal),
        ]);

        const displayUser = pickDisplayUserFields({
          ...userData,
          recent_repos: recentRepos,
        });

        if (requestId !== activeRequestId.current) {
          return;
        }

        setCachedUser(userCache.current, cacheKey, displayUser);
        setIsCachedResult(false);
        setData(displayUser);
      } catch (errorObj) {
        if (errorObj?.name === "AbortError") {
          return;
        }

        if (requestId !== activeRequestId.current) {
          return;
        }

        if (errorObj?.status === 403) {
          setAreSuggestionsDisabled(true);
          setSuggestions([]);
          setShowSuggestions(false);
        }

        setIsCachedResult(false);
        setError(getErrorMessage(errorObj));
        triggerShake();
      } finally {
        if (requestId === activeRequestId.current) {
          setLoading(false);
        }

        if (activeController.current === controller) {
          activeController.current = null;
        }
      }
    },
    [triggerShake]
  );

  const handleSubmit = useCallback(
    (event) => {
      event.preventDefault();
      searchUser(search);
    },
    [search, searchUser]
  );

  const handleChange = useCallback(
    (event) => {
      const nextValue = event.target.value;
      const normalizedQuery = nextValue.trim().toLowerCase();

      setSearch(nextValue);

      if (hideSuggestionsTimeoutRef.current) {
        clearTimeout(hideSuggestionsTimeoutRef.current);
      }

      setActiveSuggestionIndex(-1);

      if (suggestionDebounceRef.current) {
        clearTimeout(suggestionDebounceRef.current);
      }

      if (areSuggestionsDisabled) {
        activeSuggestionsController.current?.abort();
        setSuggestions([]);
        setShowSuggestions(false);
        setIsSuggesting(false);
        return;
      }

      if (nextValue.trim().length < AUTOCOMPLETE_MIN_CHARS) {
        activeSuggestionsController.current?.abort();
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

      suggestionDebounceRef.current = setTimeout(async () => {
        activeSuggestionsController.current?.abort();

        const controller = new AbortController();
        activeSuggestionsController.current = controller;

        setIsSuggesting(true);

        try {
          const fetchedSuggestions = await getUserSuggestions(nextValue.trim(), controller.signal);

          suggestionsCache.current.set(normalizedQuery, fetchedSuggestions);
          setSuggestions(fetchedSuggestions);
          setShowSuggestions(true);
        } catch (errorObj) {
          if (errorObj?.name !== "AbortError") {
            if (errorObj?.status === 403) {
              setAreSuggestionsDisabled(true);
            }

            setSuggestions([]);
            setShowSuggestions(false);
          }
        } finally {
          if (activeSuggestionsController.current === controller) {
            activeSuggestionsController.current = null;
          }

          setIsSuggesting(false);
        }
      }, AUTOCOMPLETE_DELAY_MS);
    },
    [areSuggestionsDisabled]
  );

  const handleSuggestionSelect = useCallback(
    (suggestion) => {
      setSearch(suggestion.login);
      setShowSuggestions(false);
      setActiveSuggestionIndex(-1);
      searchUser(suggestion.login);
    },
    [searchUser]
  );

  const handleInputKeyDown = useCallback(
    (event) => {
      if (!showSuggestions || !suggestions.length) {
        return;
      }

      if (event.key === "ArrowDown") {
        event.preventDefault();
        setActiveSuggestionIndex((prevIndex) => (prevIndex + 1) % suggestions.length);
        return;
      }

      if (event.key === "ArrowUp") {
        event.preventDefault();
        setActiveSuggestionIndex((prevIndex) =>
          prevIndex <= 0 ? suggestions.length - 1 : prevIndex - 1
        );
        return;
      }

      if (event.key === "Enter" && activeSuggestionIndex >= 0) {
        event.preventDefault();
        handleSuggestionSelect(suggestions[activeSuggestionIndex]);
        return;
      }

      if (event.key === "Escape") {
        event.preventDefault();
        setShowSuggestions(false);
        setActiveSuggestionIndex(-1);
      }
    },
    [activeSuggestionIndex, handleSuggestionSelect, showSuggestions, suggestions]
  );

  const handleInputFocus = useCallback(() => {
    if (hideSuggestionsTimeoutRef.current) {
      clearTimeout(hideSuggestionsTimeoutRef.current);
    }

    if (suggestions.length) {
      setShowSuggestions(true);
    }
  }, [suggestions.length]);

  const handleInputBlur = useCallback(() => {
    hideSuggestionsTimeoutRef.current = setTimeout(() => {
      setShowSuggestions(false);
      setActiveSuggestionIndex(-1);
    }, 120);
  }, []);

  const handleSearchBarClick = useCallback((event) => {
    const clickedButton = event.target.closest("button");

    if (clickedButton) {
      return;
    }

    searchInputRef.current?.focus();
  }, []);

  useEffect(() => {
    let isCancelled = false;

    const cacheKey = DEFAULT_USER.toLowerCase();
    const cachedResult = getCachedUser(userCache.current, cacheKey);

    if (!cachedResult) {
      searchUser(DEFAULT_USER);
    } else if (!isCancelled) {
      setData(cachedResult);
      setIsCachedResult(true);
    }

    return () => {
      isCancelled = true;

      if (shakeTimeoutRef.current) {
        clearTimeout(shakeTimeoutRef.current);
      }

      if (suggestionDebounceRef.current) {
        clearTimeout(suggestionDebounceRef.current);
      }

      if (hideSuggestionsTimeoutRef.current) {
        clearTimeout(hideSuggestionsTimeoutRef.current);
      }
    };
    // searchUser intentionally not in deps — only run on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    onStatusChangeRef.current?.(
      createHeaderStatus({ showCache: isCachedResult, warningText: error })
    );
  }, [error, isCachedResult]);

  return {
    activeSuggestionIndex,
    data,
    error,
    handleChange,
    handleInputBlur,
    handleInputFocus,
    handleInputKeyDown,
    handleSearchBarClick,
    handleSuggestionSelect,
    handleSubmit,
    isSuggesting,
    loading,
    searchInputRef,
    search,
    shake,
    showSuggestions,
    suggestions,
  };
};
