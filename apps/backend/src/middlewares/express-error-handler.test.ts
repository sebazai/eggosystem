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
});
