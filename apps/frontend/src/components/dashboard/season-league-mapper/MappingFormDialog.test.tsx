import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MappingFormDialog } from "./MappingFormDialog";
import {
  useCreateSeasonLeagueExternalId,
  useUpdateSeasonLeagueExternalId
} from "@/hooks/data/dashboard/useSeasonLeagueMapper";

// Mock the hooks
jest.mock("@/hooks/data/dashboard/useSeasonLeagueMapper");
const mockUseCreate = useCreateSeasonLeagueExternalId as jest.MockedFunction<
  typeof useCreateSeasonLeagueExternalId
>;
const mockUseUpdate = useUpdateSeasonLeagueExternalId as jest.MockedFunction<
  typeof useUpdateSeasonLeagueExternalId
>;

describe("MappingFormDialog", () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    seasonId: 1,
    leagueId: 2,
    leagueName: "Test League"
  };

  const mockEditingMapping = {
    id: 1,
    season_id: 1,
    league_id: 2,
    external_id: "faceit-123",
    external_league_name: "FaceIT Championship",
    stage_id: 1 as const,
    type: "roundRobin" as const,
    manual_group: undefined
  };

  const mockMutateAsync = jest.fn().mockResolvedValue({});

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseCreate.mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: false,
      error: null
    } as any);
    mockUseUpdate.mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: false,
      error: null
    } as any);
  });

  it("should populate form fields when editingMapping is provided", () => {
    render(
      <MappingFormDialog
        {...defaultProps}
        editingMapping={mockEditingMapping}
      />
    );

    const externalIdInput = screen.getByLabelText(
      /external id/i
    ) as HTMLInputElement;
    const externalLeagueNameInput = screen.getByLabelText(
      /external league name/i
    ) as HTMLInputElement;

    expect(externalIdInput.value).toBe("faceit-123");
    expect(externalLeagueNameInput.value).toBe("FaceIT Championship");
  });

  it("should reset form fields when editingMapping is null", () => {
    const { rerender } = render(
      <MappingFormDialog
        {...defaultProps}
        editingMapping={mockEditingMapping}
      />
    );

    // Initially has values
    let externalIdInput = screen.getByLabelText(
      /external id/i
    ) as HTMLInputElement;
    expect(externalIdInput.value).toBe("faceit-123");

    // Remove editingMapping
    rerender(
      <MappingFormDialog {...defaultProps} editingMapping={undefined} />
    );

    // Should be reset
    externalIdInput = screen.getByLabelText(/external id/i) as HTMLInputElement;
    expect(externalIdInput.value).toBe("");
  });

  it("should update form fields when editingMapping changes", () => {
    const { rerender } = render(
      <MappingFormDialog
        {...defaultProps}
        editingMapping={mockEditingMapping}
      />
    );

    let externalIdInput = screen.getByLabelText(
      /external id/i
    ) as HTMLInputElement;
    expect(externalIdInput.value).toBe("faceit-123");

    // Change editingMapping
    const newEditingMapping = {
      ...mockEditingMapping,
      external_id: "faceit-456",
      external_league_name: "New Championship"
    };

    rerender(
      <MappingFormDialog {...defaultProps} editingMapping={newEditingMapping} />
    );

    externalIdInput = screen.getByLabelText(/external id/i) as HTMLInputElement;
    const externalLeagueNameInput = screen.getByLabelText(
      /external league name/i
    ) as HTMLInputElement;

    expect(externalIdInput.value).toBe("faceit-456");
    expect(externalLeagueNameInput.value).toBe("New Championship");
  });

  it("should reset form when dialog closes and reopens", () => {
    const { rerender } = render(
      <MappingFormDialog
        {...defaultProps}
        editingMapping={mockEditingMapping}
        isOpen={true}
      />
    );

    let externalIdInput = screen.getByLabelText(
      /external id/i
    ) as HTMLInputElement;
    expect(externalIdInput.value).toBe("faceit-123");

    // Close dialog
    rerender(
      <MappingFormDialog
        {...defaultProps}
        editingMapping={mockEditingMapping}
        isOpen={false}
      />
    );

    // Reopen without editingMapping
    rerender(
      <MappingFormDialog
        {...defaultProps}
        editingMapping={undefined}
        isOpen={true}
      />
    );

    externalIdInput = screen.getByLabelText(/external id/i) as HTMLInputElement;
    expect(externalIdInput.value).toBe("");
  });

  it("should handle form submission for create mode", async () => {
    const user = userEvent.setup();
    render(<MappingFormDialog {...defaultProps} editingMapping={undefined} />);

    const externalIdInput = screen.getByLabelText(/external id/i);
    const externalLeagueNameInput =
      screen.getByLabelText(/external league name/i);
    const submitButton = screen.getByRole("button", { name: /create/i });

    await user.type(externalIdInput, "faceit-789");
    await user.type(externalLeagueNameInput, "New League");

    await user.click(submitButton);

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith({
        season_id: 1,
        league_id: 2,
        external_id: "faceit-789",
        external_league_name: "New League",
        stage_id: 1,
        type: "roundRobin",
        manual_group: null
      });
    });
  });

  it("should handle form submission for update mode", async () => {
    const user = userEvent.setup();
    render(
      <MappingFormDialog
        {...defaultProps}
        editingMapping={mockEditingMapping}
      />
    );

    const externalIdInput = screen.getByLabelText(/external id/i);
    const submitButton = screen.getByRole("button", { name: /update/i });

    await user.clear(externalIdInput);
    await user.type(externalIdInput, "faceit-updated");

    await user.click(submitButton);

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith({
        id: 1,
        data: expect.objectContaining({
          external_id: "faceit-updated"
        })
      });
    });
  });
});
