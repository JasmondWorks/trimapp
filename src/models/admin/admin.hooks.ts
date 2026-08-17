"use client";

import { useQuery } from "@tanstack/react-query";

import { unwrap } from "@/lib/api";

import { ADMIN_OVERVIEW_STALE_TIME, ADMIN_QUERY_KEYS } from "./admin.constants";
import { getPlatformOverview } from "./admin.services";

export function usePlatformOverview() {
  const query = useQuery({
    queryKey: ADMIN_QUERY_KEYS.overview(),
    queryFn: () => unwrap(getPlatformOverview()),
    staleTime: ADMIN_OVERVIEW_STALE_TIME,
  });

  return { overview: query.data ?? null, isLoading: query.isPending };
}
