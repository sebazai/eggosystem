import express, {
  type Request,
  type Response,
  type NextFunction
} from "express";
import request from "supertest";
import { auditReadEntity, auditUpdateEntity } from "./audit-log.middleware";
import { runQuery } from "../db/mysqlRunQuery";
import { getConnection } from "../db/mysqlConnection";
import { createExpressTestApp } from "../test-utils/express-app-setup";
import { BadRequestError } from "../utils/errors";

describe("audit-log.middleware Integration Tests", () => {
  let connection: Awaited<ReturnType<typeof getConnection>>;

  const largeBodyTestTimeoutMs = 30_000;
  const auditInsertWaitTimeoutMs = 10_000;

  async function waitForLatestRow<T>(
    sqlQuery: string,
    timeoutMs: number
  ): Promise<T> {
    const startedAt = Date.now();

    while (Date.now() - startedAt < timeoutMs) {
      const rows = await runQuery<Array<T>>(sqlQuery, []);
      const row = rows[0];
      if (row) return row;

      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    throw new Error(`Timed out waiting for DB row (${timeoutMs}ms)`);
  }

  beforeAll(async () => {
    connection = await getConnection();
  });

  afterAll(async () => {
    if (connection) {
      connection.release();
    }
  });

  beforeEach(async () => {
    // Clean up audit logs before each test
    await runQuery(
      "DELETE FROM AuditLog WHERE entity_type IN ('TestEntity', 'Accounts', 'Unknown')",
      []
    );
  });

  afterEach(async () => {
    // Clean up audit logs after each test
    await runQuery(
      "DELETE FROM AuditLog WHERE entity_type IN ('TestEntity', 'Accounts', 'Unknown')",
      []
    );
  });

  describe("auditReadEntity", () => {
    it("should create audit log for successful GET request", async () => {
      const router = express.Router();
      router.get(
        "/test/:id",
        auditReadEntity("TestEntity"),
        (req: Request, res: Response) => {
          res.status(200).json({ id: req.params.id, data: "test" });
        }
      );

      const { app, cleanup } = createExpressTestApp(router, "/api/v1");

      try {
        const res = await request(app)
          .get("/api/v1/test/123")
          .set("User-Agent", "test-agent");

        expect(res.status).toBe(200);

        // Wait a bit for async audit log to complete
        await new Promise((resolve) => setTimeout(resolve, 100));

        const auditLogs = await runQuery<
          Array<{
            id: number;
            action_type: string;
            entity_type: string;
            entity_id: number | null;
            user_id: number | null;
            response_status: number;
            user_agent: string;
            metadata: string;
          }>
        >(
          "SELECT * FROM AuditLog WHERE entity_type = 'TestEntity' ORDER BY id DESC LIMIT 1",
          []
        );

        expect(auditLogs).toHaveLength(1);
        expect(auditLogs[0].action_type).toBe("Read TestEntity");
        expect(auditLogs[0].entity_type).toBe("TestEntity");
        expect(auditLogs[0].entity_id).toBe(123);
        expect(auditLogs[0].user_id).toBeNull();
        expect(auditLogs[0].response_status).toBe(200);
        expect(auditLogs[0].user_agent).toBe("test-agent");
        expect(JSON.parse(auditLogs[0].metadata)).toHaveProperty("durationMs");
      } finally {
        cleanup();
      }
    });

    it("should extract entity ID from params when available", async () => {
      const router = express.Router();
      router.get(
        "/test/:id",
        auditReadEntity("TestEntity", "id"),
        (req: Request, res: Response) => {
          res.status(200).json({ id: req.params.id });
        }
      );

      const { app, cleanup } = createExpressTestApp(router, "/api/v1");

      try {
        await request(app).get("/api/v1/test/456");

        await new Promise((resolve) => setTimeout(resolve, 100));

        const auditLogs = await runQuery<Array<{ entity_id: number | null }>>(
          "SELECT entity_id FROM AuditLog WHERE entity_type = 'TestEntity' ORDER BY id DESC LIMIT 1",
          []
        );

        expect(auditLogs[0].entity_id).toBe(456);
      } finally {
        cleanup();
      }
    });

    it("should use account_id from req.auth when entity ID not in params", async () => {
      const router = express.Router();
      router.get(
        "/test",
        (req: Request, _res: Response, next: NextFunction) => {
          req.auth = {
            account_id: 789,
            provider_id: "steam123",
            permissions: [],
            roles: [],
            nickname: "testuser",
            provider: "steam"
          };
          next();
        },
        auditReadEntity("TestEntity"),
        (req: Request, res: Response) => {
          res.status(200).json({ userId: req.auth?.account_id });
        }
      );

      const { app, cleanup } = createExpressTestApp(router, "/api/v1");

      try {
        await request(app).get("/api/v1/test");

        await new Promise((resolve) => setTimeout(resolve, 100));

        const auditLogs = await runQuery<
          Array<{ entity_id: number | null; user_id: number | null }>
        >(
          "SELECT entity_id, user_id FROM AuditLog WHERE entity_type = 'TestEntity' ORDER BY id DESC LIMIT 1",
          []
        );

        expect(auditLogs[0].entity_id).toBe(789);
        expect(auditLogs[0].user_id).toBe(789);
      } finally {
        cleanup();
      }
    });

    it("should capture request body in audit log", async () => {
      const router = express.Router();
      router.post(
        "/test/:id",
        auditReadEntity("TestEntity"),
        (req: Request, res: Response) => {
          res.status(200).json({ received: req.body });
        }
      );

      const { app, cleanup } = createExpressTestApp(router, "/api/v1");

      try {
        const requestBody = { name: "test", value: 42 };
        await request(app).post("/api/v1/test/123").send(requestBody);

        await new Promise((resolve) => setTimeout(resolve, 100));

        const auditLogs = await runQuery<
          Array<{ request_data: string | null }>
        >(
          "SELECT request_data FROM AuditLog WHERE entity_type = 'TestEntity' ORDER BY id DESC LIMIT 1",
          []
        );

        expect(auditLogs[0].request_data).toBeTruthy();
        expect(JSON.parse(auditLogs[0].request_data || "{}")).toEqual(
          requestBody
        );
      } finally {
        cleanup();
      }
    });

    it("should capture response body in audit log", async () => {
      const router = express.Router();
      router.get(
        "/test/:id",
        auditReadEntity("TestEntity"),
        (req: Request, res: Response) => {
          res.status(200).json({ id: req.params.id, data: "response data" });
        }
      );

      const { app, cleanup } = createExpressTestApp(router, "/api/v1");

      try {
        await request(app).get("/api/v1/test/123");

        await new Promise((resolve) => setTimeout(resolve, 100));

        const auditLogs = await runQuery<
          Array<{ response_data: string | null }>
        >(
          "SELECT response_data FROM AuditLog WHERE entity_type = 'TestEntity' ORDER BY id DESC LIMIT 1",
          []
        );

        expect(auditLogs[0].response_data).toBeTruthy();
        const responseData = JSON.parse(auditLogs[0].response_data || "{}");
        expect(responseData).toHaveProperty("id", "123");
        expect(responseData).toHaveProperty("data", "response data");
      } finally {
        cleanup();
      }
    });

    it("should NOT create audit log for 4xx errors", async () => {
      const router = express.Router();
      router.get(
        "/test/:id",
        auditReadEntity("TestEntity"),
        (_req: Request, _res: Response, next: NextFunction) => {
          next(new BadRequestError("Invalid request"));
        }
      );

      const { app, cleanup } = createExpressTestApp(router, "/api/v1");

      try {
        await request(app).get("/api/v1/test/123");

        await new Promise((resolve) => setTimeout(resolve, 100));

        const auditLogs = await runQuery<Array<{ id: number }>>(
          "SELECT id FROM AuditLog WHERE entity_type = 'TestEntity'",
          []
        );

        expect(auditLogs).toHaveLength(0);
      } finally {
        cleanup();
      }
    });

    it("should NOT create audit log for 5xx errors", async () => {
      const router = express.Router();
      router.get(
        "/test/:id",
        auditReadEntity("TestEntity"),
        (_req: Request, _res: Response, next: NextFunction) => {
          next(new Error("Internal server error"));
        }
      );

      const { app, cleanup } = createExpressTestApp(router, "/api/v1");

      try {
        await request(app).get("/api/v1/test/123");

        await new Promise((resolve) => setTimeout(resolve, 100));

        const auditLogs = await runQuery<Array<{ id: number }>>(
          "SELECT id FROM AuditLog WHERE entity_type = 'TestEntity'",
          []
        );

        expect(auditLogs).toHaveLength(0);
      } finally {
        cleanup();
      }
    });

    it("should NOT create audit log for 304 Not Modified", async () => {
      const router = express.Router();
      router.get(
        "/test/:id",
        auditReadEntity("TestEntity"),
        (_req: Request, res: Response) => {
          res.status(304).end();
        }
      );

      const { app, cleanup } = createExpressTestApp(router, "/api/v1");

      try {
        await request(app).get("/api/v1/test/123");

        await new Promise((resolve) => setTimeout(resolve, 100));

        const auditLogs = await runQuery<Array<{ id: number }>>(
          "SELECT id FROM AuditLog WHERE entity_type = 'TestEntity'",
          []
        );

        expect(auditLogs).toHaveLength(0);
      } finally {
        cleanup();
      }
    });

    it("should handle missing req.auth gracefully", async () => {
      const router = express.Router();
      router.get(
        "/test",
        auditReadEntity("TestEntity"),
        (req: Request, res: Response) => {
          res.status(200).json({ auth: req.auth });
        }
      );

      const { app, cleanup } = createExpressTestApp(router, "/api/v1");

      try {
        await request(app).get("/api/v1/test");

        await new Promise((resolve) => setTimeout(resolve, 100));

        const auditLogs = await runQuery<Array<{ user_id: number | null }>>(
          "SELECT user_id FROM AuditLog WHERE entity_type = 'TestEntity' ORDER BY id DESC LIMIT 1",
          []
        );

        expect(auditLogs[0].user_id).toBeNull();
      } finally {
        cleanup();
      }
    });

    it("should include duration in metadata", async () => {
      const router = express.Router();
      router.get(
        "/test/:id",
        auditReadEntity("TestEntity"),
        async (req: Request, res: Response) => {
          // Simulate some processing time
          await new Promise((resolve) => setTimeout(resolve, 50));
          res.status(200).json({ id: req.params.id });
        }
      );

      const { app, cleanup } = createExpressTestApp(router, "/api/v1");

      try {
        await request(app).get("/api/v1/test/123");

        await new Promise((resolve) => setTimeout(resolve, 100));

        const auditLogs = await runQuery<Array<{ metadata: string }>>(
          "SELECT metadata FROM AuditLog WHERE entity_type = 'TestEntity' ORDER BY id DESC LIMIT 1",
          []
        );

        const metadata = JSON.parse(auditLogs[0].metadata);
        expect(metadata).toHaveProperty("durationMs");
        expect(typeof metadata.durationMs).toBe("number");
        expect(metadata.durationMs).toBeGreaterThanOrEqual(50);
      } finally {
        cleanup();
      }
    });

    it(
      "should handle large response bodies correctly",
      async () => {
        const router = express.Router();
        const largeData = Array(1000)
          .fill(0)
          .map((_, i) => ({ id: i, data: "x".repeat(100) }));

        router.get(
          "/test/:id",
          auditReadEntity("TestEntity"),
          (req: Request, res: Response) => {
            res.status(200).json({ id: req.params.id, items: largeData });
          }
        );

        const { app, cleanup } = createExpressTestApp(router, "/api/v1");

        try {
          await request(app).get("/api/v1/test/123");

          const auditLog = await waitForLatestRow<{
            response_data: string | null;
          }>(
            "SELECT response_data FROM AuditLog WHERE entity_type = 'TestEntity' ORDER BY id DESC LIMIT 1",
            auditInsertWaitTimeoutMs
          );

          expect(auditLog.response_data).toBeTruthy();
          const responseData = JSON.parse(auditLog.response_data || "{}");
          expect(responseData.items).toHaveLength(1000);
        } finally {
          cleanup();
        }
      },
      largeBodyTestTimeoutMs
    );

    it("should not crash request when audit log database insert fails", async () => {
      // Mock runQuery to fail for audit log insert only
      const originalRunQuery = runQuery;
      const mockRunQuery = jest
        .fn()
        .mockImplementation(async (query: string, params?: unknown[]) => {
          if (query.includes("INSERT INTO AuditLog")) {
            throw new Error("Database connection failed");
          }
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          return originalRunQuery(query, params as any);
        });

      // Replace runQuery in the middleware module
      jest
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        .spyOn(require("../db/mysqlRunQuery"), "runQuery")
        .mockImplementation(mockRunQuery);

      const router = express.Router();
      router.get(
        "/test/:id",
        auditReadEntity("TestEntity"),
        (req: Request, res: Response) => {
          res.status(200).json({ id: req.params.id, success: true });
        }
      );

      const { app, cleanup } = createExpressTestApp(router, "/api/v1");

      try {
        const res = await request(app).get("/api/v1/test/123");

        // Request should still succeed even if audit log fails
        expect(res.status).toBe(200);
        expect(res.body).toEqual({ id: "123", success: true });

        // Verify no audit log was created due to error
        await new Promise((resolve) => setTimeout(resolve, 100));
        const auditLogs = await originalRunQuery<Array<{ id: number }>>(
          "SELECT id FROM AuditLog WHERE entity_type = 'TestEntity'",
          []
        );
        expect(auditLogs).toHaveLength(0);
      } finally {
        cleanup();
        jest.restoreAllMocks();
      }
    });
  });

  describe("auditUpdateEntity", () => {
    it("should create audit log for successful PUT/POST request", async () => {
      const router = express.Router();
      router.put(
        "/test/:id",
        auditUpdateEntity("TestEntity"),
        (req: Request, res: Response) => {
          res.status(200).json({ id: req.params.id, updated: true });
        }
      );

      const { app, cleanup } = createExpressTestApp(router, "/api/v1");

      try {
        await request(app).put("/api/v1/test/456").send({ name: "updated" });

        await new Promise((resolve) => setTimeout(resolve, 100));

        const auditLogs = await runQuery<
          Array<{
            action_type: string;
            entity_type: string;
            entity_id: number | null;
            response_status: number;
          }>
        >(
          "SELECT * FROM AuditLog WHERE entity_type = 'TestEntity' ORDER BY id DESC LIMIT 1",
          []
        );

        expect(auditLogs).toHaveLength(1);
        expect(auditLogs[0].action_type).toBe("Update TestEntity");
        expect(auditLogs[0].entity_type).toBe("TestEntity");
        expect(auditLogs[0].entity_id).toBe(456);
        expect(auditLogs[0].response_status).toBe(200);
      } finally {
        cleanup();
      }
    });

    it("should use account_id from req.auth when entity ID not in params", async () => {
      const router = express.Router();
      router.post(
        "/test",
        (req: Request, _res: Response, next: NextFunction) => {
          req.auth = {
            account_id: 999,
            provider_id: "steam999",
            permissions: [],
            roles: [],
            nickname: "testuser",
            provider: "steam"
          };
          next();
        },
        auditUpdateEntity("TestEntity"),
        (req: Request, res: Response) => {
          res.status(200).json({ userId: req.auth?.account_id });
        }
      );

      const { app, cleanup } = createExpressTestApp(router, "/api/v1");

      try {
        await request(app).post("/api/v1/test").send({ data: "test" });

        await new Promise((resolve) => setTimeout(resolve, 100));

        const auditLogs = await runQuery<
          Array<{ entity_id: number | null; user_id: number | null }>
        >(
          "SELECT entity_id, user_id FROM AuditLog WHERE entity_type = 'TestEntity' ORDER BY id DESC LIMIT 1",
          []
        );

        expect(auditLogs[0].entity_id).toBe(999);
        expect(auditLogs[0].user_id).toBe(999);
      } finally {
        cleanup();
      }
    });
  });

  describe("default entity info extraction", () => {
    it("should use 'Unknown' entity type when getEntityInfo not provided", async () => {
      const router = express.Router();
      // Create a custom audit middleware without getEntityInfo
      const customAudit = (req: Request, res: Response, next: NextFunction) => {
        const startTime = Date.now();
        let responseBody: unknown;

        const originalJson = res.json.bind(res);
        res.json = function (body: unknown) {
          responseBody = body;
          return originalJson(body);
        };

        res.on("finish", async () => {
          const duration = Date.now() - startTime;
          const userId = req.auth?.account_id ?? null;

          try {
            if (res.statusCode !== 304 && res.statusCode <= 399) {
              await runQuery(
                `
                INSERT INTO AuditLog (
                  action_type,
                  entity_type,
                  entity_id,
                  user_id,
                  request_data,
                  response_data,
                  response_status,
                  response_message,
                  user_agent,
                  metadata
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
              `,
                [
                  `${req.method} ${req.originalUrl}`,
                  "Unknown",
                  null,
                  userId,
                  req.body ? JSON.stringify(req.body) : null,
                  responseBody ? JSON.stringify(responseBody) : null,
                  res.statusCode,
                  res.statusMessage,
                  req.headers["user-agent"] || "",
                  JSON.stringify({ durationMs: duration })
                ]
              );
            }
          } catch (_err) {
            // Error handling - should not crash
          }
        });

        next();
      };

      router.get("/test", customAudit, (req: Request, res: Response) => {
        res.status(200).json({ test: true });
      });

      const { app, cleanup } = createExpressTestApp(router, "/api/v1");

      try {
        await request(app).get("/api/v1/test");

        await new Promise((resolve) => setTimeout(resolve, 100));

        const auditLogs = await runQuery<
          Array<{ entity_type: string; entity_id: number | null }>
        >(
          "SELECT entity_type, entity_id FROM AuditLog WHERE entity_type = 'Unknown' ORDER BY id DESC LIMIT 1",
          []
        );

        expect(auditLogs).toHaveLength(1);
        expect(auditLogs[0].entity_type).toBe("Unknown");
        expect(auditLogs[0].entity_id).toBeNull();
      } finally {
        cleanup();
      }
    });
  });
});
