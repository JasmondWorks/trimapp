"use server";

import { getPublicClient, requireServerSession } from "@/integrations/supabase/session.server";
import { failFrom, ok, type ApiResponse, type MessageResponse } from "@/lib/api";
import { requireMyVendorId, resolveMyVendorId } from "@/models/vendor/vendor.server";

import { SERVICE_COLUMNS, SERVICE_SELECT, SERVICE_TABLES } from "./service.constants";
import { createServiceSchema, serviceIdSchema, updateServiceSchema } from "./service.schemas";
import type { Service, ServiceListItem } from "./service.types";

/** Public: the active services shown on a vendor's profile. */
export async function listVendorServices(vendorId: string): Promise<ApiResponse<ServiceListItem[]>> {
  try {
    const { data, error } = await getPublicClient()
      .from(SERVICE_TABLES.SERVICES)
      .select(SERVICE_SELECT.PUBLIC)
      .eq(SERVICE_COLUMNS.VENDOR_ID, vendorId)
      .eq(SERVICE_COLUMNS.IS_ACTIVE, true);
    if (error) throw error;
    return ok((data ?? []) as ServiceListItem[]);
  } catch (error) {
    return failFrom(error, "Could not load services");
  }
}

/** Every service on the caller's own vendor account, active or not. */
export async function listMyServices(): Promise<ApiResponse<Service[]>> {
  try {
    const { client, userId } = await requireServerSession();
    const vendorId = await resolveMyVendorId(client, userId);
    if (!vendorId) return ok([]);

    const { data, error } = await client
      .from(SERVICE_TABLES.SERVICES)
      .select(SERVICE_SELECT.FULL)
      .eq(SERVICE_COLUMNS.VENDOR_ID, vendorId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return ok(data ?? []);
  } catch (error) {
    return failFrom(error, "Could not load your services");
  }
}

export async function createService(input: unknown): Promise<ApiResponse<Service>> {
  const parsed = createServiceSchema.safeParse(input);
  if (!parsed.success) return failFrom(parsed.error.issues[0], "Check the form and try again");

  try {
    const { client, userId } = await requireServerSession();
    const vendorId = await requireMyVendorId(client, userId);

    const { data, error } = await client
      .from(SERVICE_TABLES.SERVICES)
      .insert({ ...parsed.data, vendor_id: vendorId })
      .select(SERVICE_SELECT.FULL)
      .single();
    if (error) throw error;
    return ok(data, "Service added");
  } catch (error) {
    return failFrom(error, "Could not add this service");
  }
}

export async function updateService(input: unknown): Promise<ApiResponse<Service>> {
  const parsed = updateServiceSchema.safeParse(input);
  if (!parsed.success) return failFrom(parsed.error.issues[0], "Check the form and try again");

  try {
    const { client, userId } = await requireServerSession();
    const vendorId = await requireMyVendorId(client, userId);

    const { id, ...changes } = parsed.data;
    const { data, error } = await client
      .from(SERVICE_TABLES.SERVICES)
      .update(changes)
      .eq(SERVICE_COLUMNS.ID, id)
      // Belt-and-braces alongside RLS: you can only touch your own rows.
      .eq(SERVICE_COLUMNS.VENDOR_ID, vendorId)
      .select(SERVICE_SELECT.FULL)
      .single();
    if (error) throw error;
    return ok(data, "Service updated");
  } catch (error) {
    return failFrom(error, "Could not update this service");
  }
}

export async function deleteService(id: unknown): Promise<ApiResponse<MessageResponse>> {
  const parsed = serviceIdSchema.safeParse(id);
  if (!parsed.success) return failFrom(parsed.error.issues[0], "Invalid service");

  try {
    const { client, userId } = await requireServerSession();
    const vendorId = await requireMyVendorId(client, userId);

    const { error } = await client
      .from(SERVICE_TABLES.SERVICES)
      .delete()
      .eq(SERVICE_COLUMNS.ID, parsed.data)
      .eq(SERVICE_COLUMNS.VENDOR_ID, vendorId);
    if (error) throw error;
    return ok({ message: "Service removed" });
  } catch (error) {
    return failFrom(error, "Could not remove this service");
  }
}
