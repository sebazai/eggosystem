import { render, screen, fireEvent } from "@testing-library/react";
import { ExpandableRow } from "./ExpandableRow";

describe("ExpandableRow", () => {
  it("renders expand button when not expanded", () => {
    const mockOnToggle = jest.fn();
    render(
      <ExpandableRow
        isExpanded={false}
        onToggle={mockOnToggle}
        canExpand={true}
      />
    );

    const button = screen.getByRole("button");
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute("aria-label", "Expand");
  });

  it("renders collapse button when expanded", () => {
    const mockOnToggle = jest.fn();
    render(
      <ExpandableRow
        isExpanded={true}
        onToggle={mockOnToggle}
        canExpand={true}
      />
    );

    const button = screen.getByRole("button");
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute("aria-label", "Collapse");
  });

  it("calls onToggle when clicked", () => {
    const mockOnToggle = jest.fn();
    render(
      <ExpandableRow
        isExpanded={false}
        onToggle={mockOnToggle}
        canExpand={true}
      />
    );

    const button = screen.getByRole("button");
    fireEvent.click(button);

    expect(mockOnToggle).toHaveBeenCalledTimes(1);
  });

  it("does not render when canExpand is false", () => {
    const mockOnToggle = jest.fn();
    render(
      <ExpandableRow
        isExpanded={false}
        onToggle={mockOnToggle}
        canExpand={false}
      />
    );

    const button = screen.queryByRole("button");
    expect(button).not.toBeInTheDocument();
  });

  it("shows chevron right icon when not expanded", () => {
    const mockOnToggle = jest.fn();
    render(
      <ExpandableRow
        isExpanded={false}
        onToggle={mockOnToggle}
        canExpand={true}
      />
    );

    const button = screen.getByRole("button");
    const chevronRight = button.querySelector(".lucide-chevron-right");
    const chevronDown = button.querySelector(".lucide-chevron-down");

    expect(chevronRight).toBeInTheDocument();
    expect(chevronDown).not.toBeInTheDocument();
  });

  it("shows chevron down icon when expanded", () => {
    const mockOnToggle = jest.fn();
    render(
      <ExpandableRow
        isExpanded={true}
        onToggle={mockOnToggle}
        canExpand={true}
      />
    );

    const button = screen.getByRole("button");
    const chevronRight = button.querySelector(".lucide-chevron-right");
    const chevronDown = button.querySelector(".lucide-chevron-down");

    expect(chevronDown).toBeInTheDocument();
    expect(chevronRight).not.toBeInTheDocument();
  });

  it("has proper styling classes", () => {
    const mockOnToggle = jest.fn();
    render(
      <ExpandableRow
        isExpanded={false}
        onToggle={mockOnToggle}
        canExpand={true}
      />
    );

    const button = screen.getByRole("button");
    expect(button).toHaveClass(
      "flex",
      "items-center",
      "justify-center",
      "w-6",
      "h-6"
    );
  });
});
