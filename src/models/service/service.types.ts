import type { z } from "zod";

import type { Database } from "@/integrations/supabase/types";

import type { createServiceSchema, updateServiceSchema } from "./service.schemas";

export type Service = Database["public"]["Tables"]["services"]["Row"];

/** The `SERVICE_SELECT.PUBLIC` projection, as rendered on a vendor page. */
export type ServiceListItem = Pick<
  Service,
  "id" | "name" | "price" | "duration_minutes" | "description" | "category"
>;

export type CreateServiceInput = z.input<typeof createServiceSchema>;
export type UpdateServiceInput = z.input<typeof updateServiceSchema>;
