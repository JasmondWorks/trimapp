import type { z } from "zod";

import type { Role } from "@/models/auth/auth.types";

import type { setUserRoleSchema } from "./admin.schemas";

export interface PlatformOverview {
  vendorsPending: number;
  vendorsApproved: number;
  bookingsCount: number;
  ordersCount: number;
  /** Gross merchandise value across bookings and product orders, in Naira. */
  gmv: number;
}

/**
 * A row on the admin users screen.
 *
 * `email` lives on profiles (mirrored from auth.users by the signup trigger)
 * so the whole screen stays inside RLS — see 20260816090000.
 */
export interface AdminUser {
  id: string;
  email: string | null;
  fullName: string | null;
  username: string | null;
  createdAt: string;
  roles: Role[];
}

export type SetUserRoleInput = z.input<typeof setUserRoleSchema>;
