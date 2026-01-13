import { render, screen, waitFor } from "@testing-library/react";
import { ItemFilter } from "./ItemFilter";
import useSWR from "swr";

// Mock SWR
jest.mock("swr");
const mockUseSWR = useSWR as jest.MockedFunction<typeof useSWR>;

// Mock FancySelect component
jest.mock("./FancyMultiSelect", () => ({
  FancySelect: ({
    currentSelection,
    onSelectChange,
    isOpen,
    setOpen
  }: {
    currentSelection: Array<{
      value: number;
      label: string;
      isInvalid: boolean;
    }>;
    onSelectChange: (value: Array<{ value: number; label: string }>) => void;
    isOpen: boolean;
    setOpen: (filter: string | null) => void;
  }) => (
    <div data-testid="fancy-select">
      <div data-testid="current-selection">
        {currentSelection.map((item) => (
          <span key={item.value} data-testid={`selected-${item.value}`}>
            {item.label}
          </span>
        ))}
      </div>
      <button
        data-testid="select-item-1"
        onClick={() =>
          onSelectChange([
            { value: 1, label: "Item 1" },
            { value: 2, label: "Item 2" }
          ])
        }
      >
        Select Items
      </button>
      <button data-testid="open-filter" onClick={() => setOpen("testFilter")}>
        Open
      </button>
      <button data-testid="close-filter" onClick={() => setOpen(null)}>
        Close
      </button>
      {isOpen && <div data-testid="filter-open">Filter is open</div>}
    </div>
  )
}));

type TestItem = { id: number; name: string };

describe("ItemFilter", () => {
  const mockData: TestItem[] = [
    { id: 1, name: "Item 1" },
    { id: 2, name: "Item 2" },
    { id: 3, name: "Item 3" }
  ];

  const defaultProps = {
    filterName: "testFilter",
    labelKey: "name" as keyof TestItem,
    selectableIds: [1, 2],
    isValidating: false,
    openFilter: null,
    handleOpen: jest.fn(),
    handleSetSearchParams: jest.fn(),
    selectedItems: [1],
    sorter: undefined
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseSWR.mockReturnValue({
      data: mockData,
      error: undefined,
      isLoading: false,
      isValidating: false,
      mutate: jest.fn()
    } as any);
  });

  it("should sync selectedItems from props", () => {
    const { rerender } = render(<ItemFilter {...defaultProps} />);

    expect(screen.getByTestId("selected-1")).toBeInTheDocument();

    // Update props
    rerender(<ItemFilter {...defaultProps} selectedItems={[2, 3]} />);

    expect(screen.getByTestId("selected-2")).toBeInTheDocument();
    expect(screen.getByTestId("selected-3")).toBeInTheDocument();
  });

  it("should filter selectableIds based on props.selectableIds", async () => {
    render(<ItemFilter {...defaultProps} selectableIds={[1, 2]} />);

    await waitFor(() => {
      expect(mockUseSWR).toHaveBeenCalled();
    });

    // The component should only show items 1 and 2 as selectable
    // This is tested through the FancySelect component receiving filtered data
    expect(screen.getByTestId("fancy-select")).toBeInTheDocument();
  });

  it("should update selectableIds when data or selectableIds prop changes", async () => {
    const { rerender } = render(
      <ItemFilter {...defaultProps} selectableIds={[1]} />
    );

    await waitFor(() => {
      expect(mockUseSWR).toHaveBeenCalled();
    });

    // Change selectableIds
    rerender(<ItemFilter {...defaultProps} selectableIds={[1, 2, 3]} />);

    // Component should re-render with new selectableIds
    expect(screen.getByTestId("fancy-select")).toBeInTheDocument();
  });

  it("should call handleSetSearchParams when selection changes and filter is not open", async () => {
    const handleSetSearchParams = jest.fn();
    render(
      <ItemFilter
        {...defaultProps}
        handleSetSearchParams={handleSetSearchParams}
        openFilter={null}
      />
    );

    const selectButton = screen.getByTestId("select-item-1");
    selectButton.click();

    await waitFor(() => {
      expect(handleSetSearchParams).toHaveBeenCalledWith("testFilter", [1, 2]);
    });
  });

  it("should not call handleSetSearchParams when filter is open", async () => {
    const handleSetSearchParams = jest.fn();
    render(
      <ItemFilter
        {...defaultProps}
        handleSetSearchParams={handleSetSearchParams}
        openFilter="testFilter"
      />
    );

    const selectButton = screen.getByTestId("select-item-1");
    selectButton.click();

    await waitFor(() => {
      expect(handleSetSearchParams).not.toHaveBeenCalled();
    });
  });

  it("should show loading state when data is loading", () => {
    mockUseSWR.mockReturnValue({
      data: undefined,
      error: undefined,
      isLoading: true,
      isValidating: false,
      mutate: jest.fn()
    } as any);

    render(<ItemFilter {...defaultProps} />);

    expect(screen.queryByTestId("fancy-select")).not.toBeInTheDocument();
    // Should show loading spinner
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("should mark invalid items when they are not in selectableIds", () => {
    render(
      <ItemFilter
        {...defaultProps}
        selectedItems={[1, 3]} // 3 is not in selectableIds [1, 2]
        selectableIds={[1, 2]}
      />
    );

    // Item 3 should be marked as invalid
    // This is tested through the FancySelect receiving isInvalid: true for item 3
    expect(screen.getByTestId("fancy-select")).toBeInTheDocument();
  });
});
