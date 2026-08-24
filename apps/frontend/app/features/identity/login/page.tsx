import AuthLayout from "../components/AuthLayout";
import LoginClient from "./LoginClient";

export const metadata = {
  title: "Sign In | Crosh.in",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; reason?: string }>;
}) {
  const params = await searchParams;

  return (
    <AuthLayout>
      <LoginClient next={params.next} reason={params.reason} />
    </AuthLayout>
  );
}
