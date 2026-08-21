import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Plus, Clock, PenLine, Users } from "lucide-react";

import { AppShell } from "@/components/AppShell";
import { NoteContent } from "@/components/NoteContent";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { fetchNotes, fetchProfiles, ROLE_LABEL, type Note, type Profile } from "@/lib/notes-data";
import { useIsAdmin, useMyProfile, useUser } from "@/lib/use-session";
import { formatDateLong, formatDateTime, groupByDay } from "@/lib/dates";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Beranda Catatan · Catatan Studio PWK" },
      {
        name: "description",
        content:
          "Semua catatan kelompok studio PWK dikelompokkan per tanggal, lengkap dengan penulis dan penyunting terakhir.",
      },
      { property: "og:title", content: "Beranda Catatan · Catatan Studio PWK" },
      {
        property: "og:description",
        content: "Catatan kelompok studio PWK per tanggal, lengkap dengan penulis dan penyunting.",
      },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { user } = useUser();
  const { data: profile } = useMyProfile(user);
  const { data: isAdmin } = useIsAdmin(user?.id);

  const notesQuery = useQuery({ queryKey: ["notes"], queryFn: fetchNotes });
  const profilesQuery = useQuery({ queryKey: ["profiles"], queryFn: fetchProfiles });

  const nameOf = (id: string | null) =>
    profilesQuery.data?.find((p) => p.id === id)?.display_name ?? "Anggota";

  const groups = groupByDay(notesQuery.data ?? []);

  return (
    <AppShell profile={profile} isAdmin={Boolean(isAdmin)}>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold">Catatan Kelompok</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Semua catatan penting kelompok studio, tercatat siapa penulis dan penyuntingnya.
          </p>
        </div>
        <Button asChild size="lg" className="gap-2">
          <Link to="/notes/new">
            <Plus className="size-4" />
            Catatan baru
          </Link>
        </Button>
      </div>

      <MemberStrip profiles={profilesQuery.data} loading={profilesQuery.isLoading} />

      <div className="mt-10 space-y-10">
        {notesQuery.isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-28 w-full rounded-2xl" />
            <Skeleton className="h-28 w-full rounded-2xl" />
          </div>
        ) : groups.length === 0 ? (
          <div className="panel p-10 text-center">
            <p className="font-display text-lg font-semibold">Belum ada catatan</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Mulai dengan membuat catatan pertama rapat kelompok.
            </p>
            <Button asChild className="mt-5">
              <Link to="/notes/new">Buat catatan pertama</Link>
            </Button>
          </div>
        ) : (
          groups.map(([day, notes]) => (
            <section key={day}>
              <div className="mb-3 flex items-center gap-3">
                <h2 className="font-display text-lg font-semibold">{formatDateLong(day)}</h2>
                <span className="h-px flex-1 bg-border" />
                <Badge variant="secondary">{notes.length} catatan</Badge>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {notes.map((note) => (
                  <NoteCard
                    key={note.id}
                    note={note}
                    authorName={nameOf(note.created_by)}
                    editorName={nameOf(note.last_edited_by)}
                  />
                ))}
              </div>
            </section>
          ))
        )}
      </div>
    </AppShell>
  );
}

function NoteCard({
  note,
  authorName,
  editorName,
}: {
  note: Note;
  authorName: string;
  editorName: string;
}) {
  const edited = note.updated_at !== note.created_at;
  return (
    <Link to="/notes/$id" params={{ id: note.id }} className="panel panel-hover block p-5">
      <h3 className="font-display text-lg leading-snug font-semibold">{note.title}</h3>
      <p className="mt-1 text-xs text-muted-foreground">
        Dicatat oleh <span className="font-medium text-foreground">{authorName}</span> ·{" "}
        {formatDateTime(note.created_at)}
      </p>
      <div className="mt-3 max-h-24 overflow-hidden">
        <NoteContent html={note.content} className="text-muted-foreground" />
      </div>
      {edited ? (
        <p className="mt-3 flex items-center gap-1.5 text-xs text-primary">
          <PenLine className="size-3.5" />
          Diperbarui {formatDateTime(note.updated_at)} oleh {editorName}
        </p>
      ) : (
        <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
          <Clock className="size-3.5" />
          Belum pernah disunting
        </p>
      )}
    </Link>
  );
}

function MemberStrip({ profiles, loading }: { profiles: Profile[] | undefined; loading: boolean }) {
  return (
    <div className="panel mt-6 p-5">
      <div className="flex items-center gap-2">
        <Users className="size-4 text-primary" />
        <h2 className="font-display text-base font-semibold">Anggota Kelompok</h2>
      </div>
      {loading ? (
        <Skeleton className="mt-4 h-12 w-full rounded-xl" />
      ) : (
        <ul className="mt-4 flex flex-wrap gap-3">
          {(profiles ?? []).map((p) => (
            <li
              key={p.id}
              className="flex items-center gap-2 rounded-xl border border-border bg-secondary/40 py-1.5 pl-1.5 pr-3"
            >
              <Avatar className="size-8">
                {p.avatar_url ? <AvatarImage src={p.avatar_url} alt="" /> : null}
                <AvatarFallback className="text-xs">
                  {p.display_name.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm leading-tight">
                <span className="block font-medium">{p.display_name}</span>
                <span className="block text-[11px] text-muted-foreground">
                  {ROLE_LABEL[p.studio_role]}
                </span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
