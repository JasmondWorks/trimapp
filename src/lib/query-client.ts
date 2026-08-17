import { QueryClient } from "@tanstack/react-query";

import { ApiError } from "./api";

/** Queries stay fresh for a minute — long enough to survive route changes. */
export const DEFAULT_STALE_TIME = 60_000;
export const DEFAULT_QUERY_RETRIES = 1;

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: DEFAULT_STALE_TIME,
        refetchOnWindowFocus: false,
        retry: (failureCount, error) => {
          // A rejected action is a considered answer from the server, not a
          // flake — retrying just delays the error the user needs to see.
          if (error instanceof ApiError) return false;
          return failureCount < DEFAULT_QUERY_RETRIES;
        },
      },
      mutations: { retry: false },
    },
  });
}
