import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SearchBar } from "./SearchBar";
import { useSearchParams, useRouter, usePathname } from "next/navigation";

// Mock Next.js navigation hooks
const mockReplace = jest.fn();
const mockRefresh = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
  usePathname: jest.fn(),
  useSearchParams: jest.fn()
}));

// Mock useIsMobile hook
jest.mock("@/hooks/use-mobile", () => ({
  useIsMobile: () => ({ isMobile: false })
}));

const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;
const mockUsePathname = usePathname as jest.MockedFunction<typeof usePathname>;
const mockUseSearchParams = useSearchParams as jest.MockedFunction<
  typeof useSearchParams
>;

describe("SearchBar", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    mockUseRouter.mockReturnValue({
      push: jest.fn(),
      replace: mockReplace,
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: mockRefresh,
      pathname: "/",
      query: {},
      asPath: "/"
    } as any);

    mockUsePathname.mockReturnValue("/test");
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it("should sync search value from URL params on mount", () => {
    const searchParams = new URLSearchParams("q=test+query");
    mockUseSearchParams.mockReturnValue(searchParams as any);

    render(<SearchBar placeholder="Search..." />);

    const input = screen.getByPlaceholderText("Search...") as HTMLInputElement;
    expect(input.value).toBe("test query");
  });

  it("should update URL params when user types (with debounce)", async () => {
    const user = userEvent.setup({ delay: null });
    let searchParams = new URLSearchParams();
    mockUseSearchParams.mockReturnValue(searchParams as any);

    render(<SearchBar placeholder="Search..." />);

    const input = screen.getByPlaceholderText("Search...") as HTMLInputElement;

    // Simulate typing by directly setting the value and triggering change
    // This avoids the debounce timing issues with user.type()
    fireEvent.change(input, { target: { value: "new search" } });

    // Fast-forward debounce timer - wait for the final debounce
    jest.advanceTimersByTime(1000);

    await waitFor(() => {
      // Should be called with the final complete value
      expect(mockReplace).toHaveBeenCalled();
      const lastCall =
        mockReplace.mock.calls[mockReplace.mock.calls.length - 1];
      expect(lastCall[0]).toContain("q=new+search");
      expect(mockRefresh).toHaveBeenCalled();
    });
  });

  it("should clear search value and URL params when clear button is clicked", async () => {
    const user = userEvent.setup({ delay: null });
    let searchParams = new URLSearchParams("q=existing");
    mockUseSearchParams.mockReturnValue(searchParams as any);

    const { rerender } = render(<SearchBar placeholder="Search..." />);

    // Wait for initial sync
    await waitFor(() => {
      const input = screen.getByPlaceholderText(
        "Search..."
      ) as HTMLInputElement;
      expect(input.value).toBe("existing");
    });

    const clearButton = screen.getByLabelText("Clear Search");
    await user.click(clearButton);

    // After clicking clear, updateSearchQuery("") is called immediately (no debounce)
    // This should update the URL via router.replace
    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith("/test?", { scroll: false });
    });

    // Simulate the URL params being updated (as router.replace would do)
    searchParams = new URLSearchParams();
    mockUseSearchParams.mockReturnValue(searchParams as any);
    // Re-render to trigger the effect that syncs from URL params
    rerender(<SearchBar placeholder="Search..." />);

    // Now the value should be empty after the effect syncs
    await waitFor(() => {
      const input = screen.getByPlaceholderText(
        "Search..."
      ) as HTMLInputElement;
      expect(input.value).toBe("");
    });
  });

  it("should sync search value when URL params change externally", () => {
    const searchParams1 = new URLSearchParams("q=initial");
    mockUseSearchParams.mockReturnValue(searchParams1 as any);

    const { rerender } = render(<SearchBar placeholder="Search..." />);

    const input1 = screen.getByPlaceholderText("Search...") as HTMLInputElement;
    expect(input1.value).toBe("initial");

    // Simulate URL param change
    const searchParams2 = new URLSearchParams("q=updated");
    mockUseSearchParams.mockReturnValue(searchParams2 as any);
    rerender(<SearchBar placeholder="Search..." />);

    const input2 = screen.getByPlaceholderText("Search...") as HTMLInputElement;
    expect(input2.value).toBe("updated");
  });

  it("should handle empty search params", () => {
    const searchParams = new URLSearchParams();
    mockUseSearchParams.mockReturnValue(searchParams as any);

    render(<SearchBar placeholder="Search..." />);

    const input = screen.getByPlaceholderText("Search...") as HTMLInputElement;
    expect(input.value).toBe("");
  });
});
