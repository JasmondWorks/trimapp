import type { z } from "zod";

import type { Database } from "@/integrations/supabase/types";

import type { updateProfileSchema } from "./profile.schemas";

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];

/** The account page shows the auth email alongside the profile row. */
export interface MyProfile {
  profile: Profile | null;
  email: string | null;
}

export type UpdateProfileInput = z.input<typeof updateProfileSchema>;
