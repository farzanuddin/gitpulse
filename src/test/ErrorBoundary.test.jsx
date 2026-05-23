import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { ErrorBoundary } from "../components/ErrorBoundary";

const ProblemChild = () => {
  throw new Error("Test error");
};

const GoodChild = () => <div>All good</div>;

describe("ErrorBoundary", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });
  it("renders children when no error occurs", () => {
    render(
      <ErrorBoundary>
        <GoodChild />
      </ErrorBoundary>
    );
    expect(screen.getByText("All good")).toBeInTheDocument();
  });

  it("renders error UI when a child throws", () => {
    // Suppress console.error from React for the intentional error
    vi.spyOn(console, "error").mockImplementation(() => {});

    render(
      <ErrorBoundary>
        <ProblemChild />
      </ErrorBoundary>
    );

    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    expect(screen.getByText("Test error")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Reload page" })).toBeInTheDocument();
  });
});
