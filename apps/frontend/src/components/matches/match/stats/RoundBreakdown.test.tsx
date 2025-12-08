import { render } from "@testing-library/react";
import { RoundBreakdown } from "./RoundBreakdown";

// Mock Next.js Image component
jest.mock("next/image", () => ({
  __esModule: true,
  default: ({
    src,
    alt,
    ...props
  }: {
    src: string;
    alt: string;
    width: number;
    height: number;
    className?: string;
  }) => <img src={src} alt={alt} {...props} />
}));

// Mock createNextUrl utility
jest.mock("@/lib/utils", () => ({
  cn: (...classes: (string | undefined)[]) => classes.filter(Boolean).join(" "),
  createNextUrl: (path: string) => path
}));

describe("RoundBreakdown", () => {
  describe("Snapshot Tests", () => {
    it("renders correctly when starting as Terrorist side", () => {
      const { container } = render(
        <RoundBreakdown
          startingSide="T"
          roundWonFirstHalf={8}
          roundsWonSecondHalf={5}
          overtimeRoundsWon={0}
        />
      );
      expect(container).toMatchSnapshot();
    });

    it("renders correctly when starting as Counter-Terrorist side", () => {
      const { container } = render(
        <RoundBreakdown
          startingSide="CT"
          roundWonFirstHalf={7}
          roundsWonSecondHalf={6}
          overtimeRoundsWon={0}
        />
      );
      expect(container).toMatchSnapshot();
    });

    it("renders correctly with overtime rounds", () => {
      const { container } = render(
        <RoundBreakdown
          startingSide="T"
          roundWonFirstHalf={6}
          roundsWonSecondHalf={6}
          overtimeRoundsWon={4}
        />
      );
      expect(container).toMatchSnapshot();
    });

    it("renders correctly with zero overtime (overtime not displayed)", () => {
      const { container } = render(
        <RoundBreakdown
          startingSide="CT"
          roundWonFirstHalf={9}
          roundsWonSecondHalf={4}
          overtimeRoundsWon={0}
        />
      );
      expect(container).toMatchSnapshot();
    });
  });
});
