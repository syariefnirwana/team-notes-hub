import { supabase } from "@/integrations/supabase/client";

export type StudioRole = "ketua" | "sekretaris" | "anggota";

export type Profile = {
  id: string;
  display_name: string;
  email: string | null;
  avatar_url: string | null;
  studio_role: StudioRole;
};

export type Note = {
  id: string;
  title: string;
  content: string;
  created_by: string;
  last_edited_by: string | null;
  created_at: string;
  updated_at: string;
};

export type Revision = {
  id: string;
  note_id: string;
  editor_id: string;
  action: string;
  title: string;
  content: string;
  summary: string | null;
  created_at: string;
};

export const ROLE_LABEL: Record<StudioRole, string> = {
  ketua: "Ketua Kelompok",
  sekretaris: "Sekretaris",
  anggota: "Anggota",
};

export async function ensureProfile(displayName?: string, avatarUrl?: string) {
  const args: { _display_name?: string; _avatar_url?: string } = {};
  if (displayName) args._display_name = displayName;
  if (avatarUrl) args._avatar_url = avatarUrl;
  const { data, error } = await supabase.rpc("ensure_profile", args);


  if (error) throw error;
  return data as unknown as Profile;
}

export async function fetchProfiles(): Promise<Profile[]> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, display_name, email, avatar_url, studio_role")
    .order("studio_role", { ascending: true })
    .order("display_name", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Profile[];
}

export async function fetchIsAdmin(userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (error) throw error;
  return Boolean(data);
}

export async function updateDisplayName(userId: string, displayName: string) {
  const { error } = await supabase
    .from("profiles")
    .update({ display_name: displayName })
    .eq("id", userId);
  if (error) throw error;
}

export async function setStudioRole(userId: string, role: StudioRole) {
  const { error } = await supabase.rpc("set_studio_role", {
    _user_id: userId,
    _role: role,
  });
  if (error) throw error;
}

export async function fetchNotes(): Promise<Note[]> {
  const { data, error } = await supabase
    .from("notes")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Note[];
}

export async function fetchNote(id: string): Promise<Note | null> {
  const { data, error } = await supabase.from("notes").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return (data ?? null) as Note | null;
}

export async function fetchRevisions(noteId: string): Promise<Revision[]> {
  const { data, error } = await supabase
    .from("note_revisions")
    .select("*")
    .eq("note_id", noteId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Revision[];
}

export async function createNote(input: { title: string; content: string; userId: string }) {
  const { data, error } = await supabase
    .from("notes")
    .insert({
      title: input.title,
      content: input.content,
      created_by: input.userId,
      last_edited_by: input.userId,
    })
    .select("*")
    .single();
  if (error) throw error;

  await supabase.from("note_revisions").insert({
    note_id: data.id,
    editor_id: input.userId,
    action: "created",
    title: input.title,
    content: input.content,
    summary: "Catatan dibuat",
  });

  return data as Note;
}

export async function updateNote(input: {
  note: Note;
  title: string;
  content: string;
  userId: string;
  summary: string;
}) {
  const { note, title, content, userId, summary } = input;

  // Simpan versi LAMA sebagai riwayat, lalu tulis versi baru.
  await supabase.from("note_revisions").insert({
    note_id: note.id,
    editor_id: userId,
    action: "updated",
    title,
    content,
    summary: summary || "Catatan diperbarui",
  });

  const { data, error } = await supabase
    .from("notes")
    .update({ title, content, last_edited_by: userId, updated_at: new Date().toISOString() })
    .eq("id", note.id)
    .select("*")
    .single();
  if (error) throw error;
  return data as Note;
}

export async function deleteNote(id: string) {
  const { error } = await supabase.from("notes").delete().eq("id", id);
  if (error) throw error;
}

/** Unggah gambar ke penyimpanan dan kembalikan URL bertanda tangan berumur panjang. */
export async function uploadNoteImage(file: File, userId: string): Promise<string> {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "png";
  const path = `${userId}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("note-images").upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });
  if (error) throw error;

  const { data, error: signError } = await supabase.storage
    .from("note-images")
    .createSignedUrl(path, 60 * 60 * 24 * 365 * 5);
  if (signError) throw signError;
  return data.signedUrl;
}
