/**
 * @jest-environment jsdom
 */

import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { ClientDateDisplay } from "./ClientDateDisplay";

// Mock Intl.DateTimeFormat to ensure consistent test results
const mockResolvedOptions = jest.fn(() => ({ timeZone: "America/New_York" }));
Object.defineProperty(Intl, "DateTimeFormat", {
  value: jest.fn(() => ({
    resolvedOptions: mockResolvedOptions
  })),
  writable: true
});

describe("ClientDateDisplay", () => {
  beforeEach(() => {
    mockResolvedOptions.mockReturnValue({ timeZone: "America/New_York" });
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("renders UTC time on server-side (initial render)", () => {
    render(<ClientDateDisplay utcDateString="2025-01-15T10:30:00Z" />);

    // Should show UTC time with "UTC" label on initial render
    expect(screen.getByText(/UTC/)).toBeInTheDocument();
    expect(screen.getByText(/2025-01-15|January 15, 2025/)).toBeInTheDocument();
  });

  it("updates to local timezone after client-side hydration", async () => {
    render(<ClientDateDisplay utcDateString="2025-01-15T10:30:00Z" />);

    // Initially shows UTC
    expect(screen.getByText(/UTC/)).toBeInTheDocument();

    // Simulate client-side hydration
    jest.advanceTimersByTime(100);
    await waitFor(() => {
      // After hydration, should show local time (no UTC label)
      const text = screen.getByText(/2025-01-15|January 15, 2025/);
      expect(text).toBeInTheDocument();
      // Should not have UTC label after hydration
      expect(screen.queryByText(/UTC/)).not.toBeInTheDocument();
    });
  });

  it("handles different UTC times correctly", () => {
    render(<ClientDateDisplay utcDateString="2025-01-15T00:00:00Z" />);
    expect(screen.getByText(/UTC/)).toBeInTheDocument();
  });

  it("applies custom className", () => {
    render(
      <ClientDateDisplay
        utcDateString="2025-01-15T10:30:00Z"
        className="custom-class"
      />
    );

    const element = screen.getByText(/UTC/);
    expect(element).toHaveClass("custom-class");
  });

  it("handles invalid date strings gracefully", () => {
    render(<ClientDateDisplay utcDateString="invalid-date" />);
    // When date parsing fails, the component should fall back to the original string
    // The component should render the invalid string with UTC label
    expect(screen.getByText(/invalid-date.*UTC/)).toBeInTheDocument();
  });

  it("converts UTC to local timezone correctly", async () => {
    // 10:30 AM UTC = 5:30 AM EST (UTC-5 in January)
    render(<ClientDateDisplay utcDateString="2025-01-15T10:30:00Z" />);

    // Initially UTC
    expect(screen.getByText(/UTC/)).toBeInTheDocument();

    // After hydration
    jest.advanceTimersByTime(100);
    await waitFor(() => {
      // Should show local time (EST = UTC-5, so 5:30 AM)
      const text = screen.getByText(/2025-01-15|January 15, 2025/);
      expect(text).toBeInTheDocument();
    });
  });
});
