"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AuthLayout from "../components/AuthLayout";
import AuthForm from "../components/AuthForm";
import { requestOtp, AuthApiError } from "../api/auth";

export default function SignupPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(value: string, method: "email" | "phone") {
    setError(null);
    try {
      await requestOtp(value);
      router.push(`/features/identity/otp?email=${encodeURIComponent(value)}`);
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

  return (
    <AuthLayout>
      {error && (
        <div className="mb-md p-sm rounded-lg bg-error-container text-on-error-container font-label-md text-label-md text-center">
          {error}
        </div>
      )}
      <AuthForm
        heading="Join Our Garden"
        subtext="Step into a world of slow fashion and handcrafted warmth."
        footerText="Already have an account?"
        footerLinkLabel="Sign In"
        footerLinkHref="/features/identity/login"
        onSubmit={handleSubmit}
      />
    </AuthLayout>
  );
}
