import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Search } from "../components/Search";

const mockUserData = {
  html_url: "https://github.com/testuser",
  avatar_url: "https://avatars.example.com/1",
  name: "Test User",
  login: "testuser",
  created_at: "2020-06-15T00:00:00Z",
  bio: "A developer",
  public_repos: 42,
  followers: 100,
  following: 50,
  location: "SF",
  blog: "",
  company: "",
  recent_repos: [],
};

const defaultHookState = {
  activeSuggestionIndex: -1,
  data: null,
  error: "",
  handleChange: vi.fn(),
  handleInputBlur: vi.fn(),
  handleInputFocus: vi.fn(),
  handleInputKeyDown: vi.fn(),
  handleSearchBarClick: vi.fn(),
  handleSuggestionSelect: vi.fn(),
  handleSubmit: vi.fn(),
  isSuggesting: false,
  loading: false,
  searchInputRef: { current: null },
  search: "",
  shake: false,
  showSuggestions: false,
  suggestions: [],
};

vi.mock("../hooks/useGithubUserSearch", () => ({
  useGithubUserSearch: vi.fn(),
}));

import { useGithubUserSearch } from "../hooks/useGithubUserSearch";

describe("Search", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useGithubUserSearch.mockReturnValue(defaultHookState);
  });

  it("renders the search form", () => {
    render(<Search />);
    expect(screen.getByPlaceholderText("Search GitHub username...")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Search" })).toBeInTheDocument();
  });

  it("shows loading state", () => {
    useGithubUserSearch.mockReturnValue({
      ...defaultHookState,
      loading: true,
    });

    render(<Search />);
    expect(screen.getByRole("button", { name: "Searching..." })).toBeInTheDocument();
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("calls handleSubmit on form submit", async () => {
    const handleSubmit = vi.fn((e) => e.preventDefault());
    useGithubUserSearch.mockReturnValue({
      ...defaultHookState,
      search: "testuser",
      handleSubmit,
    });

    const user = userEvent.setup();
    render(<Search />);

    await user.click(screen.getByRole("button", { name: "Search" }));
    expect(handleSubmit).toHaveBeenCalled();
  });

  it("renders suggestions dropdown when showSuggestions is true", () => {
    useGithubUserSearch.mockReturnValue({
      ...defaultHookState,
      showSuggestions: true,
      suggestions: [{ id: 1, login: "user1", avatar_url: "https://example.com/1", html_url: "" }],
    });

    render(<Search />);
    expect(screen.getByText("user1")).toBeInTheDocument();
  });

  it("renders loading message when suggesting", () => {
    useGithubUserSearch.mockReturnValue({
      ...defaultHookState,
      showSuggestions: true,
      isSuggesting: true,
    });

    render(<Search />);
    expect(screen.getByText("Searching users...")).toBeInTheDocument();
  });

  it("renders empty message when no suggestions", () => {
    useGithubUserSearch.mockReturnValue({
      ...defaultHookState,
      showSuggestions: true,
      suggestions: [],
    });

    render(<Search />);
    expect(screen.getByText("No username suggestions yet")).toBeInTheDocument();
  });

  it("renders Display when data is available", async () => {
    useGithubUserSearch.mockReturnValue({
      ...defaultHookState,
      data: mockUserData,
    });

    render(<Search />);
    expect(await screen.findByText("Test User")).toBeInTheDocument();
  });

  it("applies shake animation to button when shake is true", () => {
    useGithubUserSearch.mockReturnValue({
      ...defaultHookState,
      shake: true,
    });

    render(<Search />);
    const button = screen.getByRole("button", { name: "Search" });
    expect(button.className).toContain("shake");
  });

  it("renders FooterCredit", () => {
    render(<Search />);
    expect(screen.getByRole("link", { name: "Farzan Uddin" })).toBeInTheDocument();
  });
});
