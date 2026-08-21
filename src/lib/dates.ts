const DAY_FMT = new Intl.DateTimeFormat("id-ID", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "Asia/Jakarta",
});

const TIME_FMT = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Asia/Jakarta",
});

/** Kunci hari (YYYY-MM-DD) menurut waktu Jakarta. */
export function dayKey(iso: string): string {
  const d = new Date(iso);
  const parts = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "Asia/Jakarta",
  }).format(d);
  return parts;
}

export function formatDateLong(dayOrIso: string): string {
  const iso = dayOrIso.length === 10 ? `${dayOrIso}T00:00:00+07:00` : dayOrIso;
  return DAY_FMT.format(new Date(iso));
}

export function formatDateTime(iso: string): string {
  return `${TIME_FMT.format(new Date(iso))} WIB`;
}

/** Kelompokkan item ber-`created_at` menjadi daftar [hari, item[]] terbaru dulu. */
export function groupByDay<T extends { created_at: string }>(items: T[]): Array<[string, T[]]> {
  const map = new Map<string, T[]>();
  for (const item of items) {
    const key = dayKey(item.created_at);
    const bucket = map.get(key);
    if (bucket) bucket.push(item);
    else map.set(key, [item]);
  }
  return [...map.entries()].sort((a, b) => (a[0] < b[0] ? 1 : -1));
}
