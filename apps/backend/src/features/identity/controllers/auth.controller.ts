import type { Request, Response } from "express";
import type { PrismaClient } from "db/client";
import { requestOtp } from "../services/otp-request.service.js";
import { verifyOtp } from "../services/otp-verify.service.js";
import { deleteSession } from "../services/session.service.js";
import { sendOtpEmail } from "../services/email.service.js";
import { OtpError } from "../types/otp-errors.js";
import {
  otpRequestBodySchema,
  otpVerifyBodySchema,
} from "../schemas/auth.schema.js";

const SESSION_COOKIE = "session_id";
const CSRF_COOKIE = "csrf_token";

const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: 7 * 24 * 60 * 60,
};

const CSRF_COOKIE_OPTIONS = {
  httpOnly: false,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: 7 * 24 * 60 * 60,
};

type SendEmailFn = (params: { to: string; code: string }) => Promise<void>;

export function createAuthController(
  prisma: PrismaClient,
  sendEmail: SendEmailFn = sendOtpEmail,
) {
  return {
    async requestOtpHandler(req: Request, res: Response): Promise<void> {
      const parsed = otpRequestBodySchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(422).json({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: parsed.error.issues[0]?.message ?? "Invalid input",
          },
        });
        return;
      }

      try {
        const result = await requestOtp({
          email: parsed.data.email,
          prisma,
          sendEmail,
        });

        res.status(200).json({ success: true, data: result });
      } catch (error) {
        if (error instanceof OtpError) {
          res.status(429).json({
            success: false,
            error: { code: error.code, message: error.message },
          });
          return;
        }
        console.error("[requestOtp]", error);
        res.status(500).json({
          success: false,
          error: {
            code: "INTERNAL_ERROR",
            message: "An unexpected error occurred",
          },
        });
      }
    },

    async verifyOtpHandler(req: Request, res: Response): Promise<void> {
      const parsed = otpVerifyBodySchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(422).json({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: parsed.error.issues[0]?.message ?? "Invalid input",
          },
        });
        return;
      }

      try {
        const result = await verifyOtp({
          email: parsed.data.email,
          code: parsed.data.code,
          prisma,
        });

        res.cookie(SESSION_COOKIE, result.session.sessionId, SESSION_COOKIE_OPTIONS);
        res.cookie(CSRF_COOKIE, result.session.csrfToken, CSRF_COOKIE_OPTIONS);
        res.status(200).json({
          success: true,
          data: { user: result.user, csrfToken: result.session.csrfToken },
        });
      } catch (error) {
        if (error instanceof OtpError) {
          const status =
            error.code === "OTP_RATE_LIMITED"
              ? 429
              : error.code === "OTP_MAX_ATTEMPTS"
                ? 429
                : 400;
          res.status(status).json({
            success: false,
            error: { code: error.code, message: error.message },
          });
          return;
        }
        console.error("[verifyOtp]", error);
        res.status(500).json({
          success: false,
          error: {
            code: "INTERNAL_ERROR",
            message: "An unexpected error occurred",
          },
        });
      }
    },

    async meHandler(req: Request, res: Response): Promise<void> {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: {
            code: "UNAUTHENTICATED",
            message: "Missing or invalid session",
          },
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: { user: { id: req.user.id, email: req.user.email } },
      });
    },

    async logoutHandler(req: Request, res: Response): Promise<void> {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: {
            code: "UNAUTHENTICATED",
            message: "Missing or invalid session",
          },
        });
        return;
      }

      const cookieHeader = req.headers.cookie;
      const sessionId = cookieHeader
        ? parseCookie(cookieHeader, SESSION_COOKIE)
        : undefined;

      if (sessionId) {
        try {
          await deleteSession({ sessionId, prisma });
        } catch (error) {
          console.error("[logout] deleteSession", error);
        }
      }

      res.clearCookie(SESSION_COOKIE, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
      });

      res.clearCookie(CSRF_COOKIE, {
        httpOnly: false,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
      });

      res.status(200).json({
        success: true,
        data: { message: "Logged out" },
      });
    },
  };
}

function parseCookie(header: string, name: string): string | undefined {
  const cookies = header.split(";");
  for (const cookie of cookies) {
    const parts = cookie.split("=");
    const key = parts[0];
    if (key && key.trim() === name) {
      return parts.slice(1).join("=").trim();
    }
  }
  return undefined;
}
