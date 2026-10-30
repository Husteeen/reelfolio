/**
 * Base URL for all API calls.
 * - Development : empty string → Vite proxy forwards /api → localhost:4000
 * - Production  : VITE_API_URL env var set to Railway backend URL
 */
export const API_BASE = import.meta.env.VITE_API_URL ?? '';

export async function apiFetch(
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  return fetch(`${API_BASE}${path}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
    },
    ...options,
  });
}
