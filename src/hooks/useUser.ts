import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export function useUser() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);
  return { user, loading };
}

export function useRoles() {
  const { user, loading: userLoading } = useUser();
  const [roles, setRoles] = useState<Array<"customer" | "vendor" | "admin">>([]);
  const [rolesLoading, setRolesLoading] = useState(true);
  useEffect(() => {
    if (!user) {
      setRoles([]);
      setRolesLoading(userLoading);
      return;
    }
    setRolesLoading(true);
    supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .then(({ data }) => {
        setRoles((data ?? []).map((r) => r.role as never));
        setRolesLoading(false);
      });
  }, [user, userLoading]);
  return {
    user,
    roles,
    loading: userLoading || rolesLoading,
    isAdmin: roles.includes("admin"),
    isVendor: roles.includes("vendor"),
  };
}
