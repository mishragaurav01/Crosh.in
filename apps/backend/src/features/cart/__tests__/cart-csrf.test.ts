import { describe, it, expect, mock, afterAll } from "bun:test";
import express from "express";
import type { Server } from "node:http";

const { createCartRoutes } = await import("../routes/cart.routes.js");

const validSession = {
  user: { id: "user-1", email: "test@example.com", isAdmin: false },
  csrfToken: "sess-csrf",
  expiresAt: new Date(Date.now() + 60_000),
};

const GUEST_COOKIES = "guest_token=gtok; cart_csrf=gtok";
const SESSION_COOKIE = "session_id=sess-1";

// With an empty database behind every lookup, a request that clears CSRF
// lands on these statuses: add succeeds against nothing, item mutations
// 404 because no owned line exists, clear is idempotently empty.
const MUTATING_ENDPOINTS = [
  { method: "POST", path: "/items", body: { variantId: "var-1", quantity: 1 }, passStatus: 200 },
  { method: "PATCH", path: "/items/item-1", body: { quantity: 2 }, passStatus: 404 },
  { method: "DELETE", path: "/items/item-1", body: undefined as unknown, passStatus: 404 },
  { method: "DELETE", path: "/", body: undefined as unknown, passStatus: 200 },
];

function createRouteTestPrisma(params: { session: typeof validSession | null }) {
  const tx = {
    $queryRaw: mock(() => Promise.resolve([{ stock: 10 }])),
    cart: {
      findUnique: mock(() => Promise.resolve(null)),
      update: mock(() => Promise.resolve({})),
      delete: mock(() => Promise.resolve({})),
    },
    cartItem: {
      findUnique: mock(() => Promise.resolve(null)),
      upsert: mock(() => Promise.resolve({})),
      update: mock(() => Promise.resolve({})),
      create: mock(() => Promise.resolve({})),
      delete: mock(() => Promise.resolve({})),
    },
    variant: { findMany: mock(() => Promise.resolve([])) },
  };

  return {
    $transaction: mock((callback: (txClient: typeof tx) => unknown) =>
      Promise.resolve(callback(tx)),
    ),
    session: {
      findUnique: mock(() => Promise.resolve(params.session)),
      delete: mock(() => Promise.resolve({})),
    },
    cart: {
      findUnique: mock(() => Promise.resolve(null)),
      create: mock((args: { data: Record<string, unknown> }) =>
        Promise.resolve({ id: "cart-new", ...args.data }),
      ),
      update: mock(() => Promise.resolve({})),
      delete: mock(() => Promise.resolve({})),
    },
    cartItem: {
      findFirst: mock(() => Promise.resolve(null)),
      delete: mock(() => Promise.resolve({})),
      deleteMany: mock(() => Promise.resolve({ count: 0 })),
    },
    variant: { findMany: mock(() => Promise.resolve([])) },
  } as any;
}

function startApp(prisma: unknown): Promise<{ server: Server; port: number }> {
  const app = express();
  app.use(express.json());
  app.use("/api/cart", createCartRoutes(prisma as never));
  const server = app.listen(0);
  return new Promise((resolve) => {
    server.on("listening", () => {
      const address = server.address();
      resolve({ server, port: (address as { port: number }).port });
    });
  });
}

async function request(
  base: string,
  endpoint: { method: string; path: string; body?: unknown },
  opts: { cookie?: string; csrfHeader?: string } = {},
): Promise<{ status: number; code?: string }> {
  const headers: Record<string, string> = {};
  if (opts.cookie) headers.cookie = opts.cookie;
  if (opts.csrfHeader !== undefined) headers["x-csrf-token"] = opts.csrfHeader;
  if (endpoint.body !== undefined) headers["content-type"] = "application/json";

  const response = await fetch(`${base}${endpoint.path}`, {
    method: endpoint.method,
    headers,
    body: endpoint.body !== undefined ? JSON.stringify(endpoint.body) : undefined,
  });
  const payload = (await response.json()) as {
    success: boolean;
    error?: { code?: string };
  };
  return { status: response.status, code: payload.error?.code };
}

