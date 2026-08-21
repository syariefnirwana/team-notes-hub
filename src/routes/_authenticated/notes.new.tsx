import { useState } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { RichEditor } from "@/components/RichEditor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createNote, uploadNoteImage } from "@/lib/notes-data";
import { sanitizeNoteHtml } from "@/lib/sanitize";
import { useIsAdmin, useMyProfile, useUser } from "@/lib/use-session";

export const Route = createFileRoute("/_authenticated/notes/new")({
  head: () => ({
    meta: [
      { title: "Catatan Baru · Catatan Studio PWK" },
      {
        name: "description",
        content:
          "Tulis catatan baru kelompok studio PWK dengan format teks, warna, stabilo, dan gambar.",
      },
      { property: "og:title", content: "Catatan Baru · Catatan Studio PWK" },
      {
        property: "og:description",
        content: "Tulis catatan baru kelompok studio PWK lengkap dengan format dan gambar.",
      },
    ],
  }),
  component: NewNotePage,
});

function NewNotePage() {
  const { user } = useUser();
  const { data: profile } = useMyProfile(user);
  const { data: isAdmin } = useIsAdmin(user?.id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!user) return;
    if (!title.trim()) {
      toast.error("Judul catatan belum diisi.");
      return;
    }
    setSaving(true);
    try {
      const note = await createNote({
        title: title.trim(),
        content: sanitizeNoteHtml(content),
        userId: user.id,
      });
      await queryClient.invalidateQueries({ queryKey: ["notes"] });
      toast.success("Catatan tersimpan.");
      navigate({ to: "/notes/$id", params: { id: note.id } });
    } catch {
      toast.error("Gagal menyimpan catatan.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppShell profile={profile} isAdmin={Boolean(isAdmin)}>
      <Button asChild variant="ghost" size="sm" className="gap-1.5">
        <Link to="/dashboard">
          <ArrowLeft className="size-4" />
          Kembali
        </Link>
      </Button>

      <h1 className="mt-4 font-display text-3xl font-semibold">Catatan Baru</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Tercatat sebagai <span className="font-medium text-foreground">{profile?.display_name}</span>
      </p>

      <div className="mt-6 space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="title">Judul catatan</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Misal: Rapat koordinasi survei lapangan"
          />
        </div>

        <div className="space-y-1.5">
          <Label>Isi catatan</Label>
          <RichEditor
            value=""
            onChange={setContent}
            authorName={profile?.display_name ?? "Anggota"}
            onUploadImage={(file) => uploadNoteImage(file, user!.id)}
          />
        </div>

        <div className="flex justify-end">
          <Button onClick={() => void save()} disabled={saving} size="lg" className="gap-2">
            {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
            Simpan catatan
          </Button>
        </div>
      </div>
    </AppShell>
  );
}
