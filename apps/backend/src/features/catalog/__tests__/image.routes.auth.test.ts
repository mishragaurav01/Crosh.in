import { describe, it, expect, afterAll, mock } from "bun:test";
import express from "express";
import type { Server } from "node:http";

const { createImageRoutes } = await import("../routes/image.routes.js");

const adminSession = {
  user: { id: "user-1", email: "admin@test.com", isAdmin: true },
  csrfToken: "csrf-token",
  expiresAt: new Date(Date.now() + 60_000),
};

const nonAdminSession = {
  user: { id: "user-2", email: "member@test.com", isAdmin: false },
  csrfToken: "csrf-token",
  expiresAt: new Date(Date.now() + 60_000),
};

function createAuthPrisma(session: typeof adminSession | null) {
  return {
    session: {
      findUnique: mock(() =>
        Promise.resolve(session ? { ...session } : null),
      ),
    },
    user: {
      findUnique: mock((args: { where: { id: string } }) => {
        if (args.where.id === "user-1") {
          return Promise.resolve({ id: "user-1", isAdmin: true });
        }
        return Promise.resolve({ id: args.where.id, isAdmin: false });
      }),
    },
  } as any;
}

function startApp(prisma: unknown): Promise<{ server: Server; port: number }> {
  const app = express();
  app.use(express.json());
  app.use("/api/admin/images", createImageRoutes(prisma as never));
  const server = app.listen(0);
  return new Promise((resolve) => {
    server.on("listening", () => {
      const address = server.address();
      resolve({ server, port: (address as { port: number }).port });
    });
  });
}

const endpoints = [
  { method: "POST", path: "/upload-url" },
  { method: "POST", path: "/" },
  { method: "PATCH", path: "/img-1" },
  { method: "DELETE", path: "/img-1" },
  { method: "GET", path: "/product/prod-1" },
];

const servers: Server[] = [];

afterAll(() => {
  for (const server of servers) {
    server.close();
  }
});

describe("image routes — authorization contract", () => {
  it("rejects unauthenticated requests to every image endpoint with 401", async () => {
    const { server, port } = await startApp(createAuthPrisma(adminSession));
    servers.push(server);
    const base = `http://127.0.0.1:${port}/api/admin/images`;

    for (const endpoint of endpoints) {
      const response = await fetch(`${base}${endpoint.path}`, {
        method: endpoint.method,
        headers: { "content-type": "application/json" },
        body: ["POST", "PATCH"].includes(endpoint.method) ? "{}" : undefined,
      });

      expect(response.status).toBe(401);
      const body = (await response.json()) as {
        success: boolean;
        error: { code: string };
      };
      expect(body.success).toBe(false);
      expect(body.error.code).toBe("UNAUTHENTICATED");
    }
  });

  it("rejects authenticated non-admin requests to every image endpoint with 403", async () => {
    const { server, port } = await startApp(createAuthPrisma(nonAdminSession));
    servers.push(server);
    const base = `http://127.0.0.1:${port}/api/admin/images`;

    for (const endpoint of endpoints) {
      const response = await fetch(`${base}${endpoint.path}`, {
        method: endpoint.method,
        headers: {
          "content-type": "application/json",
          cookie: "session_id=sess-2",
        },
        body: ["POST", "PATCH"].includes(endpoint.method) ? "{}" : undefined,
      });

      expect(response.status).toBe(403);
      const body = (await response.json()) as {
        success: boolean;
        error: { code: string };
      };
      expect(body.success).toBe(false);
      expect(body.error.code).toBe("FORBIDDEN");
    }
  });

  it("rejects a session cookie that does not resolve to a session with 401", async () => {
    const { server, port } = await startApp(createAuthPrisma(null));
    servers.push(server);
    const base = `http://127.0.0.1:${port}/api/admin/images`;

    const response = await fetch(`${base}/product/prod-1`, {
      headers: { cookie: "session_id=bogus" },
    });

    expect(response.status).toBe(401);
  });
});
