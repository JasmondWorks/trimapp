import type { z } from "zod";

import type { ROLES } from "./auth.constants";
import type {
  oauthTokensSchema,
  requestPasswordResetSchema,
  signInSchema,
  signUpSchema,
  updatePasswordSchema,
} from "./auth.schemas";

export type Role = (typeof ROLES)[number];

/**
 * The subset of Supabase's `User` we hand to the client. Deliberately narrow —
 * server actions serialise their return value, and the full user object drags
 * along app/user metadata we never render.
 */
export interface AuthUser {
  id: string;
  email: string | null;
  fullName: string | null;
  avatarUrl: string | null;
  createdAt: string;
}

/** What the client keeps in memory after a successful sign-in. */
export interface AuthSession {
  user: AuthUser;
  accessToken: string;
  /** Unix seconds. */
  expiresAt: number;
}

export interface RolesResult {
  roles: Role[];
  isAdmin: boolean;
  isVendor: boolean;
}

export type SignInInput = z.input<typeof signInSchema>;
export type SignUpInput = z.input<typeof signUpSchema>;
export type UpdatePasswordInput = z.input<typeof updatePasswordSchema>;
export type OAuthTokens = z.input<typeof oauthTokensSchema>;
export type RequestPasswordResetInput = z.input<typeof requestPasswordResetSchema>;
