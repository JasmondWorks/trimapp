"use client";

import { Loader2, ShieldCheck } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ASSIGNABLE_ROLES } from "@/models/admin/admin.constants";
import { useAdminUsers, useSetUserRole } from "@/models/admin/admin.hooks";
import { useCurrentUser } from "@/models/auth/auth.hooks";
import type { Role } from "@/models/auth/auth.types";

export default AdminUsers;

/**
 * Grant and revoke roles.
 *
 * Until this existed the only way to create an admin was a hand-written SQL
 * insert, because the RLS policy that writes user_roles requires you to be an
 * admin already. This does not solve that bootstrap — the *first* admin still
 * needs SQL — but every one after can be made here.
 */
function AdminUsers() {
  const { users, isLoading } = useAdminUsers();
  const { setUserRole, isUpdating } = useSetUserRole();
  const { user: me } = useCurrentUser();
  const [query, setQuery] = useState("");
  const [pending, setPending] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) =>
      [u.email, u.fullName, u.username].some((v) => v?.toLowerCase().includes(q)),
    );
  }, [users, query]);

  const toggle = async (userId: string, role: Role, granted: boolean) => {
    setPending(`${userId}:${role}`);
    try {
      const { message } = await setUserRole({ userId, role, granted });
      toast.success(message);
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setPending(null);
    }
  };

  return (
    <div>
      <h1 className="font-display text-3xl mb-2">Users</h1>
      <p className="text-sm text-muted-foreground mb-6">
        Grant or revoke roles. A user with no roles is still a customer.
      </p>

      <Input
        placeholder="Search by email, name or username…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="mb-4 max-w-sm"
      />

      {isLoading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading users…
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {users.length === 0 ? "No users yet." : "No users match that search."}
        </p>
      ) : (
        <div className="space-y-2">
          {filtered.map((u) => (
            <div
              key={u.id}
              className="rounded-md border border-border p-4 flex flex-wrap items-center gap-3"
            >
              <div className="flex-1 min-w-0">
                <p className="font-medium flex items-center gap-1 truncate">
                  {u.email ?? u.username ?? u.id}
                  {u.roles.includes("admin") && (
                    <ShieldCheck className="h-3 w-3 text-primary shrink-0" />
                  )}
                  {u.id === me?.id && (
                    <Badge variant="secondary" className="ml-1 text-[10px]">
                      you
                    </Badge>
                  )}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {u.fullName ?? "No name"} · joined{" "}
                  {new Date(u.createdAt).toLocaleDateString()}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {ASSIGNABLE_ROLES.map((role) => {
                  const has = u.roles.includes(role);
                  // Removing your own admin role locks you out with no way
                  // back, so the control is disabled rather than left to fail.
                  const selfDemotion = has && role === "admin" && u.id === me?.id;
                  const busy = pending === `${u.id}:${role}`;
                  return (
                    <Button
                      key={role}
                      size="sm"
                      variant={has ? "default" : "outline"}
                      disabled={isUpdating || selfDemotion}
                      title={selfDemotion ? "You can't remove your own admin role" : undefined}
                      onClick={() => void toggle(u.id, role, !has)}
                      className="capitalize"
                    >
                      {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : role}
                    </Button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
