import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Header } from "../components/Header";

describe("Header", () => {
  it("returns null when no status is shown", () => {
    const { container } = render(
      <Header status={{ showCache: false, showWarning: false, warningText: "" }} />
    );
    expect(container.innerHTML).toBe("");
  });

  it("renders cache badge when showCache is true", () => {
    render(<Header status={{ showCache: true, showWarning: false, warningText: "" }} />);
    expect(screen.getByText("Loaded from cache")).toBeInTheDocument();
  });

  it("renders warning badge with text when showWarning is true", () => {
    render(
      <Header status={{ showCache: false, showWarning: true, warningText: "Rate limit reached" }} />
    );
    expect(screen.getByText("Rate limit reached")).toBeInTheDocument();
  });

  it("renders both badges when both are shown", () => {
    render(
      <Header status={{ showCache: true, showWarning: true, warningText: "Error occurred" }} />
    );
    expect(screen.getByText("Loaded from cache")).toBeInTheDocument();
    expect(screen.getByText("Error occurred")).toBeInTheDocument();
  });
});
