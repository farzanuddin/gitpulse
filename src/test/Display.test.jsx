import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Display } from "../components/Display";

const mockUser = {
  html_url: "https://github.com/testuser",
  avatar_url: "https://avatars.example.com/1",
  name: "Test User",
  login: "testuser",
  created_at: "2020-06-15T00:00:00Z",
  bio: "A software developer",
  public_repos: 42,
  followers: 100,
  following: 50,
  location: "San Francisco",
  blog: "https://testuser.dev",
  company: "Acme Inc",
  recent_repos: [
    {
      id: 1,
      name: "repo-one",
      html_url: "https://github.com/testuser/repo-one",
      pushed_at: "2024-01-10T00:00:00Z",
      stargazers_count: 5,
    },
    {
      id: 2,
      name: "repo-two",
      html_url: "https://github.com/testuser/repo-two",
      pushed_at: "2024-02-15T00:00:00Z",
      stargazers_count: 3,
    },
  ],
};

describe("Display", () => {
  it("renders user name and login", () => {
    render(<Display data={mockUser} />);
    expect(screen.getByText("Test User")).toBeInTheDocument();
    expect(screen.getByText("@testuser")).toBeInTheDocument();
  });

  it("renders join date", () => {
    render(<Display data={mockUser} />);
    expect(screen.getByText("Joined June 2020")).toBeInTheDocument();
  });

  it("renders bio", () => {
    render(<Display data={mockUser} />);
    expect(screen.getByText("A software developer")).toBeInTheDocument();
  });

  it("renders fallback text when bio is empty", () => {
    render(<Display data={{ ...mockUser, bio: null }} />);
    expect(screen.getByText("This Profile has no bio.")).toBeInTheDocument();
  });

  it("renders stats", () => {
    render(<Display data={mockUser} />);
    expect(screen.getByText("42")).toBeInTheDocument();
    expect(screen.getByText("100")).toBeInTheDocument();
    expect(screen.getByText("50")).toBeInTheDocument();
  });

  it("renders location, company, and blog", () => {
    render(<Display data={mockUser} />);
    expect(screen.getByText("San Francisco")).toBeInTheDocument();
    expect(screen.getByText("Acme Inc")).toBeInTheDocument();
    expect(screen.getByText("https://testuser.dev")).toBeInTheDocument();
  });

  it("renders recent repos", () => {
    render(<Display data={mockUser} />);
    expect(screen.getByText("repo-one")).toBeInTheDocument();
    expect(screen.getByText("repo-two")).toBeInTheDocument();
  });

  it("renders repo dates", () => {
    render(<Display data={mockUser} />);
    expect(screen.getByText("10 Jan 2024")).toBeInTheDocument();
    expect(screen.getByText("15 Feb 2024")).toBeInTheDocument();
  });

  it("hides recent repos section when empty", () => {
    render(<Display data={{ ...mockUser, recent_repos: [] }} />);
    expect(screen.queryByText("Recent Repositories")).not.toBeInTheDocument();
  });

  it("renders user name fallback when name is null", () => {
    render(<Display data={{ ...mockUser, name: null }} />);
    expect(screen.getByText("testuser")).toBeInTheDocument();
  });

  it("uses login when name is null", () => {
    render(<Display data={{ ...mockUser, name: null, login: "testuser" }} />);
    // The heading should show login (testuser) when name is null
    const heading = screen.getByRole("heading", { level: 2 });
    expect(heading).toHaveTextContent("testuser");
  });
});
