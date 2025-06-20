import { endDbConnection } from "./src/db/mysqlConnection";
import { closeRedis } from "./src/utils/redisClient";
import { mswServer } from "@eggosystem/shared-msw";
import { cleanupLogger } from "./src/utils/app-logger";
import { http, HttpResponse } from "@eggosystem/shared-msw";

jest.mock("fs", () => {
  const actualFs = jest.requireActual("fs"); // keep everything elsex

  return {
    ...actualFs,
    readFileSync: jest.fn((filePath: string) => {
      if (filePath.includes("public_access_token.pem")) {
        return "mock-public-key";
      } else if (filePath.includes("private_access_token.pem")) {
        return "mock-private-key";
      } else if (filePath.includes("public_refresh_token.pem")) {
        return "mock-refresh-public-key";
      } else if (filePath.includes("private_refresh_token.pem")) {
        return "mock-refresh-private-key";
      }
      // fallback to actual read if needed
      return actualFs.readFileSync(filePath, "utf8");
    })
  };
});

beforeAll(() => {
  // Enable API mocking before all the tests.
  mswServer.listen({
    onUnhandledRequest: (request, print) => {
      if (
        request.url.includes("127.0.0.1") ||
        request.url.includes("localhost:4318")
      ) {
        return;
      }
      print.warning();
    }
  });

  // Add handler for OpenTelemetry logs endpoint to prevent warnings
  mswServer.use(
    http.post("http://localhost:4318/v1/logs", () => {
      return HttpResponse.json({}, { status: 200 });
    })
  );
});

beforeEach(() => {
  jest.restoreAllMocks();
  jest.clearAllMocks();
});

afterEach(() => {
  mswServer.resetHandlers();
});

afterAll(async () => {
  await endDbConnection();
  await closeRedis();
  await cleanupLogger();
  mswServer.close();
});
