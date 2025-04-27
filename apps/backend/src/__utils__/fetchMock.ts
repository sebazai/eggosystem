type FetchMockConfig = {
  urlContains: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  response: any;
}[];

let activeFetchMockConfigs: FetchMockConfig = [];

export const setupSmartFetchMockWithDynamicConfigs = () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    (global.fetch as jest.Mock) = jest.fn((url: string) => {
      const match = activeFetchMockConfigs.find((c) =>
        url.includes(c.urlContains)
      );
      if (match) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(match.response)
        });
      }
      throw new Error(`Unexpected fetch call to URL: ${url}`);
    });
  });

  afterEach(() => {
    activeFetchMockConfigs = []; // Clear active configs after each test
    if (originalFetch) {
      global.fetch = originalFetch;
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (global as any).fetch;
    }
    jest.resetAllMocks();
  });
};

export const updateFetchMock = (configs: FetchMockConfig) => {
  activeFetchMockConfigs = configs;
};