const servers: Server[] = [];
afterAll(() => {
  for (const server of servers) {
    server.close();
  }
});

describe("cart CSRF enforcement across all mutating routes", () => {
  it("rejects a guest carrying cart cookies but no X-CSRF-Token header with 403 on every mutation", async () => {
    const { server, port } = await startApp(createRouteTestPrisma({ session: null }));
    servers.push(server);
    const base = `http://127.0.0.1:${port}/api/cart`;

    for (const endpoint of MUTATING_ENDPOINTS) {
      const result = await request(base, endpoint, { cookie: GUEST_COOKIES });
      expect(result.status).toBe(403);
      expect(result.code).toBe("CSRF_FAILED");
    }
  });

  it("rejects a guest whose header does not match the cart_csrf cookie with 403 on every mutation", async () => {
    const { server, port } = await startApp(createRouteTestPrisma({ session: null }));
    servers.push(server);
    const base = `http://127.0.0.1:${port}/api/cart`;

    for (const endpoint of MUTATING_ENDPOINTS) {
      const result = await request(base, endpoint, {
        cookie: GUEST_COOKIES,
        csrfHeader: "not-the-cookie-value",
      });
      expect(result.status).toBe(403);
      expect(result.code).toBe("CSRF_FAILED");
    }
  });

  it("rejects a guest holding guest_token without its matching cart_csrf cookie with 403", async () => {
    const { server, port } = await startApp(createRouteTestPrisma({ session: null }));
    servers.push(server);
    const base = `http://127.0.0.1:${port}/api/cart`;

    for (const endpoint of MUTATING_ENDPOINTS) {
      const result = await request(base, endpoint, {
        cookie: "guest_token=gtok",
        csrfHeader: "gtok",
      });
      expect(result.status).toBe(403);
      expect(result.code).toBe("CSRF_FAILED");
    }
  });

  it("lets a first-contact visitor (no cookies, no header) reach every handler", async () => {
    const { server, port } = await startApp(createRouteTestPrisma({ session: null }));
    servers.push(server);
    const base = `http://127.0.0.1:${port}/api/cart`;

    for (const endpoint of MUTATING_ENDPOINTS) {
      const result = await request(base, endpoint);
      // The carve-out passes the request through; whatever happens downstream,
      // it must not die at the CSRF gate.
      expect(result.status).not.toBe(403);
      expect(result.code).not.toBe("CSRF_FAILED");
    }
  });

  it("lets a guest with a matching double-submit token reach every handler", async () => {
    const { server, port } = await startApp(createRouteTestPrisma({ session: null }));
    servers.push(server);
    const base = `http://127.0.0.1:${port}/api/cart`;

    for (const endpoint of MUTATING_ENDPOINTS) {
      const result = await request(base, endpoint, {
        cookie: GUEST_COOKIES,
        csrfHeader: "gtok",
      });
      expect(result.status).toBe(endpoint.passStatus);
      expect(result.code).not.toBe("CSRF_FAILED");
    }
  });

  it("rejects an authenticated request without X-CSRF-Token header with 403 on every mutation", async () => {
    const { server, port } = await startApp(
      createRouteTestPrisma({ session: validSession }),
    );
    servers.push(server);
    const base = `http://127.0.0.1:${port}/api/cart`;

    for (const endpoint of MUTATING_ENDPOINTS) {
      const result = await request(base, endpoint, { cookie: SESSION_COOKIE });
      expect(result.status).toBe(403);
      expect(result.code).toBe("CSRF_FAILED");
    }
  });

  it("rejects an authenticated request whose header differs from the session token with 403", async () => {
    const { server, port } = await startApp(
      createRouteTestPrisma({ session: validSession }),
    );
    servers.push(server);
    const base = `http://127.0.0.1:${port}/api/cart`;

    for (const endpoint of MUTATING_ENDPOINTS) {
      const result = await request(base, endpoint, {
        cookie: SESSION_COOKIE,
        csrfHeader: "wrong-token",
      });
      expect(result.status).toBe(403);
      expect(result.code).toBe("CSRF_FAILED");
    }
  });

  it("lets an authenticated request matching its session token reach every handler", async () => {
    const { server, port } = await startApp(
      createRouteTestPrisma({ session: validSession }),
    );
    servers.push(server);
    const base = `http://127.0.0.1:${port}/api/cart`;

    for (const endpoint of MUTATING_ENDPOINTS) {
      const result = await request(base, endpoint, {
        cookie: SESSION_COOKIE,
        csrfHeader: "sess-csrf",
      });
      expect(result.status).toBe(endpoint.passStatus);
      expect(result.code).not.toBe("CSRF_FAILED");
    }
  });

  it("never enforces CSRF on GET /api/cart", async () => {
    const { server: guestServer, port: guestPort } = await startApp(
      createRouteTestPrisma({ session: null }),
    );
    servers.push(guestServer);

    const guestResult = await request(
      `http://127.0.0.1:${guestPort}/api/cart`,
      { method: "GET", path: "/" },
      { cookie: GUEST_COOKIES },
    );
    expect(guestResult.status).toBe(200);

    const { server: authedServer, port: authedPort } = await startApp(
      createRouteTestPrisma({ session: validSession }),
    );
    servers.push(authedServer);

    const authedResult = await request(
      `http://127.0.0.1:${authedPort}/api/cart`,
      { method: "GET", path: "/" },
      { cookie: SESSION_COOKIE },
    );
    expect(authedResult.status).toBe(200);
  });
});

