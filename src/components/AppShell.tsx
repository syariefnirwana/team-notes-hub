import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { NotebookPen, LogOut, Settings } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import type { Profile } from "@/lib/notes-data";

export function AppShell({
  profile,
  isAdmin,
  children,
}: {
  profile: Profile | undefined;
  isAdmin: boolean;
  children: React.ReactNode;
}) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const signOut = async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-border bg-card/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3">
          <Link to="/dashboard" className="flex items-center gap-2">
            <span className="flex size-9 items-center justify-center rounded-xl bg-primary/15 text-primary">
              <NotebookPen className="size-5" />
            </span>
            <span className="font-display text-lg leading-tight font-semibold">
              Catatan Studio
              <span className="block text-[11px] font-normal text-muted-foreground">
                PWK · Kelompok Studio
              </span>
            </span>
          </Link>

          <div className="ml-auto flex items-center gap-2">
            {isAdmin ? (
              <Button asChild variant="ghost" size="sm" className="gap-1.5">
                <Link to="/settings">
                  <Settings className="size-4" />
                  <span className="hidden sm:inline">Pengaturan</span>
                </Link>
              </Button>
            ) : null}
            <Link to="/profil" className="flex items-center gap-2 rounded-full pl-1">
              <Avatar className="size-8 border border-border">
                {profile?.avatar_url ? <AvatarImage src={profile.avatar_url} alt="" /> : null}
                <AvatarFallback className="text-xs">
                  {(profile?.display_name ?? "?").slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="hidden text-sm font-medium sm:inline">{profile?.display_name}</span>
            </Link>
            <Button variant="ghost" size="icon" onClick={() => void signOut()} aria-label="Keluar">
              <LogOut className="size-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
    </div>
  );
}
