import { useCallback, useEffect, useRef, useState } from "react";
import { createHeaderStatus } from "../lib/headerStatus";
import { pickDisplayUserFields } from "../lib/githubUser";
import { githubFetchJson, getErrorMessage, ERROR_MESSAGES } from "../lib/githubApi";
import { getCached, setCached } from "../lib/cache";
import { useAutocomplete } from "./useAutocomplete";

const DEFAULT_USER = "farzanuddin";
const RECENT_REPOS_LIMIT = 3;
const SUGGESTIONS_RETRY_MS = 5 * 60 * 1000;

const getGithubUserInformation = async (userName, signal) => {
  return githubFetchJson(`https://api.github.com/users/${encodeURIComponent(userName)}`, signal);
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

export const useGithubUserSearch = ({ onStatusChange }) => {
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [data, setData] = useState(null);
  const [shake, setShake] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isCachedResult, setIsCachedResult] = useState(false);
  const [areSuggestionsDisabled, setAreSuggestionsDisabled] = useState(false);

  const searchInputRef = useRef(null);
  const userCache = useRef(new Map());
  const activeController = useRef(null);
  const shakeTimeoutRef = useRef(null);
  const suggestionsRetryTimeoutRef = useRef(null);
  const onStatusChangeRef = useRef(onStatusChange);
  onStatusChangeRef.current = onStatusChange;

  const autocomplete = useAutocomplete();

  const disableSuggestions = useCallback(() => {
    setAreSuggestionsDisabled(true);
    autocomplete.clearSuggestions();

    suggestionsRetryTimeoutRef.current = setTimeout(() => {
      setAreSuggestionsDisabled(false);
    }, SUGGESTIONS_RETRY_MS);
  }, [autocomplete]);

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

      autocomplete.clearSuggestions();

      const cachedResult = getCached(userCache.current, cacheKey);

      if (cachedResult) {
        setError("");
        setIsCachedResult(true);
        setData(cachedResult);
        return;
      }

      activeController.current?.abort();

      const controller = new AbortController();
      activeController.current = controller;

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

        setCached(userCache.current, cacheKey, displayUser);
        setIsCachedResult(false);
        setData(displayUser);
      } catch (errorObj) {
        if (errorObj?.name === "AbortError") {
          return;
        }

        if (errorObj?.status === 403) {
          disableSuggestions();
        }

        setIsCachedResult(false);
        setError(getErrorMessage(errorObj));
        triggerShake();
      } finally {
        if (activeController.current === controller) {
          setLoading(false);
          activeController.current = null;
        }
      }
    },
    [triggerShake, autocomplete, disableSuggestions]
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
      setSearch(nextValue);

      if (areSuggestionsDisabled) {
        autocomplete.clearSuggestions();
        return;
      }

      autocomplete.handleInput(nextValue);
    },
    [areSuggestionsDisabled, autocomplete]
  );

  const handleSuggestionSelect = useCallback(
    (suggestion) => {
      setSearch(suggestion.login);
      autocomplete.clearSuggestions();
      searchUser(suggestion.login);
    },
    [searchUser, autocomplete]
  );

  const handleInputKeyDown = useCallback(
    (event) => {
      const selectedSuggestion = autocomplete.handleInputKeyDown(event);

      if (selectedSuggestion) {
        handleSuggestionSelect(selectedSuggestion);
      }
    },
    [autocomplete, handleSuggestionSelect]
  );

  const handleInputFocus = useCallback(() => {
    autocomplete.handleInputFocus();
  }, [autocomplete]);

  const handleInputBlur = useCallback(() => {
    autocomplete.handleInputBlur();
  }, [autocomplete]);

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
    const cachedResult = getCached(userCache.current, cacheKey);

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

      if (suggestionsRetryTimeoutRef.current) {
        clearTimeout(suggestionsRetryTimeoutRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    onStatusChangeRef.current?.(
      createHeaderStatus({ showCache: isCachedResult, warningText: error })
    );
  }, [error, isCachedResult]);

  return {
    activeSuggestionIndex: autocomplete.activeSuggestionIndex,
    data,
    error,
    handleChange,
    handleInputBlur,
    handleInputFocus,
    handleInputKeyDown,
    handleSearchBarClick,
    handleSuggestionSelect,
    handleSubmit,
    isSuggesting: autocomplete.isSuggesting,
    loading,
    searchInputRef,
    search,
    shake,
    showSuggestions: autocomplete.showSuggestions,
    suggestions: autocomplete.suggestions,
  };
};
