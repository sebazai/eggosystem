import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { SWRConfig } from "swr";
import AddPlayerPage from "@/app/(admin)/dashboard/players/add/page";
import * as apiClient from "@/lib/apiClient";

// Mock the apiClient module
jest.mock("@/lib/apiClient", () => ({
  clientApiFetch: jest.fn()
}));

// Mock the role protection component
jest.mock("@/components/dashboard/WithRoleProtection", () => ({
  WithRoleProtection: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="role-protection">{children}</div>
  )
}));

describe("AddPlayer Page", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockActiveSeason = { season_id: 14 };
  const mockTeams = [
    { team_id: 1650, team_name: "Test Team", league_name: "Test League" },
    { team_id: 1651, team_name: "Another Team", league_name: "Test League" }
  ];

  test("renders the page with form elements", async () => {
    // Mock the API responses for SWR
    (apiClient.clientApiFetch as jest.Mock).mockImplementation(
      (url: string) => {
        if (url.includes("seasons/active")) {
          return Promise.resolve(mockActiveSeason);
        }
        if (url.includes("teams")) {
          return Promise.resolve(mockTeams);
        }
      }
    );

    render(
      <SWRConfig value={{ provider: () => new Map() }}>
        <AddPlayerPage />
      </SWRConfig>
    );

    // Check that page title is rendered
    expect(screen.getByText("Add Player")).toBeInTheDocument();

    // Check that the role protection component is used
    expect(screen.getByTestId("role-protection")).toBeInTheDocument();

    // Wait for teams to load
    await waitFor(() => {
      expect(screen.getByText("Select a team")).toBeInTheDocument();
    });

    // Check that the form elements are rendered
    expect(screen.getByText("Team")).toBeInTheDocument();
    expect(screen.getByText("Steam ID")).toBeInTheDocument();
    expect(screen.getByText("Check Eligibility")).toBeInTheDocument();
  });

  test("displays error when form is incomplete", async () => {
    // Mock the API responses for SWR
    (apiClient.clientApiFetch as jest.Mock).mockImplementation(
      (url: string) => {
        if (url.includes("seasons/active")) {
          return Promise.resolve(mockActiveSeason);
        }
        if (url.includes("teams")) {
          return Promise.resolve(mockTeams);
        }
      }
    );

    render(
      <SWRConfig value={{ provider: () => new Map() }}>
        <AddPlayerPage />
      </SWRConfig>
    );

    // Wait for the component to load
    await waitFor(() => {
      expect(screen.getByText("Check Eligibility")).toBeInTheDocument();
    });

    // The Check Eligibility button should be disabled
    expect(
      screen.getByText("Check Eligibility").closest("button")
    ).toBeDisabled();

    // Enter a Steam ID but don't select a team
    fireEvent.change(screen.getByPlaceholderText("Enter Steam ID"), {
      target: { value: "76561198054765387" }
    });

    // The button should still be disabled
    expect(
      screen.getByText("Check Eligibility").closest("button")
    ).toBeDisabled();
  });
});
