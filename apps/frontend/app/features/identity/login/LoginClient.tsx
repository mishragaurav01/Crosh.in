"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AuthForm from "../components/AuthForm";
import { requestOtp, AuthApiError } from "../api/auth";

interface LoginClientProps {
  next?: string;
  reason?: string;
}

export default function LoginClient({ next, reason }: LoginClientProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(value: string) {
    setError(null);
    try {
      await requestOtp(value);
      // Navigate to OTP screen, passing the email as a query param
      let otpUrl = `/features/identity/otp?email=${encodeURIComponent(value)}`;
      if (next) {
        otpUrl += `&next=${encodeURIComponent(next)}`;
      }
      router.push(otpUrl);
    } catch (err) {
      if (err instanceof AuthApiError) {
        if (err.code === "OTP_RATE_LIMITED") {
          setError("Too many requests. Please wait a moment and try again.");
        } else {
          setError(err.message);
        }
      } else {
        setError("Something went wrong. Please try again.");
      }
    }
  }

  const sessionExpired = reason === "expired";

  return (
    <>
      {sessionExpired && (
        <div className="mb-md p-sm rounded-lg bg-error-container text-on-error-container font-label-md text-label-md text-center">
          Your session has expired. Please sign in again.
        </div>
      )}
      {error && (
        <div className="mb-md p-sm rounded-lg bg-error-container text-on-error-container font-label-md text-label-md text-center">
          {error}
        </div>
      )}
      <AuthForm
        heading="Welcome Back"
        subtext="Sign in to your account to continue your journey."
        footerText="Don't have an account?"
        footerLinkLabel="Join our community"
        footerLinkHref="/features/identity/signup"
        onSubmit={handleSubmit}
      />
    </>
  );
}
