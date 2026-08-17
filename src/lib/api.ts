/**
 * Shared API contract types.
 *
 * Every server action in `src/models/<domain>/<domain>.services.ts` returns an
 * `ApiResponse<T>` rather than throwing, because an exception crossing the
 * server-action boundary in production is redacted to an opaque digest. The
 * hooks layer unwraps the envelope and re-throws so React Query still sees a
 * normal rejected promise.
 */

/** Columns every Supabase table in this project carries. */
export interface BaseEntity {
  id: string;
  created_at: string;
  updated_at?: string | null;
}

/** Mutations that have nothing meaningful to return. */
export interface MessageResponse {
  message: string;
}

export interface ApiSuccess<T> {
  success: true;
  data: T;
  message?: string;
}

export interface ApiFailure {
  success: false;
  message: string;
  /** Supabase/PostgREST error code when there is one, e.g. "23505". */
  code?: string;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

export interface PaginationParams {
  page?: number;
  pageSize?: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
}

export const DEFAULT_PAGE = 1;
export const DEFAULT_PAGE_SIZE = 20;

export function ok<T>(data: T, message?: string): ApiSuccess<T> {
  return { success: true, data, ...(message ? { message } : {}) };
}

export function fail(message: string, code?: string): ApiFailure {
  return { success: false, message, ...(code ? { code } : {}) };
}

/**
 * Normalises anything thrown inside a server action into an `ApiFailure`.
 * Supabase surfaces `PostgrestError` (message + code), auth errors surface as
 * `AuthError`, and anything else falls back to a generic message so we never
 * leak an internal stack trace to the browser.
 */
export function failFrom(error: unknown, fallback = "Something went wrong"): ApiFailure {
  if (error && typeof error === "object") {
    const e = error as { message?: unknown; code?: unknown };
    if (typeof e.message === "string" && e.message.length > 0) {
      return fail(e.message, typeof e.code === "string" ? e.code : undefined);
    }
  }
  return fail(fallback);
}

/**
 * Unwraps an action envelope for React Query — throws on failure.
 *
 * Takes the promise directly so call sites read as
 * `queryFn: () => unwrap(getVendors())`.
 */
export async function unwrap<T>(response: ApiResponse<T> | Promise<ApiResponse<T>>): Promise<T> {
  const settled = await response;
  if (!settled.success) throw new ApiError(settled.message, settled.code);
  return settled.data;
}

export class ApiError extends Error {
  readonly code?: string;

  constructor(message: string, code?: string) {
    super(message);
    this.name = "ApiError";
    this.code = code;
  }
}

/** Converts a Supabase `{ data, count }` range query into a paginated envelope. */
export function toPaginated<T>(
  items: T[],
  total: number,
  { page = DEFAULT_PAGE, pageSize = DEFAULT_PAGE_SIZE }: PaginationParams = {},
): PaginatedResponse<T> {
  const totalPages = pageSize > 0 ? Math.ceil(total / pageSize) : 0;
  return {
    items,
    page,
    pageSize,
    total,
    totalPages,
    hasNextPage: page < totalPages,
  };
}

/** Inclusive `[from, to]` row range for `.range()`. */
export function toRange({ page = DEFAULT_PAGE, pageSize = DEFAULT_PAGE_SIZE }: PaginationParams = {}): [
  number,
  number,
] {
  const from = (page - 1) * pageSize;
  return [from, from + pageSize - 1];
}
