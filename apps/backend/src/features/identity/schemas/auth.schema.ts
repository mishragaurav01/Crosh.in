import { z } from "zod";

export const otpRequestBodySchema = z.object({
  email: z.string().email("Invalid email format"),
});

export const otpVerifyBodySchema = z.object({
  email: z.string().email("Invalid email format"),
  code: z.string().length(6, "Code must be exactly 6 digits"),
});

export type OtpRequestBody = z.infer<typeof otpRequestBodySchema>;
export type OtpVerifyBody = z.infer<typeof otpVerifyBodySchema>;
