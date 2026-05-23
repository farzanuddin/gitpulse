import { describe, it, expect } from "vitest";
import { formatDate } from "../lib/formatDate";

describe("formatDate", () => {
  it("formats date as DD MMM YYYY", () => {
    expect(formatDate("2024-01-15T00:00:00Z", "DD MMM YYYY")).toBe("15 Jan 2024");
  });

  it("formats date as MMMM YYYY", () => {
    expect(formatDate("2024-01-15T00:00:00Z", "MMMM YYYY")).toBe("January 2024");
  });

  it("pads single-digit day", () => {
    expect(formatDate("2024-03-05T00:00:00Z", "DD MMM YYYY")).toBe("05 Mar 2024");
  });

  it("returns raw string for unknown format", () => {
    expect(formatDate("2024-01-15", "unknown")).toBe("2024-01-15");
  });

  it("handles December date", () => {
    expect(formatDate("2023-12-25T00:00:00Z", "DD MMM YYYY")).toBe("25 Dec 2023");
    expect(formatDate("2023-12-25T00:00:00Z", "MMMM YYYY")).toBe("December 2023");
  });
});
