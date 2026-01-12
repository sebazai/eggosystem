import express, {
  type Request,
  type Response,
  type NextFunction
} from "express";
import request from "supertest";
import { ZodError } from "zod";
import { expressErrorHandler } from "./express-error-handler";
import { BadRequestError, NotFoundError, BaseError } from "../utils/errors";

function createApp(
  routeImpl: (req: Request, res: Response, next: NextFunction) => void
) {
  const app = express();

  app.get("/test", routeImpl);

  // Error handler last

  app.use(expressErrorHandler);
  return app;
}

describe("expressErrorHandler - RFC7807 problem+json", () => {
  it("returns problem+json for UnauthorizedError-like errors", async () => {
    const app = createApp((_req, _res, next) => {
      const unauthorizedErr = {
        name: "UnauthorizedError",
        status: 401,
        message: "No auth token provided"
      };
      next(unauthorizedErr);
    });

    const res = await request(app).get("/test");

    expect(res.status).toBe(401);
    expect(res.headers["content-type"]).toMatch(/application\/problem\+json/);
    expect(res.body).toEqual(
      expect.objectContaining({
        type: "about:blank",
        title: expect.stringMatching(/Unauthorized/i),
        status: 401,
        detail: "No auth token provided",
        instance: "/test"
      })
    );
  });

  it("returns problem+json for ZodError with aggregated messages and issues extension", async () => {
    type Issue = ZodError["issues"][number];
    const zodIssues: Issue[] = [
      {
        code: "invalid_type",
        message: "Invalid field A",
        path: ["a"]
      } as unknown as Issue,
      {
        code: "invalid_type",
        message: "Missing field B",
        path: ["b"]
      } as unknown as Issue
    ];

    const app = createApp((_req, _res, next) => {
      next(new ZodError(zodIssues));
    });

    const res = await request(app).get("/test");

    expect(res.status).toBe(400);
    expect(res.headers["content-type"]).toMatch(/application\/problem\+json/);
    expect(res.body).toEqual(
      expect.objectContaining({
        type: "about:blank",
        title: expect.stringMatching(/Bad Request|Validation/i),
        status: 400,
        detail: expect.stringContaining("Invalid field A"),
        instance: "/test"
      })
    );
    // Extension member with issues
    expect(res.body.errors || res.body.issues).toBeDefined();
  });

  it("returns problem+json for BaseError subclasses with correct status and detail", async () => {
    const app = createApp((_req, _res, next) => {
      next(new BadRequestError("payload invalid"));
    });

    const res = await request(app).get("/test");

    expect(res.status).toBe(400);
    expect(res.headers["content-type"]).toMatch(/application\/problem\+json/);
    expect(res.body).toEqual(
      expect.objectContaining({
        type: "about:blank",
        title: expect.stringMatching(/Bad Request/i),
        status: 400,
        detail: "payload invalid",
        instance: "/test"
      })
    );
  });

  it("returns problem+json for NotFoundError with 404", async () => {
    const app = createApp((_req, _res, next) => {
      next(new NotFoundError("not found"));
    });

    const res = await request(app).get("/test");

    expect(res.status).toBe(404);
    expect(res.headers["content-type"]).toMatch(/application\/problem\+json/);
    expect(res.body).toEqual(
      expect.objectContaining({
        type: "about:blank",
        title: expect.stringMatching(/Not Found/i),
        status: 404,
        detail: "not found",
        instance: "/test"
      })
    );
  });

  it("returns problem+json for generic Error with current policy (400 default)", async () => {
    const app = createApp((_req, _res, next) => {
      next(new Error("Some client error"));
    });

    const res = await request(app).get("/test");

    expect([400]).toContain(res.status);
    expect(res.headers["content-type"]).toMatch(/application\/problem\+json/);
    expect(res.body).toEqual(
      expect.objectContaining({
        type: "about:blank",
        title: expect.any(String),
        status: res.status,
        detail: "Some client error",
        instance: "/test"
      })
    );
  });

  describe("Database error handling", () => {
    it("returns problem+json with 409 Conflict for ER_DUP_ENTRY errors", async () => {
      const app = createApp((_req, _res, next) => {
        const dbError = new Error(
          "Duplicate entry '123-456' for key 'KanahautomoRegistrations.steam_id'"
        );
        (dbError as { code?: string }).code = "ER_DUP_ENTRY";
        next(dbError);
      });

      const res = await request(app).get("/test");

      expect(res.status).toBe(409);
      expect(res.headers["content-type"]).toMatch(/application\/problem\+json/);
      expect(res.body).toEqual(
        expect.objectContaining({
          type: "about:blank",
          title: expect.stringMatching(/Conflict/i),
          status: 409,
          detail: "You are already registered for this organization",
          instance: "/test"
        })
      );
    });

    it("returns problem+json with 409 Conflict for ER_DUP_ENTRY with Teams table", async () => {
      const app = createApp((_req, _res, next) => {
        const dbError = new Error(
          "Duplicate entry 'TeamName' for key 'Teams.name'"
        );
        (dbError as { code?: string }).code = "ER_DUP_ENTRY";
        next(dbError);
      });

      const res = await request(app).get("/test");

      expect(res.status).toBe(409);
      expect(res.headers["content-type"]).toMatch(/application\/problem\+json/);
      expect(res.body).toEqual(
        expect.objectContaining({
          type: "about:blank",
          title: expect.stringMatching(/Conflict/i),
          status: 409,
          detail: "A team with this name already exists",
          instance: "/test"
        })
      );
    });

    it("returns problem+json with 409 Conflict for ER_DUP_ENTRY with fallback message", async () => {
      const app = createApp((_req, _res, next) => {
        const dbError = new Error(
          "Duplicate entry for key 'UnknownTable.unknown_key'"
        );
        (dbError as { code?: string }).code = "ER_DUP_ENTRY";
        next(dbError);
      });

      const res = await request(app).get("/test");

      expect(res.status).toBe(409);
      expect(res.headers["content-type"]).toMatch(/application\/problem\+json/);
      expect(res.body).toEqual(
        expect.objectContaining({
          type: "about:blank",
          title: expect.stringMatching(/Conflict/i),
          status: 409,
          detail: "This record already exists",
          instance: "/test"
        })
      );
    });

    it("returns problem+json with 409 Conflict for SQLSTATE 45000 trigger errors", async () => {
      const app = createApp((_req, _res, next) => {
        const dbError = {
          code: "SOME_CODE",
          sqlState: "45000",
          sqlMessage: "Team 123 is already registered for season 456",
          message: "Team 123 is already registered for season 456"
        };
        next(dbError as unknown as Error);
      });

      const res = await request(app).get("/test");

      expect(res.status).toBe(409);
      expect(res.headers["content-type"]).toMatch(/application\/problem\+json/);
      expect(res.body).toEqual(
        expect.objectContaining({
          type: "about:blank",
          title: expect.stringMatching(/Conflict/i),
          status: 409,
          detail: "Team 123 is already registered for season 456",
          instance: "/test"
        })
      );
    });

    it("returns problem+json with 409 Conflict for trigger error with external platform ID", async () => {
      const app = createApp((_req, _res, next) => {
        const dbError = {
          code: "SOME_CODE",
          sqlState: "45000",
          sqlMessage:
            'FACEIT Platform ID "abc123" is already used for season 1.',
          message: 'FACEIT Platform ID "abc123" is already used for season 1.'
        };
        next(dbError as unknown as Error);
      });

      const res = await request(app).get("/test");

      expect(res.status).toBe(409);
      expect(res.headers["content-type"]).toMatch(/application\/problem\+json/);
      expect(res.body).toEqual(
        expect.objectContaining({
          type: "about:blank",
          title: expect.stringMatching(/Conflict/i),
          status: 409,
          detail: 'FACEIT Platform ID "abc123" is already used for season 1.',
          instance: "/test"
        })
      );
    });

    it("handles database errors that are not duplicate entry or trigger errors as generic errors", async () => {
      const app = createApp((_req, _res, next) => {
        // Create an actual Error instance to match instanceof Error check
        const dbError = new Error("Some other database error");
        // Add database error properties
        (
          dbError as { code?: string; sqlState?: string; sqlMessage?: string }
        ).code = "ER_SOME_OTHER_ERROR";
        (
          dbError as { code?: string; sqlState?: string; sqlMessage?: string }
        ).sqlState = "42000";
        (
          dbError as { code?: string; sqlState?: string; sqlMessage?: string }
        ).sqlMessage = "Some other database error";
        next(dbError);
      });

      const res = await request(app).get("/test");

      // Database errors that aren't duplicates/triggers are treated as generic Error instances
      // which default to 400 status
      expect(res.status).toBe(400);
      expect(res.headers["content-type"]).toMatch(/application\/problem\+json/);
      expect(res.body).toEqual(
        expect.objectContaining({
          type: "about:blank",
          title: expect.any(String),
          status: 400,
          detail: "Some other database error",
          instance: "/test"
        })
      );
    });
  });

  describe("CORS error handling", () => {
    it("returns problem+json with 500 status for CORS errors", async () => {
      const app = createApp((_req, _res, next) => {
        next(new Error("Not allowed by CORS"));
      });

      const res = await request(app).get("/test");

      expect(res.status).toBe(500);
      expect(res.headers["content-type"]).toMatch(/application\/problem\+json/);
      expect(res.body).toEqual(
        expect.objectContaining({
          type: "about:blank",
          title: expect.stringMatching(/Internal Server Error/i),
          status: 500,
          detail: "Not allowed by CORS",
          instance: "/test"
        })
      );
    });

    it("returns 500 for CORS errors even when error has status property", async () => {
      const app = createApp((_req, _res, next) => {
        const corsError = new Error("Not allowed by CORS");
        (corsError as { status?: number }).status = 400; // Even if status is 400
        next(corsError);
      });

      const res = await request(app).get("/test");

      // CORS errors should always return 500, not the error's status
      expect(res.status).toBe(500);
      expect(res.body.status).toBe(500);
    });
  });

  describe("Unknown error types", () => {
    it("returns problem+json with 500 for non-Error objects", async () => {
      const app = createApp((_req, _res, next) => {
        next({ someProperty: "not an error object" });
      });

      const res = await request(app).get("/test");

      expect(res.status).toBe(500);
      expect(res.headers["content-type"]).toMatch(/application\/problem\+json/);
      expect(res.body).toEqual(
        expect.objectContaining({
          type: "about:blank",
          title: expect.stringMatching(/Internal Server Error/i),
          status: 500,
          detail: "Something went wrong",
          instance: "/test"
        })
      );
    });

    it("returns problem+json with 500 for null errors", async () => {
      const app = createApp((_req, _res, next) => {
        // Express doesn't call error handler for null, so we need to explicitly pass an error
        // In real scenarios, null would result in 404 from Express default handler
        // But if error handler is called with null, it should handle it
        const error = null as unknown as Error;
        next(error);
      });

      const res = await request(app).get("/test");

      // When null is passed to error handler, it should return 500
      expect(res.status).toBe(500);
      expect(res.body).toEqual(
        expect.objectContaining({
          type: "about:blank",
          title: expect.stringMatching(/Internal Server Error/i),
          status: 500,
          detail: "Something went wrong",
          instance: "/test"
        })
      );
    });

    it("returns problem+json with 500 for undefined errors", async () => {
      const app = createApp((_req, _res, next) => {
        // Express doesn't call error handler for undefined, so we need to explicitly pass an error
        // In real scenarios, undefined would result in 404 from Express default handler
        // But if error handler is called with undefined, it should handle it
        const error = undefined as unknown as Error;
        next(error);
      });

      const res = await request(app).get("/test");

      // When undefined is passed to error handler, it should return 500
      expect(res.status).toBe(500);
      expect(res.body).toEqual(
        expect.objectContaining({
          type: "about:blank",
          title: expect.stringMatching(/Internal Server Error/i),
          status: 500,
          detail: "Something went wrong",
          instance: "/test"
        })
      );
    });

    it("returns problem+json with 500 for string errors", async () => {
      const app = createApp((_req, _res, next) => {
        next("String error message");
      });

      const res = await request(app).get("/test");

      expect(res.status).toBe(500);
      expect(res.body).toEqual(
        expect.objectContaining({
          type: "about:blank",
          title: expect.stringMatching(/Internal Server Error/i),
          status: 500,
          detail: "Something went wrong",
          instance: "/test"
        })
      );
    });
  });

  describe("Database error conversion edge cases", () => {
    it("handles database errors that are not Error instances", async () => {
      const app = createApp((_req, _res, next) => {
        // Database error that's not an Error instance (unlikely but possible)
        const dbError = {
          code: "ER_DUP_ENTRY",
          sqlState: "23000",
          sqlMessage: "Duplicate entry '123' for key 'test_key'",
          message: "Duplicate entry '123' for key 'test_key'"
        };
        next(dbError);
      });

      const res = await request(app).get("/test");

      expect(res.status).toBe(409);
      expect(res.headers["content-type"]).toMatch(/application\/problem\+json/);
      expect(res.body).toEqual(
        expect.objectContaining({
          type: "about:blank",
          title: expect.stringMatching(/Conflict/i),
          status: 409,
          instance: "/test"
        })
      );
    });

    it("handles database errors with missing sqlMessage", async () => {
      const app = createApp((_req, _res, next) => {
        const dbError = {
          code: "ER_DUP_ENTRY",
          sqlState: "23000",
          message: "Duplicate entry"
        };
        next(dbError as unknown as Error);
      });

      const res = await request(app).get("/test");

      expect(res.status).toBe(409);
      expect(res.body.status).toBe(409);
    });
  });

  describe("RFC 7807 format verification", () => {
    it("ensures all error responses follow RFC 7807 format", async () => {
      const testCases = [
        {
          error: new BadRequestError("Bad request"),
          expectedStatus: 400,
          expectedTitle: "Bad Request"
        },
        {
          error: new NotFoundError("Not found"),
          expectedStatus: 404,
          expectedTitle: "Not Found"
        },
        {
          error: new Error("Generic error"),
          expectedStatus: 400,
          expectedTitle: "Bad Request"
        }
      ];

      for (const testCase of testCases) {
        const app = createApp((_req, _res, next) => {
          next(testCase.error);
        });

        const res = await request(app).get("/test");

        // Verify RFC 7807 required fields
        expect(res.body).toHaveProperty("type");
        expect(res.body).toHaveProperty("title");
        expect(res.body).toHaveProperty("status");
        expect(res.body).toHaveProperty("detail");
        expect(res.body).toHaveProperty("instance");

        // Verify field types and values
        expect(res.body.type).toBe("about:blank");
        expect(res.body.title).toBe(testCase.expectedTitle);
        expect(res.body.status).toBe(testCase.expectedStatus);
        expect(typeof res.body.detail).toBe("string");
        expect(res.body.instance).toBe("/test");

        // Verify content type
        expect(res.headers["content-type"]).toMatch(
          /application\/problem\+json/
        );
      }
    });

    it("includes extensions for ZodError (issues array)", async () => {
      const zodError = new ZodError([
        {
          code: "invalid_type",
          message: "Test error",
          path: ["test"]
        } as ZodError["issues"][number]
      ]);

      const app = createApp((_req, _res, next) => {
        next(zodError);
      });

      const res = await request(app).get("/test");

      expect(res.body).toHaveProperty("issues");
      expect(Array.isArray(res.body.issues)).toBe(true);
      expect(res.body.issues.length).toBeGreaterThan(0);
    });

    it("uses custom title from BaseError when provided", async () => {
      class CustomError extends BaseError {
        constructor() {
          super("Custom error message", 400, "Custom Title");
        }
      }

      const app = createApp((_req, _res, next) => {
        next(new CustomError());
      });

      const res = await request(app).get("/test");

      expect(res.body.title).toBe("Custom Title");
      expect(res.body.detail).toBe("Custom error message");
      expect(res.body.status).toBe(400);
    });
  });

  describe("Error status code mapping", () => {
    it("maps all defined status codes to correct titles", async () => {
      const statusMap: Array<{ status: number; title: string }> = [
        { status: 400, title: "Bad Request" },
        { status: 401, title: "Unauthorized" },
        { status: 403, title: "Forbidden" },
        { status: 404, title: "Not Found" },
        { status: 405, title: "Method Not Allowed" },
        { status: 409, title: "Conflict" },
        { status: 422, title: "Unprocessable Entity" },
        { status: 429, title: "Too Many Requests" },
        { status: 500, title: "Internal Server Error" },
        { status: 502, title: "Bad Gateway" },
        { status: 503, title: "Service Unavailable" }
      ];

      for (const { status, title } of statusMap) {
        const app = createApp((_req, _res, next) => {
          const error = new Error("Test error");
          (error as { status?: number }).status = status;
          next(error);
        });

        const res = await request(app).get("/test");

        expect(res.body.title).toBe(title);
        expect(res.body.status).toBe(status);
      }
    });

    it("uses 'Error' as default title for unmapped status codes", async () => {
      const app = createApp((_req, _res, next) => {
        const error = new Error("Test error");
        (error as { status?: number }).status = 418; // I'm a teapot - not in the map
        next(error);
      });

      const res = await request(app).get("/test");

      expect(res.body.title).toBe("Error");
      expect(res.body.status).toBe(418);
    });
  });
});
