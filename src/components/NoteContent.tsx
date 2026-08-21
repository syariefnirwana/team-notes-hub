import { useMemo } from "react";

import { sanitizeNoteHtml } from "@/lib/sanitize";
import { cn } from "@/lib/utils";

export function NoteContent({ html, className }: { html: string; className?: string }) {
  const safe = useMemo(() => sanitizeNoteHtml(html), [html]);
  return (
    <div
      className={cn("note-prose text-sm", className)}
      // Konten sudah dibersihkan dengan DOMPurify di atas.
      dangerouslySetInnerHTML={{ __html: safe }}
    />
  );
}
