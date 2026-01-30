import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CasterApplicationsTable } from "./CasterApplicationsTable";
import type { CasterApplicationResponse } from "@eggosystem/types";

const mockApplications: CasterApplicationResponse[] = [
  {
    id: 1,
    organizer_id: 1,
    account_id: 10,
    organizer_name: "Kanaliiga",
    discord_username: "user#123",
    steam_id: "76561198000000000",
    nickname: "Player",
    caster_url: "https://twitch.tv/foo",
    approved_terms_and_conditions: true,
    approved_by: null,
    approved_at: null,
    rejected_by: null,
    rejected_at: null,
    rejection_reason: null,
    created_at: "2024-01-15T12:00:00.000Z",
    updated_at: "2024-01-15T12:00:00.000Z"
  },
  {
    id: 2,
    organizer_id: 1,
    account_id: 11,
    organizer_name: "Kanaliiga",
    discord_username: "other#456",
    steam_id: "76561198000000001",
    nickname: "Other",
    caster_url: "https://twitch.tv/bar",
    approved_terms_and_conditions: true,
    approved_by: 1,
    approved_at: "2024-01-16T00:00:00.000Z",
    rejected_by: null,
    rejected_at: null,
    rejection_reason: null,
    created_at: "2024-01-14T12:00:00.000Z",
    updated_at: "2024-01-16T00:00:00.000Z"
  }
];

describe("CasterApplicationsTable", () => {
  const mockOnApprove = jest.fn().mockResolvedValue(undefined);
  const mockOnReject = jest.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render applications with organizer, account, status and actions", () => {
    render(
      <CasterApplicationsTable
        applications={mockApplications}
        onApprove={mockOnApprove}
        onReject={mockOnReject}
        isApproving={false}
        isRejecting={false}
      />
    );

    expect(screen.getAllByText("Kanaliiga").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("10")).toBeInTheDocument();
    expect(screen.getByText("Player")).toBeInTheDocument();
    expect(screen.getByText("user#123")).toBeInTheDocument();
    expect(screen.getByText("Pending")).toBeInTheDocument();
    expect(screen.getByText("Approved")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /approve/i })
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /reject/i })).toBeInTheDocument();
  });

  it("should show approve confirmation and call onApprove when confirmed", async () => {
    const user = userEvent.setup();
    render(
      <CasterApplicationsTable
        applications={mockApplications}
        onApprove={mockOnApprove}
        onReject={mockOnReject}
        isApproving={false}
        isRejecting={false}
      />
    );

    const approveButtons = screen.getAllByRole("button", { name: /approve/i });
    expect(approveButtons[0]).toBeDefined();
    await user.click(approveButtons[0]!);

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: /approve caster application/i })
      ).toBeInTheDocument();
    });

    const approveInDialog = screen.getAllByRole("button", {
      name: /^approve$/i
    });
    const confirmButton = approveInDialog[approveInDialog.length - 1];
    expect(confirmButton).toBeDefined();
    await user.click(confirmButton!);

    await waitFor(() => {
      expect(mockOnApprove).toHaveBeenCalledWith(1);
    });
  });

  it("should show reject dialog and require reason", async () => {
    const user = userEvent.setup();
    render(
      <CasterApplicationsTable
        applications={mockApplications}
        onApprove={mockOnApprove}
        onReject={mockOnReject}
        isApproving={false}
        isRejecting={false}
      />
    );

    const rejectButtons = screen.getAllByRole("button", { name: /reject/i });
    expect(rejectButtons[0]).toBeDefined();
    await user.click(rejectButtons[0]!);

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: /reject caster application/i })
      ).toBeInTheDocument();
    });

    const rejectReasonInput = screen.getByLabelText(/rejection reason/i);
    expect(rejectReasonInput).toBeInTheDocument();

    const rejectSubmitButton = screen.getByRole("button", {
      name: /^reject$/i
    }) as HTMLElement;
    expect(rejectSubmitButton).toBeDisabled();

    await user.type(rejectReasonInput, "Incomplete information");
    await waitFor(() => {
      expect(rejectSubmitButton).not.toBeDisabled();
    });
    expect(rejectSubmitButton).toBeDefined();
    await user.click(rejectSubmitButton!);

    await waitFor(() => {
      expect(mockOnReject).toHaveBeenCalledWith(1, "Incomplete information");
    });
  });

  it("should not show actions for approved row", () => {
    const onlyApproved: CasterApplicationResponse[] = [
      mockApplications[1] as CasterApplicationResponse
    ];
    render(
      <CasterApplicationsTable
        applications={onlyApproved}
        onApprove={mockOnApprove}
        onReject={mockOnReject}
        isApproving={false}
        isRejecting={false}
      />
    );

    expect(screen.getByText("Approved")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /approve/i })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /reject/i })
    ).not.toBeInTheDocument();
  });
});
