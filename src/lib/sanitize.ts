import DOMPurify from "dompurify";

/**
 * Membersihkan HTML catatan sebelum ditampilkan atau disimpan.
 * Hanya tag/atribut format sederhana (ala Google Docs versi ringan) yang diizinkan.
 */
export function sanitizeNoteHtml(html: string): string {
  if (typeof window === "undefined") return "";
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      "p",
      "br",
      "b",
      "strong",
      "i",
      "em",
      "u",
      "s",
      "mark",
      "span",
      "div",
      "ul",
      "ol",
      "li",
      "h3",
      "blockquote",
      "a",
      "img",
      "code",
      "pre",
    ],
    ALLOWED_ATTR: ["style", "href", "target", "rel", "src", "alt", "title", "data-author"],
    ALLOWED_URI_REGEXP: /^(?:https?:|mailto:|data:image\/)/i,
  });
}

export function htmlToPlainText(html: string): string {
  if (typeof window === "undefined") return "";
  const div = document.createElement("div");
  div.innerHTML = sanitizeNoteHtml(html);
  return (div.textContent ?? "").replace(/\s+/g, " ").trim();
}
