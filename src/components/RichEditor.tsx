import { useEffect, useRef, useState } from "react";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  List,
  ListOrdered,
  Quote,
  Highlighter,
  Heading3,
  ImagePlus,
  UserPen,
  Eraser,
  Loader2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { sanitizeNoteHtml } from "@/lib/sanitize";
import { cn } from "@/lib/utils";

const TEXT_COLORS = [
  { label: "Biru", value: "#2f6fb5" },
  { label: "Hijau", value: "#237a5b" },
  { label: "Merah", value: "#b03a3a" },
  { label: "Ungu", value: "#6b4fa8" },
  { label: "Hitam", value: "#1f2a44" },
];

type Props = {
  value: string;
  onChange: (html: string) => void;
  authorName: string;
  onUploadImage: (file: File) => Promise<string>;
};

export function RichEditor({ value, onChange, authorName, onUploadImage }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  // Isi awal saja; setelah itu DOM dikelola oleh contenteditable.
  useEffect(() => {
    if (ref.current && !ref.current.innerHTML) {
      ref.current.innerHTML = sanitizeNoteHtml(value);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const emit = () => {
    if (ref.current) onChange(ref.current.innerHTML);
  };

  const run = (command: string, arg?: string) => {
    ref.current?.focus();
    document.execCommand(command, false, arg);
    emit();
  };

  const insertHtml = (html: string) => {
    ref.current?.focus();
    document.execCommand("insertHTML", false, html);
    emit();
  };

  const markContribution = () => {
    const selection = window.getSelection();
    const text = selection?.toString();
    if (!text) return;
    const safeName = authorName.replace(/[<>&"]/g, "");
    const safeText = text.replace(/[<>&]/g, (c) =>
      c === "<" ? "&lt;" : c === ">" ? "&gt;" : "&amp;",
    );
    insertHtml(`<span data-author="${safeName}">${safeText}</span>`);
  };

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setUploading(true);
    try {
      const url = await onUploadImage(file);
      insertHtml(`<img src="${url}" alt="Gambar catatan" />`);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const ToolButton = ({
    label,
    onClick,
    children,
  }: {
    label: string;
    onClick: () => void;
    children: React.ReactNode;
  }) => (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-8 rounded-lg"
          onMouseDown={(e) => e.preventDefault()}
          onClick={onClick}
          aria-label={label}
        >
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );

  return (
    <div className="panel overflow-hidden">
      <div className="flex flex-wrap items-center gap-1 border-b border-border bg-secondary/50 px-2 py-1.5">
        <ToolButton label="Tebal" onClick={() => run("bold")}>
          <Bold className="size-4" />
        </ToolButton>
        <ToolButton label="Miring" onClick={() => run("italic")}>
          <Italic className="size-4" />
        </ToolButton>
        <ToolButton label="Garis bawah" onClick={() => run("underline")}>
          <Underline className="size-4" />
        </ToolButton>
        <ToolButton label="Coret" onClick={() => run("strikeThrough")}>
          <Strikethrough className="size-4" />
        </ToolButton>

        <Separator orientation="vertical" className="mx-1 h-6" />

        <ToolButton label="Stabilo teks" onClick={() => insertHtmlMark(insertHtml)}>
          <Highlighter className="size-4" />
        </ToolButton>
        <div className="flex items-center gap-1 px-1">
          {TEXT_COLORS.map((color) => (
            <Tooltip key={color.value}>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  aria-label={`Warna ${color.label}`}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => run("foreColor", color.value)}
                  className="size-4 rounded-full border border-border"
                  style={{ backgroundColor: color.value }}
                />
              </TooltipTrigger>
              <TooltipContent>Warna {color.label}</TooltipContent>
            </Tooltip>
          ))}
        </div>

        <Separator orientation="vertical" className="mx-1 h-6" />

        <ToolButton label="Sub judul" onClick={() => run("formatBlock", "<h3>")}>
          <Heading3 className="size-4" />
        </ToolButton>
        <ToolButton label="Daftar poin" onClick={() => run("insertUnorderedList")}>
          <List className="size-4" />
        </ToolButton>
        <ToolButton label="Daftar nomor" onClick={() => run("insertOrderedList")}>
          <ListOrdered className="size-4" />
        </ToolButton>
        <ToolButton label="Kutipan" onClick={() => run("formatBlock", "<blockquote>")}>
          <Quote className="size-4" />
        </ToolButton>

        <Separator orientation="vertical" className="mx-1 h-6" />

        <ToolButton label="Sisipkan gambar" onClick={() => fileRef.current?.click()}>
          {uploading ? <Loader2 className="size-4 animate-spin" /> : <ImagePlus className="size-4" />}
        </ToolButton>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="h-8 gap-1.5 rounded-lg text-xs"
              onMouseDown={(e) => e.preventDefault()}
              onClick={markContribution}
            >
              <UserPen className="size-3.5" />
              Tandai kontribusi saya
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            Pilih teks yang kamu tambahkan, lalu tandai agar tertulis namamu
          </TooltipContent>
        </Tooltip>
        <ToolButton label="Hapus format" onClick={() => run("removeFormat")}>
          <Eraser className="size-4" />
        </ToolButton>

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => void handleFile(e.target.files?.[0])}
        />
      </div>

      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-multiline="true"
        aria-label="Isi catatan"
        onInput={emit}
        onBlur={emit}
        className={cn(
          "note-prose min-h-[320px] w-full px-4 py-3 text-sm outline-none",
          "focus-visible:ring-2 focus-visible:ring-ring/40",
        )}
      />
    </div>
  );
}

function insertHtmlMark(insertHtml: (html: string) => void) {
  const text = window.getSelection()?.toString();
  if (!text) return;
  const safe = text.replace(/[<>&]/g, (c) => (c === "<" ? "&lt;" : c === ">" ? "&gt;" : "&amp;"));
  insertHtml(`<mark>${safe}</mark>`);
}
