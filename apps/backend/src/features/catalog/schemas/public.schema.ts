import { z } from "zod";
import { paginationQuerySchema, slugSchema } from "./common.schema.js";

export const publicProductListQuerySchema = paginationQuerySchema.extend({
  category: slugSchema.optional(),
});
