import { describe, it, expect } from "vitest";
import { pickDisplayUserFields } from "../lib/githubUser";

describe("pickDisplayUserFields", () => {
  const fullUser = {
    html_url: "https://github.com/testuser",
    avatar_url: "https://avatars.example.com/1",
    name: "Test User",
    login: "testuser",
    created_at: "2020-01-01T00:00:00Z",
    bio: "A test user",
    public_repos: 10,
    followers: 100,
    following: 50,
    location: "San Francisco",
    blog: "https://testuser.dev",
    company: "Acme",
    recent_repos: [],
    extra_field: "should be excluded",
    node_id: "should also be excluded",
  };

  it("picks only the expected fields", () => {
    const result = pickDisplayUserFields(fullUser);
    expect(result).toEqual({
      html_url: "https://github.com/testuser",
      avatar_url: "https://avatars.example.com/1",
      name: "Test User",
      login: "testuser",
      created_at: "2020-01-01T00:00:00Z",
      bio: "A test user",
      public_repos: 10,
      followers: 100,
      following: 50,
      location: "San Francisco",
      blog: "https://testuser.dev",
      company: "Acme",
      recent_repos: [],
    });
  });

  it("excludes extra fields", () => {
    const result = pickDisplayUserFields(fullUser);
    expect(result).not.toHaveProperty("extra_field");
    expect(result).not.toHaveProperty("node_id");
  });

  it("defaults recent_repos to empty array", () => {
    const result = pickDisplayUserFields({ login: "test" });
    expect(result.recent_repos).toEqual([]);
  });
});
