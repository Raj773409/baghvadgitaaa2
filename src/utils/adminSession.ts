const ADMIN_SESSION_STORAGE_KEY = 'eternal_admin_bearer_token';
let memorySessionToken: string | null = null;

function readStorageToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.sessionStorage.getItem(ADMIN_SESSION_STORAGE_KEY);
  } catch {
    return null;
  }
}

function writeStorageToken(token: string | null): void {
  if (typeof window === 'undefined') return;
  try {
    if (token) {
      window.sessionStorage.setItem(ADMIN_SESSION_STORAGE_KEY, token);
    } else {
      window.sessionStorage.removeItem(ADMIN_SESSION_STORAGE_KEY);
    }
  } catch {
    // Ignore storage SecurityError inside strict sandboxed iframes; memorySessionToken remains active.
  }
}

export function getAdminSessionToken(): string | null {
  return memorySessionToken || readStorageToken();
}

export function setAdminSessionToken(token: string | null | undefined): void {
  const clean = typeof token === 'string' && token.trim() ? token.trim() : null;
  memorySessionToken = clean;
  writeStorageToken(clean);
}

export function clearAdminSessionToken(): void {
  memorySessionToken = null;
  writeStorageToken(null);
}

export function buildAdminHeaders(
  initHeaders?: HeadersInit,
  token: string | null = getAdminSessionToken(),
): Headers {
  const headers = new Headers(initHeaders);
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  return headers;
}

export async function adminFetch(
  input: RequestInfo | URL,
  init: RequestInit = {},
): Promise<Response> {
  const token = getAdminSessionToken();
  const headers = buildAdminHeaders(init.headers, token);
  const res = await fetch(input, {
    ...init,
    credentials: 'same-origin',
    headers,
  });
  if (res.status === 401 && token) {
    clearAdminSessionToken();
  }
  return res;
}

export function extractDownloadFilename(
  contentDisposition: string | null,
  fallback: string,
): string {
  if (!contentDisposition) return fallback;
  const match = contentDisposition.match(/filename\*?=(?:UTF-8''|"?)([^";]+)/i);
  if (!match?.[1]) return fallback;
  const candidate = match[1].replace(/^"+|"+$/g, '').trim();
  return candidate || fallback;
}

export async function downloadAdminExport(url: string, fallbackFilename: string): Promise<void> {
  const res = await adminFetch(url);
  if (!res.ok) {
    const payload = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(payload.error || `Export failed (HTTP ${res.status}).`);
  }
  const blob = await res.blob();
  const filename = extractDownloadFilename(
    res.headers.get('content-disposition'),
    fallbackFilename,
  );
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = objectUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
}
