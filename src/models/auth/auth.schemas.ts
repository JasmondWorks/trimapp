import { z } from "zod";

import { PASSWORD_MIN_LENGTH } from "./auth.constants";

const email = z.string().min(1, "Email is required").email("Enter a valid email address");
const password = z
  .string()
  .min(PASSWORD_MIN_LENGTH, `Password must be at least ${PASSWORD_MIN_LENGTH} characters`);

export const signInSchema = z.object({
  email,
  // Sign-in only checks presence — length rules belong to sign-up, and
  // enforcing them here would lock out accounts created before the rule.
  password: z.string().min(1, "Password is required"),
});

export const signUpSchema = z.object({
  fullName: z.string().min(2, "Tell us your name"),
  email,
  password,
  emailRedirectTo: z.string().url().optional(),
});

export const updatePasswordSchema = z
  .object({
    password,
    confirmPassword: z.string(),
  })
  .refine((v) => v.password === v.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

/**
 * Tokens handed back by the Lovable OAuth broker.
 *
 * They arrive in the browser, but they are never stored there — they go
 * straight to `completeOAuthSignIn`, which puts the refresh token in an
 * httpOnly cookie and returns only the access token for in-memory use.
 */
export const oauthTokensSchema = z.object({
  access_token: z.string().min(1),
  refresh_token: z.string().min(1),
});

export const requestPasswordResetSchema = z.object({
  email,
  /** Where the emailed link should land. */
  redirectTo: z.string().url().optional(),
});
