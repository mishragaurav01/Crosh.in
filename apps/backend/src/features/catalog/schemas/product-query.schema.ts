import { z } from "zod";
import { paginationQuerySchema } from "./common.schema.js";
import { productStatusSchema } from "./product.schema.js";

export const productListQuerySchema = paginationQuerySchema.extend({
  categoryId: z.string().min(1).optional(),
  status: productStatusSchema.optional(),
});
