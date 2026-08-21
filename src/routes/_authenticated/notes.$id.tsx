import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, History, Loader2, PenLine, Save, Trash2, X } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { NoteContent } from "@/components/NoteContent";
import { RichEditor } from "@/components/RichEditor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  deleteNote,
  fetchNote,
  fetchProfiles,
  fetchRevisions,
  updateNote,
  uploadNoteImage,
} from "@/lib/notes-data";
import { sanitizeNoteHtml } from "@/lib/sanitize";
import { useIsAdmin, useMyProfile, useUser } from "@/lib/use-session";
import { formatDateTime } from "@/lib/dates";

export const Route = createFileRoute("/_authenticated/notes/$id")({
  head: () => ({
    meta: [
      { title: "Detail Catatan · Catatan Studio PWK" },
      {
        name: "description",
        content:
          "Baca catatan kelompok studio PWK, lihat siapa penulis dan penyuntingnya, serta riwayat setiap perubahan.",
      },
      { property: "og:title", content: "Detail Catatan · Catatan Studio PWK" },
      {
        property: "og:description",
        content: "Detail catatan kelompok studio PWK beserta riwayat perubahannya.",
      },
    ],
  }),
  component: NoteDetailPage,
});

function NoteDetailPage() {
  const { id } = Route.useParams();
  const { user } = useUser();
  const { data: profile } = useMyProfile(user);
  const { data: isAdmin } = useIsAdmin(user?.id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const noteQuery = useQuery({ queryKey: ["note", id], queryFn: () => fetchNote(id) });
  const revisionsQuery = useQuery({
    queryKey: ["revisions", id],
    queryFn: () => fetchRevisions(id),
  });
  const profilesQuery = useQuery({ queryKey: ["profiles"], queryFn: fetchProfiles });

  const note = noteQuery.data;
  const nameOf = (uid: string | null) =>
    profilesQuery.data?.find((p) => p.id === uid)?.display_name ?? "Anggota";

  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [summary, setSummary] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (note && !editing) {
      setTitle(note.title);
      setContent(note.content);
    }
  }, [note, editing]);

  const save = async () => {
    if (!note || !user) return;
    setSaving(true);
    try {
      await updateNote({
        note,
        title: title.trim() || note.title,
        content: sanitizeNoteHtml(content),
        userId: user.id,
        summary: summary.trim(),
      });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["note", id] }),
        queryClient.invalidateQueries({ queryKey: ["revisions", id] }),
        queryClient.invalidateQueries({ queryKey: ["notes"] }),
      ]);
      setSummary("");
      setEditing(false);
      toast.success("Perubahan tersimpan dan tercatat di riwayat.");
    } catch {
      toast.error("Gagal menyimpan perubahan.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    try {
      await deleteNote(id);
      await queryClient.invalidateQueries({ queryKey: ["notes"] });
      toast.success("Catatan dihapus.");
      navigate({ to: "/dashboard", replace: true });
    } catch {
      toast.error("Hanya pembuat catatan atau admin yang dapat menghapus.");
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

      {noteQuery.isLoading ? (
        <Skeleton className="mt-6 h-64 w-full rounded-2xl" />
      ) : !note ? (
        <div className="panel mt-6 p-10 text-center">
          <p className="font-display text-lg font-semibold">Catatan tidak ditemukan</p>
        </div>
      ) : (
        <>
          <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="font-display text-3xl leading-tight font-semibold">{note.title}</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Dicatat oleh{" "}
                <span className="font-medium text-foreground">{nameOf(note.created_by)}</span> ·{" "}
                {formatDateTime(note.created_at)}
              </p>
              {note.updated_at !== note.created_at ? (
                <p className="mt-1 flex items-center gap-1.5 text-sm text-primary">
                  <PenLine className="size-3.5" />
                  Terakhir disunting {formatDateTime(note.updated_at)} oleh{" "}
                  {nameOf(note.last_edited_by)}
                </p>
              ) : null}
            </div>
            <div className="flex gap-2">
              {editing ? (
                <Button variant="ghost" className="gap-1.5" onClick={() => setEditing(false)}>
                  <X className="size-4" />
                  Batal
                </Button>
              ) : (
                <Button className="gap-1.5" onClick={() => setEditing(true)}>
                  <PenLine className="size-4" />
                  Sunting
                </Button>
              )}
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="icon" aria-label="Hapus catatan">
                    <Trash2 className="size-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Hapus catatan ini?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Catatan beserta riwayat perubahannya akan hilang permanen.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Batal</AlertDialogCancel>
                    <AlertDialogAction onClick={() => void remove()}>Hapus</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>

          {editing ? (
            <div className="mt-6 space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="title">Judul</Label>
                <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Isi catatan</Label>
                <RichEditor
                  key={note.id}
                  value={note.content}
                  onChange={setContent}
                  authorName={profile?.display_name ?? "Anggota"}
                  onUploadImage={(file) => uploadNoteImage(file, user!.id)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="summary">Ringkasan perubahan (opsional)</Label>
                <Input
                  id="summary"
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  placeholder="Misal: menambahkan hasil diskusi poin 3"
                />
              </div>
              <div className="flex justify-end">
                <Button onClick={() => void save()} disabled={saving} size="lg" className="gap-2">
                  {saving ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Save className="size-4" />
                  )}
                  Simpan perubahan
                </Button>
              </div>
            </div>
          ) : (
            <div className="panel mt-6 p-6">
              <NoteContent html={note.content} className="text-[15px]" />
            </div>
          )}

          <section className="mt-10">
            <div className="mb-3 flex items-center gap-2">
              <History className="size-4 text-primary" />
              <h2 className="font-display text-lg font-semibold">Riwayat Perubahan</h2>
              <Badge variant="secondary">{revisionsQuery.data?.length ?? 0} versi</Badge>
            </div>
            {revisionsQuery.isLoading ? (
              <Skeleton className="h-24 w-full rounded-2xl" />
            ) : (revisionsQuery.data ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">Belum ada riwayat perubahan.</p>
            ) : (
              <ol className="space-y-3">
                {(revisionsQuery.data ?? []).map((rev) => (
                  <li key={rev.id} className="panel p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={rev.action === "created" ? "default" : "secondary"}>
                        {rev.action === "created" ? "Dibuat" : "Diperbarui"}
                      </Badge>
                      <span className="text-sm font-medium">{nameOf(rev.editor_id)}</span>
                      <span className="text-xs text-muted-foreground">
                        {formatDateTime(rev.created_at)}
                      </span>
                    </div>
                    <p className="mt-2 text-sm">{rev.summary ?? "Tanpa ringkasan"}</p>
                    <details className="mt-2">
                      <summary className="cursor-pointer text-xs text-primary">
                        Lihat versi ini
                      </summary>
                      <div className="mt-2 rounded-xl border border-border bg-secondary/30 p-3">
                        <p className="text-xs font-medium">{rev.title}</p>
                        <NoteContent html={rev.content} className="mt-2 text-xs" />
                      </div>
                    </details>
                  </li>
                ))}
              </ol>
            )}
          </section>
        </>
      )}
    </AppShell>
  );
}
