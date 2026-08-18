import { describe, it, expect, mock } from "bun:test";
import { requireCsrfToken } from "../middleware/csrf.middleware.js";

function createMockReq(csrfHeader?: string) {
  return {
    headers: csrfHeader !== undefined ? { "x-csrf-token": csrfHeader } : {},
    csrfToken: undefined,
  } as any;
}

function createMockRes() {
  const res: any = {
    statusCode: undefined as number | undefined,
    body: undefined as unknown,
    status: mock(function (this: any, code: number) {
      this.statusCode = code;
      return this;
    }),
    json: mock(function (this: any, data: unknown) {
      this.body = data;
      return this;
    }),
  };
  return res;
}

function createMockNext() {
  return mock(() => {});
}

describe("requireCsrfToken middleware", () => {
  it("returns 403 when X-CSRF-Token header is missing", () => {
    const req = createMockReq();
    req.csrfToken = "valid-token";
    const res = createMockRes();
    const next = createMockNext();

    requireCsrfToken(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({ code: "CSRF_FAILED" }),
      }),
    );
    expect(next).not.toHaveBeenCalled();
  });

  it("returns 403 when req.csrfToken is not set (no session)", () => {
    const req = createMockReq("some-token");
    const res = createMockRes();
    const next = createMockNext();

    requireCsrfToken(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it("returns 403 when header token does not match session token", () => {
    const req = createMockReq("header-token");
    req.csrfToken = "session-token";
    const res = createMockRes();
    const next = createMockNext();

    requireCsrfToken(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({ code: "CSRF_FAILED" }),
      }),
    );
    expect(next).not.toHaveBeenCalled();
  });

  it("calls next when header token matches session token", () => {
    const token = "matching-token";
    const req = createMockReq(token);
    req.csrfToken = token;
    const res = createMockRes();
    const next = createMockNext();

    requireCsrfToken(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });
});
