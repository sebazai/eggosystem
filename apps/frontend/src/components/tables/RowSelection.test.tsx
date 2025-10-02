import { render, screen, fireEvent } from "@testing-library/react";
import { RowSelection } from "./RowSelection";

describe("RowSelection", () => {
  it("renders unchecked checkbox by default", () => {
    const mockOnToggle = jest.fn();
    render(<RowSelection isSelected={false} onToggle={mockOnToggle} />);

    const checkbox = screen.getByRole("checkbox");
    expect(checkbox).not.toBeChecked();
  });

  it("renders checked checkbox when selected", () => {
    const mockOnToggle = jest.fn();
    render(<RowSelection isSelected={true} onToggle={mockOnToggle} />);

    const checkbox = screen.getByRole("checkbox");
    expect(checkbox).toBeChecked();
  });

  it("calls onToggle when clicked", () => {
    const mockOnToggle = jest.fn();
    render(<RowSelection isSelected={false} onToggle={mockOnToggle} />);

    const checkbox = screen.getByRole("checkbox");
    fireEvent.click(checkbox);

    expect(mockOnToggle).toHaveBeenCalledTimes(1);
  });

  it("applies indeterminate state when specified", () => {
    const mockOnToggle = jest.fn();
    render(
      <RowSelection
        isSelected={false}
        onToggle={mockOnToggle}
        isIndeterminate={true}
      />
    );

    const checkbox = screen.getByRole("checkbox");
    expect(checkbox).toHaveProperty("indeterminate", true);
  });

  it("applies custom className", () => {
    const mockOnToggle = jest.fn();
    render(
      <RowSelection
        isSelected={false}
        onToggle={mockOnToggle}
        className="custom-class"
      />
    );

    const checkbox = screen.getByRole("checkbox");
    expect(checkbox).toHaveClass("custom-class");
  });

  it("handles event parameter in onToggle", () => {
    const mockOnToggle = jest.fn();
    render(<RowSelection isSelected={false} onToggle={mockOnToggle} />);

    const checkbox = screen.getByRole("checkbox");
    fireEvent.click(checkbox);

    expect(mockOnToggle).toHaveBeenCalledWith(expect.any(Object));
  });
});
