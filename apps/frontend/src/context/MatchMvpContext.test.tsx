import { act, render, screen, waitFor } from "@testing-library/react";
import { MatchMvpProvider, useMatchMvpContext } from "./MatchMvpContext";
import { expressFetcher } from "@/lib/utils";
import type { MatchMvp } from "@eggosystem/types";

jest.mock("@/lib/utils", () => ({
  expressFetcher: jest.fn()
}));

const mockExpressFetcher = expressFetcher as jest.MockedFunction<
  typeof expressFetcher
>;

function TestRegister({ matchId }: { matchId: number }) {
  const { registerVisible, getMvp } = useMatchMvpContext();
  const mvp = getMvp(matchId);

  return (
    <div>
      <button type="button" onClick={() => registerVisible(matchId)}>
        register
      </button>
      <span data-testid="mvp">
        {mvp === undefined ? "loading" : mvp === null ? "none" : mvp.nickname}
      </span>
    </div>
  );
}

describe("MatchMvpContext", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    mockExpressFetcher.mockReset();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("dedupes registerVisible and fetches uncached IDs once", async () => {
    mockExpressFetcher.mockResolvedValue({
      mvps: [
        {
          match_id: 1,
          steam_id: "76561198024059644",
          nickname: "Shwifty",
          avatar: null,
          team_id: 2035,
          kana_rating: 1.02
        } satisfies MatchMvp
      ]
    });

    render(
      <MatchMvpProvider>
        <TestRegister matchId={1} />
      </MatchMvpProvider>
    );

    screen.getByRole("button").click();
    screen.getByRole("button").click();

    await act(async () => {
      jest.advanceTimersByTime(150);
    });

    await waitFor(() => {
      expect(mockExpressFetcher).toHaveBeenCalledTimes(1);
    });

    expect(mockExpressFetcher).toHaveBeenCalledWith(
      "/api/v1/matches/mvps?match_ids=1"
    );
    expect(screen.getByTestId("mvp")).toHaveTextContent("Shwifty");
  });

  it("does not re-fetch cached match_ids", async () => {
    const initialCache = new Map<number, MatchMvp | null>([
      [
        1,
        {
          match_id: 1,
          steam_id: "76561198024059644",
          nickname: "Cached",
          avatar: null,
          team_id: 2035,
          kana_rating: 0.9
        }
      ]
    ]);

    render(
      <MatchMvpProvider initialCache={initialCache}>
        <TestRegister matchId={1} />
      </MatchMvpProvider>
    );

    screen.getByRole("button").click();

    await act(async () => {
      jest.advanceTimersByTime(150);
    });

    expect(mockExpressFetcher).not.toHaveBeenCalled();
    expect(screen.getByTestId("mvp")).toHaveTextContent("Cached");
  });

  it("caches null when the API omits a requested match_id", async () => {
    mockExpressFetcher.mockResolvedValue({ mvps: [] });

    render(
      <MatchMvpProvider>
        <TestRegister matchId={99} />
      </MatchMvpProvider>
    );

    screen.getByRole("button").click();

    await act(async () => {
      jest.advanceTimersByTime(150);
    });

    await waitFor(() => {
      expect(screen.getByTestId("mvp")).toHaveTextContent("none");
    });
  });
});
