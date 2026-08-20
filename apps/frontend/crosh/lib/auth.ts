export interface User {
  id: string;
  email: string;
  isAdmin: boolean;
}

export interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

export async function fetchCurrentUser(): Promise<User | null> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/api/auth/me`, {
      credentials: "include",
    });
    const json = await res.json();
    if (json.success && json.data?.user) {
      return json.data.user as User;
    }
    return null;
  } catch {
    return null;
  }
}

export async function logout(): Promise<void> {
  const csrfToken = document.cookie.match(/csrf_token=([^;]+)/)?.[1];
  await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/api/auth/logout`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(csrfToken ? { "X-CSRF-Token": csrfToken } : {}),
    },
  });
}
