import type { Request, Response } from "express";
import EventEmitter from "node:events";
import { attachFailedParseJobSse } from "./failed-parse-sse.services";

jest.mock("./failed-parse-job-events.services", () => ({
  subscribeFailedParseJobEvents: jest.fn(async (_userId: number, handlers) => {
    handlers.onMessage(
      JSON.stringify({ job_id: "j1", kind: "reparse", status: "started" })
    );
    return {
      close: jest.fn(async () => {})
    };
  })
}));

describe("attachFailedParseJobSse", () => {
  it("writes SSE headers and event payload", async () => {
    const req = new EventEmitter() as Request;
    const write = jest.fn();
    const setHeader = jest.fn();
    const status = jest.fn().mockReturnThis();
    const flushHeaders = jest.fn();
    const res = {
      status,
      setHeader,
      write,
      flushHeaders
    } as unknown as Response;

    await attachFailedParseJobSse(req, res, 42);

    expect(status).toHaveBeenCalledWith(200);
    expect(setHeader).toHaveBeenCalledWith(
      "Content-Type",
      "text/event-stream; charset=utf-8"
    );
    expect(write).toHaveBeenCalledWith(
      expect.stringContaining("event: failed-parse-job")
    );
    expect(write).toHaveBeenCalledWith(
      expect.stringContaining('data: {"job_id":"j1"')
    );

    req.emit("close");
  });
});
