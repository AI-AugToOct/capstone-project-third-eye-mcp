export function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;

  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);

  if (parts.length === 2) {
    const cookieValue = parts.pop()?.split(';').shift();
    return cookieValue || null;
  }

  return null;
}

export function setCookie(name: string, value: string, options: { maxAge?: number; path?: string; secure?: boolean; sameSite?: 'strict' | 'lax' | 'none' } = {}): void {
  if (typeof document === 'undefined') return;

  const { maxAge, path = '/', secure = true, sameSite = 'strict' } = options;

  let cookie = `${name}=${value}; path=${path}; SameSite=${sameSite}`;

  if (secure) {
    cookie += '; Secure';
  }

  if (maxAge !== undefined) {
    cookie += `; Max-Age=${maxAge}`;
  }

  document.cookie = cookie;
}

export function deleteCookie(name: string, path: string = '/'): void {
  if (typeof document === 'undefined') return;
  document.cookie = `${name}=; path=${path}; Max-Age=0`;
}
