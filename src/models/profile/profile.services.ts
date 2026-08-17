"use server";

import { getServerSession, requireServerSession } from "@/integrations/supabase/session.server";
import { failFrom, ok, type ApiResponse } from "@/lib/api";

import { PROFILE_COLUMNS, PROFILE_SELECT, PROFILE_TABLES } from "./profile.constants";
import { updateProfileSchema } from "./profile.schemas";
import type { MyProfile, Profile } from "./profile.types";

export async function getMyProfile(): Promise<ApiResponse<MyProfile>> {
  try {
    const session = await getServerSession();
    if (!session) return ok({ profile: null, email: null });

    const { data, error } = await session.client
      .from(PROFILE_TABLES.PROFILES)
      .select(PROFILE_SELECT.FULL)
      .eq(PROFILE_COLUMNS.ID, session.session.user.id)
      .maybeSingle();
    if (error) throw error;
    return ok({ profile: data, email: session.session.user.email ?? null });
  } catch (error) {
    return failFrom(error, "Could not load your profile");
  }
}

/**
 * Upsert rather than update: the profile row is created by a trigger on
 * sign-up, but an account that predates the trigger has none.
 */
export async function updateMyProfile(input: unknown): Promise<ApiResponse<Profile>> {
  const parsed = updateProfileSchema.safeParse(input);
  if (!parsed.success) return failFrom(parsed.error.issues[0], "Check the form and try again");

  try {
    const { client, userId } = await requireServerSession();
    const { data, error } = await client
      .from(PROFILE_TABLES.PROFILES)
      .upsert({ ...parsed.data, id: userId })
      .select(PROFILE_SELECT.FULL)
      .single();
    if (error) throw error;
    return ok(data, "Profile saved");
  } catch (error) {
    return failFrom(error, "Could not save your profile");
  }
}
