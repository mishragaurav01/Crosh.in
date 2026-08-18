import express, { type ErrorRequestHandler } from "express";
import { prisma } from "db/client";
import { createAuthRoutes } from "./src/features/identity/routes/auth.routes.js";

const app = express();

app.use(express.json());

app.use("/api/auth", createAuthRoutes(prisma));

const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  console.error("[unhandled]", err);
  res.status(500).json({
    success: false,
    error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred" },
  });
};

app.use(errorHandler);

const PORT = process.env.PORT ?? 3002;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
