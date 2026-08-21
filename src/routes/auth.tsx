import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { NotebookPen, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { lovable } from "@/integrations/lovable/index";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Masuk · Catatan Studio PWK" },
      {
        name: "description",
        content:
          "Masuk dengan akun Google untuk membaca dan menulis catatan kelompok studio Perencanaan Wilayah dan Kota.",
      },
      { property: "og:title", content: "Masuk · Catatan Studio PWK" },
      {
        property: "og:description",
        content: "Masuk dengan Google untuk mengakses catatan kelompok studio PWK.",
      },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/dashboard", replace: true });
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session) navigate({ to: "/dashboard", replace: true });
    });
    return () => sub.subscription.unsubscribe();
  }, [navigate]);

  const signIn = async () => {
    setLoading(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      setLoading(false);
      toast.error("Gagal masuk dengan Google. Coba lagi ya.");
      return;
    }
    if (result.redirected) return;
    navigate({ to: "/dashboard", replace: true });
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-16">
      <div className="panel w-full max-w-md p-8 text-center">
        <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-primary/15 text-primary">
          <NotebookPen className="size-7" />
        </span>
        <h1 className="mt-5 font-display text-2xl font-semibold">Catatan Studio PWK</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Masuk dengan akun Google kelompokmu untuk melihat dan menulis catatan bersama.
        </p>
        <Button
          className="mt-6 w-full"
          size="lg"
          onClick={() => void signIn()}
          disabled={loading}
        >
          {loading ? <Loader2 className="size-4 animate-spin" /> : null}
          Masuk dengan Google
        </Button>
        <p className="mt-4 text-xs text-muted-foreground">
          Nama tampilan bisa kamu atur sendiri setelah masuk.
        </p>
      </div>
    </div>
  );
}
