import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { User } from "@supabase/supabase-js";

import { supabase } from "@/integrations/supabase/client";
import { ensureProfile, fetchIsAdmin, type Profile } from "./notes-data";

export function useUser() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    supabase.auth.getUser().then(({ data }) => {
      if (!active) return;
      setUser(data.user ?? null);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return { user, loading };
}

/** Memastikan baris profil ada (dipanggil setelah login) dan mengembalikannya. */
export function useMyProfile(user: User | null) {
  return useQuery<Profile>({
    queryKey: ["my-profile", user?.id],
    enabled: Boolean(user),
    queryFn: () => {
      const meta = (user?.user_metadata ?? {}) as Record<string, unknown>;
      const name = (meta["full_name"] ?? meta["name"]) as string | undefined;
      const avatar = (meta["avatar_url"] ?? meta["picture"]) as string | undefined;
      return ensureProfile(name, avatar);
    },
  });
}

export function useIsAdmin(userId: string | undefined) {
  return useQuery({
    queryKey: ["is-admin", userId],
    enabled: Boolean(userId),
    queryFn: () => fetchIsAdmin(userId!),
  });
}
