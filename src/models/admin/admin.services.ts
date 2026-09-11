"use server";

import { requireServerSession } from "@/integrations/supabase/session.server";
import { failFrom, ok, type ApiResponse, type MessageResponse } from "@/lib/api";
import { BOOKING_TABLES } from "@/models/booking/booking.constants";
import { ORDER_SELECT, ORDER_TABLES } from "@/models/order/order.constants";
import type { Role } from "@/models/auth/auth.types";
import { VENDOR_TABLES } from "@/models/vendor/vendor.constants";

import { ADMIN_TABLES, ADMIN_USER_LIMIT } from "./admin.constants";
import { setUserRoleSchema } from "./admin.schemas";
import type { AdminUser, PlatformOverview } from "./admin.types";

/**
 * Platform counters for the admin dashboard.
 *
 * Reads are RLS-gated: a non-admin session sees only its own rows and gets
 * numbers that reflect that, rather than an error. The admin-only route guard
 * is what keeps non-admins off this page in the first place.
 */
export async function getPlatformOverview(): Promise<ApiResponse<PlatformOverview>> {
  try {
    const { client } = await requireServerSession();

    const [vendors, bookings, orders] = await Promise.all([
      client.from(VENDOR_TABLES.VENDORS).select("id,status"),
      client.from(BOOKING_TABLES.BOOKINGS).select("id,total_amount"),
      client.from(ORDER_TABLES.ORDERS).select(ORDER_SELECT.TOTALS),
    ]);
    if (vendors.error) throw vendors.error;
    if (bookings.error) throw bookings.error;
    if (orders.error) throw orders.error;

    const gmvBookings = (bookings.data ?? []).reduce((n, b) => n + Number(b.total_amount ?? 0), 0);
    const gmvOrders = (orders.data ?? []).reduce((n, o) => n + Number(o.total_naira ?? 0), 0);

    return ok({
      vendorsPending: (vendors.data ?? []).filter((v) => v.status === "pending").length,
      vendorsApproved: (vendors.data ?? []).filter((v) => v.status === "approved").length,
      bookingsCount: bookings.data?.length ?? 0,
      ordersCount: orders.data?.length ?? 0,
      gmv: gmvBookings + gmvOrders,
    });
  } catch (error) {
    return failFrom(error, "Could not load the dashboard");
  }
}

/** Shape of the profile columns the users screen needs. */
interface AdminProfileRow {
  id: string;
  email: string | null;
  full_name: string | null;
  username: string | null;
  created_at: string;
}

/**
 * Every user with their roles.
 *
 * RLS is the gate: the "Admins read all profiles" policy means a non-admin
 * calling this sees only themselves rather than an error. The route guard is
 * what keeps non-admins off the screen in the first place.
 *
 * Profiles and user_roles both reference auth.users but not each other, so
 * PostgREST cannot embed one in the other — hence two reads and a join here.
 */
export async function listUsersWithRoles(): Promise<ApiResponse<AdminUser[]>> {
  try {
    const { client } = await requireServerSession();

    const [profiles, roles] = await Promise.all([
      client
        .from(ADMIN_TABLES.PROFILES)
        .select("*")
        .order("created_at", { ascending: false })
        .limit(ADMIN_USER_LIMIT),
      client.from(ADMIN_TABLES.USER_ROLES).select("user_id,role"),
    ]);
    if (profiles.error) throw profiles.error;
    if (roles.error) throw roles.error;

    const rolesByUser = new Map<string, Role[]>();
    for (const row of roles.data ?? []) {
      const list = rolesByUser.get(row.user_id) ?? [];
      list.push(row.role as Role);
      rolesByUser.set(row.user_id, list);
    }

    const rows = (profiles.data ?? []) as unknown as AdminProfileRow[];
    return ok(
      rows.map((p) => ({
        id: p.id,
        email: p.email ?? null,
        fullName: p.full_name,
        username: p.username,
        createdAt: p.created_at,
        roles: rolesByUser.get(p.id) ?? [],
      })),
    );
  } catch (error) {
    return failFrom(error, "Could not load users");
  }
}

/**
 * Grants or revokes a role for another user.
 *
 * Writes are permitted by the "Admins manage roles" policy, so a non-admin
 * caller is rejected by the database rather than by a check here. The one rule
 * this adds is refusing to let an admin drop their own admin role — that is a
 * lockout with no in-app way back, since making the first admin needs SQL.
 */
export async function setUserRole(input: unknown): Promise<ApiResponse<MessageResponse>> {
  const parsed = setUserRoleSchema.safeParse(input);
  if (!parsed.success) return failFrom(parsed.error.issues[0], "Invalid role change");

  try {
    const { client, userId } = await requireServerSession();
    const { userId: targetId, role, granted } = parsed.data;

    if (!granted && role === "admin" && targetId === userId) {
      return failFrom(null, "You can't remove your own admin role");
    }

    if (granted) {
      const { error } = await client
        .from(ADMIN_TABLES.USER_ROLES)
        .upsert({ user_id: targetId, role }, { onConflict: "user_id,role" });
      if (error) throw error;
    } else {
      const { error } = await client
        .from(ADMIN_TABLES.USER_ROLES)
        .delete()
        .eq("user_id", targetId)
        .eq("role", role);
      if (error) throw error;
    }

    // The target's own roles cookie is stale now, but it is refreshed by
    // getRoles on their next page load, so it self-heals within one request.
    return ok({ message: granted ? `Granted ${role}` : `Removed ${role}` });
  } catch (error) {
    return failFrom(error, "Could not update this user's roles");
  }
}
