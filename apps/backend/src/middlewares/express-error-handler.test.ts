import express, {
  type Request,
  type Response,
  type NextFunction
} from "express";
import request from "supertest";
import { ZodError } from "zod";
import { expressErrorHandler } from "./express-error-handler";
import { BadRequestError, NotFoundError } from "../utils/errors";

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
        const dbError = {
          code: "ER_SOME_OTHER_ERROR",
          sqlState: "42000",
          sqlMessage: "Some other database error",
          message: "Some other database error"
        };
        next(dbError as unknown as Error);
      });

      const res = await request(app).get("/test");

      expect([400]).toContain(res.status);
      expect(res.headers["content-type"]).toMatch(/application\/problem\+json/);
      expect(res.body).toEqual(
        expect.objectContaining({
          type: "about:blank",
          title: expect.any(String),
          status: res.status,
          detail: "Some other database error",
          instance: "/test"
        })
      );
    });
  });
});
