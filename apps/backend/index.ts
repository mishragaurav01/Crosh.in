import express, { type ErrorRequestHandler } from "express";
import { prisma } from "db/client";
import { createAuthRoutes } from "./src/features/identity/routes/auth.routes.js";
import { createCategoryRoutes } from "./src/features/catalog/routes/category.routes.js";
import { createCollectionRoutes } from "./src/features/catalog/routes/collection.routes.js";
import { createProductRoutes } from "./src/features/catalog/routes/product.routes.js";
import { createVariantRoutes } from "./src/features/catalog/routes/variant.routes.js";
import { createMembershipRoutes } from "./src/features/catalog/routes/membership.routes.js";

const app = express();

app.use(express.json());

app.use("/api/auth", createAuthRoutes(prisma));
app.use("/api/admin/categories", createCategoryRoutes(prisma));
app.use("/api/admin/collections", createCollectionRoutes(prisma));
app.use("/api/admin/products", createProductRoutes(prisma));
app.use("/api/admin/products/:productId/variants", createVariantRoutes(prisma));
app.use("/api/admin/collections", createMembershipRoutes(prisma));

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
