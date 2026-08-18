"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/db/server";
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "@/validations/auth";
import { sendWelcomeEmail } from "@/lib/auth/notify";
import { checkRateLimit, getClientIp } from "@/lib/security/rate-limit";

export type AuthActionState = { error: string } | { success: true } | null;

const TOO_MANY_ATTEMPTS = "Too many attempts. Please try again in a few minutes.";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

function firstIssueMessage(error: { issues: { message: string }[] }) {
  return error.issues[0]?.message ?? "Invalid input";
}

export async function signUpAction(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = registerSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    mobile: formData.get("mobile"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) return { error: firstIssueMessage(parsed.error) };

  const ip = await getClientIp();
  const { allowed } = checkRateLimit(`signup:${ip}`, { limit: 5, windowMs: 60 * 60 * 1000 });
  if (!allowed) return { error: TOO_MANY_ATTEMPTS };

  const { fullName, email, mobile, password } = parsed.data;
  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName, mobile: mobile || undefined },
      emailRedirectTo: `${siteUrl}/auth/callback`,
    },
  });

  if (error) return { error: error.message };

  await sendWelcomeEmail(email, fullName);
  redirect(`/verify-email?email=${encodeURIComponent(email)}`);
}

export async function signInAction(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: firstIssueMessage(parsed.error) };

  const ip = await getClientIp();
  const { allowed } = checkRateLimit(`login:${ip}`, { limit: 10, windowMs: 15 * 60 * 1000 });
  if (!allowed) return { error: TOO_MANY_ATTEMPTS };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { error: "Invalid email or password" };

  // Admin-disabled accounts (Phase 11 "Enable/Disable Account", spec §39)
  // authenticate fine against Supabase Auth — is_active lives in our own
  // `users` row, not theirs — so it's checked and enforced here.
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = user
    ? await supabase.from("users").select("is_active").eq("id", user.id).maybeSingle()
    : { data: null };
  if (profile && !profile.is_active) {
    await supabase.auth.signOut();
    return { error: "This account has been disabled. Contact support for help." };
  }

  redirect("/account");
}

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

export async function requestPasswordResetAction(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = forgotPasswordSchema.safeParse({
    email: formData.get("email"),
  });
  if (!parsed.success) return { error: firstIssueMessage(parsed.error) };

  const ip = await getClientIp();
  const { allowed } = checkRateLimit(`reset:${ip}`, { limit: 5, windowMs: 60 * 60 * 1000 });
  if (!allowed) return { error: TOO_MANY_ATTEMPTS };

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(
    parsed.data.email,
    { redirectTo: `${siteUrl}/auth/callback?next=/reset-password` },
  );

  // Report success either way — never reveal whether an email is registered.
  if (error) return { error: "Something went wrong. Please try again." };
  return { success: true };
}

export async function updatePasswordAction(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = resetPasswordSchema.safeParse({
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) return { error: firstIssueMessage(parsed.error) };

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });

  if (error) {
    return {
      error: "Unable to update password. Please request a new reset link.",
    };
  }
  redirect("/login");
}

export async function resendVerificationEmailAction(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const email = String(formData.get("email") ?? "");
  if (!email) return { error: "Missing email address" };

  const ip = await getClientIp();
  const { allowed } = checkRateLimit(`resend:${ip}`, { limit: 5, windowMs: 60 * 60 * 1000 });
  if (!allowed) return { error: TOO_MANY_ATTEMPTS };

  const supabase = await createClient();
  const { error } = await supabase.auth.resend({
    type: "signup",
    email,
    options: { emailRedirectTo: `${siteUrl}/auth/callback` },
  });

  if (error) return { error: "Something went wrong. Please try again." };
  return { success: true };
}
