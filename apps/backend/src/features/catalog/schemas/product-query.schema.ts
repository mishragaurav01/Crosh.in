import { z } from "zod";
import { paginationQuerySchema } from "./common.schema.js";

export const productListQuerySchema = paginationQuerySchema.extend({
  categoryId: z.string().min(1).optional(),
});
