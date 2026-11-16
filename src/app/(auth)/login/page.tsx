"use client";

import { AuthForm } from "@/components/auth/auth-form";

/** Log in or sign up: the same form as /signup (see components/auth/auth-form.tsx). */
export default function LoginPage() {
  return <AuthForm variant="login" />;
}
