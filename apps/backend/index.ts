import express, { type ErrorRequestHandler } from "express";
import cors from "cors";
import { prisma } from "db/client";
import { createAuthRoutes } from "./src/features/identity/routes/auth.routes.js";
import { createCartRoutes } from "./src/features/cart/routes/cart.routes.js";
import { createCategoryRoutes } from "./src/features/catalog/routes/category.routes.js";
import { createCollectionRoutes } from "./src/features/catalog/routes/collection.routes.js";
import { createProductRoutes } from "./src/features/catalog/routes/product.routes.js";
import { createVariantRoutes } from "./src/features/catalog/routes/variant.routes.js";
import { createMembershipRoutes } from "./src/features/catalog/routes/membership.routes.js";
import { createImageRoutes } from "./src/features/catalog/routes/image.routes.js";
import {
  createPublicCategoryRoutes,
  createPublicProductRoutes,
  createPublicCollectionRoutes,
} from "./src/features/catalog/routes/public.routes.js";

const app = express();

const allowedOrigins = (process.env.CORS_ORIGIN ?? "http://localhost:3000")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(null, false);
      }
    },
    credentials: true,
  }),
);

app.use(express.json());

app.use("/api/auth", createAuthRoutes(prisma));
app.use("/api/cart", createCartRoutes(prisma));
app.use("/api/admin/categories", createCategoryRoutes(prisma));
app.use("/api/admin/collections", createCollectionRoutes(prisma));
app.use("/api/admin/products", createProductRoutes(prisma));
// Express 5 does not populate req.params from mount-path params, so variant
// routes declare :productId themselves and share the products mount prefix.
app.use("/api/admin/products", createVariantRoutes(prisma));
app.use("/api/admin/collections", createMembershipRoutes(prisma));
app.use("/api/admin/images", createImageRoutes(prisma));

app.use("/api/categories", createPublicCategoryRoutes(prisma));
app.use("/api/products", createPublicProductRoutes(prisma));
app.use("/api/collections", createPublicCollectionRoutes(prisma));

app.get("/health", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({ success: true, status: "ok" });
  } catch (error) {
    console.error("[health] database check failed", error);
    res.status(503).json({ success: false, status: "unavailable" });
  }
});

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
