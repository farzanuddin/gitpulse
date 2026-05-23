const GITHUB_TOKEN = import.meta.env.VITE_GITHUB_TOKEN?.trim();

const getHeaders = () => {
  const headers = {
    Accept: "application/vnd.github+json",
  };

  if (GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${GITHUB_TOKEN}`;
  }

  return headers;
};

export class GitHubApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = "GitHubApiError";
    this.status = status;
  }
}

export const githubFetch = async (url, signal) => {
  const response = await fetch(url, {
    headers: getHeaders(),
    signal,
  });

  if (!response.ok) {
    throw new GitHubApiError("GitHub request failed", response.status);
  }

  return response;
};

export const githubFetchJson = async (url, signal) => {
  const response = await githubFetch(url, signal);
  return await response.json();
};

export const ERROR_MESSAGES = {
  emptySearch: "Please enter a username",
  userNotFound: "User not found",
  rateLimit: "Rate limit reached. Please try again later.",
  network: "Network error. Check your connection and try again.",
  generic: "Something went wrong. Please try again.",
};

export const getErrorMessage = (errorObj) => {
  if (errorObj?.status === 404) {
    return ERROR_MESSAGES.userNotFound;
  }

  if (errorObj?.status === 403) {
    return ERROR_MESSAGES.rateLimit;
  }

  if (errorObj?.name === "TypeError") {
    return ERROR_MESSAGES.network;
  }

  return ERROR_MESSAGES.generic;
};
