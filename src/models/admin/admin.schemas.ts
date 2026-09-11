import { z } from "zod";

import { ASSIGNABLE_ROLES } from "./admin.constants";

export const assignableRoleSchema = z.enum(ASSIGNABLE_ROLES);

export const setUserRoleSchema = z.object({
  userId: z.string().uuid(),
  role: assignableRoleSchema,
  /** True to grant, false to revoke. */
  granted: z.boolean(),
});
