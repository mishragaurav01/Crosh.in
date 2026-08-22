"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import OtpInputGroup from "./OtpInputGroup";
import ResendCodeButton from "./ResendCodeButton";
import { verifyOtp, requestOtp, AuthApiError } from "../api/auth";
import { useAuth } from "@/lib/auth-context";

interface OtpFormProps {
  email: string;
}

export default function OtpForm({ email }: OtpFormProps) {
  const router = useRouter();
  const { setAuth } = useAuth();
  const [digits, setDigits] = useState<string[]>(Array(6).fill(""));
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expired, setExpired] = useState(false);

  const otpValue = digits.join("");

  const handleResend = useCallback(async () => {
    setDigits(Array(6).fill(""));
    setError(null);
    setExpired(false);
    try {
      await requestOtp(email);
    } catch (err) {
      if (err instanceof AuthApiError) {
        setError(err.message);
      }
    }
  }, [email]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (otpValue.length < 6) {
        setError("Please enter the full 6-digit code.");
        return;
      }
      setError(null);
      setIsSubmitting(true);

      try {
        const result = await verifyOtp(email, otpValue);
        setAuth(result.user, result.csrfToken);
        router.push(result.user.isAdmin ? "/catalog/categories" : "/");
      } catch (err) {
        if (err instanceof AuthApiError) {
          switch (err.code) {
            case "OTP_INVALID":
              setError("Incorrect code, try again.");
              setDigits(Array(6).fill(""));
              break;
            case "OTP_EXPIRED":
              setError("Code expired. Please request a new one.");
              setExpired(true);
              setDigits(Array(6).fill(""));
              break;
            case "OTP_MAX_ATTEMPTS":
              setError("Too many attempts. A new code has been sent.");
              setDigits(Array(6).fill(""));
              await requestOtp(email).catch(() => {});
              break;
            case "OTP_RATE_LIMITED":
              setError("Too many requests. Please wait before retrying.");
              setExpired(true);
              break;
            default:
              setError(err.message);
          }
        } else {
          setError("Something went wrong. Please try again.");
        }
      } finally {
        setIsSubmitting(false);
      }
    },
    [email, otpValue, setAuth, router],
  );

  return (
    <div className="max-w-[400px] mx-auto w-full">
      <header className="mb-lg">
        <h1 className="font-headline-md text-headline-md text-primary mb-sm">
          Verify Your Code
        </h1>
        <p className="font-body-md text-body-md text-on-surface-variant">
          Enter the 6-digit code we sent to{" "}
          <span className="font-medium text-on-surface">{email}</span>
        </p>
      </header>

      <form className="space-y-lg" onSubmit={handleSubmit}>
        <OtpInputGroup
          value={digits}
          onChange={(d) => {
            setDigits(d);
            setError(null);
          }}
          disabled={isSubmitting}
        />

        {error && (
          <p className="text-center font-label-md text-label-md text-error">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={otpValue.length < 6 || isSubmitting || expired}
          className="w-full bg-primary text-on-primary font-label-md text-label-md py-md rounded-full transition-all duration-300 transform active:scale-[0.98] shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? "Verifying..." : "Verify"}
        </button>
      </form>

      <div className="mt-lg">
        <ResendCodeButton cooldownSeconds={60} onResend={handleResend} />
      </div>
    </div>
  );
}
