const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002";
const LOGIN_PATH = "/features/identity/login";

let sessionExpiredHandled = false;

function handleSessionExpiry(): void {
  if (typeof window === "undefined") return;
  if (sessionExpiredHandled) return;
  sessionExpiredHandled = true;
  const next = encodeURIComponent(
    window.location.pathname + window.location.search,
  );
  // Deliberate full-page reload: discards all stale React state from the
  // expired session. This module sits outside React, so useRouter/redirect()
  // aren't available — see constitution/decisions.md "Session expiry UX".
  // eslint-disable-next-line @next/next/no-location-assign-relative-destination
  window.location.assign(`${LOGIN_PATH}?next=${next}&reason=expired`);
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, string[]>;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: ApiError;
}

export interface PaginatedData<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private getCsrfToken(): string | null {
    if (typeof document === "undefined") return null;
    // Identity sessions use csrf_token; guest carts use the JS-readable
    // cart_csrf cookie issued alongside the httpOnly guest_token. Either
    // satisfies the double-submit check for its own surface.
    const match =
      document.cookie.match(/csrf_token=([^;]+)/) ??
      document.cookie.match(/cart_csrf=([^;]+)/);
    return match ? match[1] : null;
  }

  private async request<T>(
    method: string,
    path: string,
    options: {
      body?: unknown;
      query?: Record<string, string | number | undefined>;
    } = {},
  ): Promise<T> {
    const url = new URL(path, this.baseUrl);

    if (options.query) {
      for (const [key, value] of Object.entries(options.query)) {
        if (value !== undefined && value !== "") {
          url.searchParams.set(key, String(value));
        }
      }
    }

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    const csrfToken = this.getCsrfToken();
    if (csrfToken && method !== "GET") {
      headers["X-CSRF-Token"] = csrfToken;
    }

    const response = await fetch(url.toString(), {
      method,
      headers,
      credentials: "include",
      body: options.body ? JSON.stringify(options.body) : undefined,
    });

    let json: ApiResponse<T>;
    try {
      json = await response.json();
    } catch {
      // Non-JSON body (e.g. proxy/Express HTML error page) — surface a
      // readable error instead of leaking JSON.parse SyntaxError text.
      throw {
        code: "BAD_RESPONSE",
        message: `Server returned an unexpected response (HTTP ${response.status}).`,
      };
    }

    if (!json.success || json.error) {
      const error = json.error || { code: "UNKNOWN_ERROR", message: "An unexpected error occurred" };
      if (response.status === 401 || error.code === "UNAUTHENTICATED") {
        handleSessionExpiry();
      }
      throw error;
    }

    return json.data;
  }

  async get<T>(
    path: string,
    query?: Record<string, string | number | undefined>,
  ): Promise<T> {
    return this.request<T>("GET", path, { query });
  }

  async post<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>("POST", path, { body });
  }

  async patch<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>("PATCH", path, { body });
  }

  async delete<T>(path: string): Promise<T> {
    return this.request<T>("DELETE", path);
  }
}

export const api = new ApiClient(API_BASE_URL);
