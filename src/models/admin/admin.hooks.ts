"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { unwrap } from "@/lib/api";
import { emptyList } from "@/lib/empty";
import { AUTH_QUERY_KEYS } from "@/models/auth/auth.constants";

import { ADMIN_OVERVIEW_STALE_TIME, ADMIN_QUERY_KEYS } from "./admin.constants";
import { getPlatformOverview, listUsersWithRoles, setUserRole } from "./admin.services";
import type { SetUserRoleInput } from "./admin.types";

export function usePlatformOverview() {
  const query = useQuery({
    queryKey: ADMIN_QUERY_KEYS.overview(),
    queryFn: () => unwrap(getPlatformOverview()),
    staleTime: ADMIN_OVERVIEW_STALE_TIME,
  });

  return { overview: query.data ?? null, isLoading: query.isPending };
}

export function useAdminUsers() {
  const query = useQuery({
    queryKey: ADMIN_QUERY_KEYS.users(),
    queryFn: () => unwrap(listUsersWithRoles()),
  });

  return { users: query.data ?? emptyList(), isLoading: query.isPending };
}

export function useSetUserRole() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (input: SetUserRoleInput) => unwrap(setUserRole(input)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.users() });
      // An admin changing their own roles needs their own view refreshed too.
      queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEYS.roles() });
    },
  });

  return { setUserRole: mutation.mutateAsync, isUpdating: mutation.isPending };
}