describe("guest cookie flags on the wire", () => {
  function cookieValue(rawCookie: string): string {
    const pair = rawCookie.split(";")[0];
    const value = pair?.split("=")[1];
    if (!value) {
      throw new Error(`malformed Set-Cookie header: ${rawCookie}`);
    }
    return value;
  }

  it("issues guest_token HttpOnly and JS-readable cart_csrf with SameSite=Lax over a real response", async () => {
    const { server, port } = await startApp(createRouteTestPrisma({ session: null }));
    servers.push(server);

    // First contact: the CSRF carve-out lets the mutation through and the
    // handler lazily issues both cookies on this very response.
    const response = await fetch(`http://127.0.0.1:${port}/api/cart/items`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ variantId: "var-1", quantity: 1 }),
    });
    expect(response.status).toBe(200);

    const rawCookies = response.headers.getSetCookie();
    const tokenCookie = rawCookies.find((c) => c.startsWith("guest_token="));
    const csrfCookie = rawCookies.find((c) => c.startsWith("cart_csrf="));

    expect(tokenCookie).toBeDefined();
    expect(csrfCookie).toBeDefined();

    const tokenValue = cookieValue(tokenCookie!);
    const csrfValue = cookieValue(csrfCookie!);
    expect(tokenValue).toMatch(/^[0-9a-f]{64}$/);
    // Double-submit pair: same opaque value behind both cookies.
    expect(csrfValue).toBe(tokenValue);

    expect(tokenCookie!).toContain("HttpOnly");
    expect(tokenCookie!).toContain("SameSite=Lax");
    expect(tokenCookie!).toContain("Path=/");
    // secure follows NODE_ENV === "production"; tests run outside production,
    // so the attribute must be absent rather than breaking local http.
    expect(tokenCookie!).not.toContain("Secure");

    expect(csrfCookie!).toContain("SameSite=Lax");
    expect(csrfCookie!).toContain("Path=/");
    // Readable by the SPA so it can echo the value back as X-CSRF-Token.
    expect(csrfCookie!).not.toContain("HttpOnly");
  });
});
