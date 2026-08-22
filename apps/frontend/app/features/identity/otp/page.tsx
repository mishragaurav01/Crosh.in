import AuthLayout from "../components/AuthLayout";
import OtpForm from "../components/OtpForm";

export const metadata = {
  title: "Verify Code | Crosh.in",
  description: "Enter your one-time verification code.",
};

export default function OtpPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  return (
    <AuthLayout captionText="Security is the foundation of trust.">
      <OtpPageInner searchParams={searchParams} />
    </AuthLayout>
  );
}

async function OtpPageInner({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const params = await searchParams;
  const email = params.email ?? "";

  if (!email) {
    return (
      <div className="max-w-[400px] mx-auto w-full text-center">
        <p className="font-body-md text-body-md text-on-surface-variant">
          No email provided.{" "}
          <a
            href="/features/identity/login"
            className="text-primary hover:underline underline-offset-4"
          >
            Go back to login
          </a>
        </p>
      </div>
    );
  }

  return <OtpForm email={email} />;
}
