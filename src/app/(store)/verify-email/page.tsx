import Link from "next/link";
import { AuthCard } from "@/components/store/auth-card";
import { ResendVerificationForm } from "./resend-verification-form";

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const { email } = await searchParams;

  return (
    <AuthCard title="Verify your email">
      <p className="text-sm text-muted-foreground">
        We&apos;ve sent a verification link
        {email ? ` to ${email}` : ""}. Click the link in that email to activate
        your account.
      </p>
      {email ? (
        <div className="mt-6">
          <ResendVerificationForm email={email} />
        </div>
      ) : null}
      <Link
        href="/login"
        className="mt-6 inline-block text-sm text-primary underline-offset-4 hover:underline"
      >
        Back to log in
      </Link>
    </AuthCard>
  );
}
