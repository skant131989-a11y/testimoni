"use client";

import { AuthForm } from "@/components/auth/auth-form";

/** Sign up or log in: the same form as /login (see components/auth/auth-form.tsx). */
export default function SignupPage() {
  return <AuthForm variant="signup" />;
}
