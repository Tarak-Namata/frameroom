// Browser-side fetch helpers that turn any failure into a friendly, human message.
const STATUS_MESSAGES: Record<number, string> = {
  413: "That file is too large to upload. Please use a smaller photo.",
  502: "Frameroom is restarting. Please wait a few seconds and try again.",
  503: "Frameroom is temporarily unavailable. Please try again in a moment.",
  504: "That took too long. Please try again — for big uploads, try fewer photos at once.",
};
const GENERIC = "Something went wrong on our side. Please try again in a moment.";
const OFFLINE = "Can't reach Frameroom right now. Check your internet connection and try again.";

function friendly(status: number, data: { error?: unknown }) {
  if (typeof data.error === "string") return data.error;
  return STATUS_MESSAGES[status] || GENERIC;
}

export async function api<T = any>(url: string, opts: { method?: string; body?: unknown; form?: FormData } = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, {
      method: opts.method || "GET",
      credentials: "include",
      headers: opts.form ? undefined : { "Content-Type": "application/json" },
      body: opts.form ?? (opts.body !== undefined ? JSON.stringify(opts.body) : undefined),
    });
  } catch {
    throw new Error(OFFLINE);
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401 && url.startsWith("/api/admin")) window.location.href = "/login";
    throw new Error(friendly(res.status, data));
  }
  return data as T;
}

export function uploadWithProgress(url: string, form: FormData, onProgress: (pct: number) => void) {
  return new Promise<any>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);
    xhr.withCredentials = true;
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress(Math.round((e.loaded / e.total) * 100));
    xhr.onload = () => {
      let data: any = {};
      try { data = JSON.parse(xhr.responseText); } catch {}
      if (xhr.status >= 200 && xhr.status < 300) resolve(data);
      else reject(new Error(friendly(xhr.status, data)));
    };
    xhr.onerror = () => reject(new Error(OFFLINE));
    xhr.send(form);
  });
}

export const formatBytes = (b: number) => (b > 1048576 ? `${(b / 1048576).toFixed(1)} MB` : `${Math.round(b / 1024)} KB`);
export const formatDate = (d: string | Date) => new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric", timeZone: "UTC" });
