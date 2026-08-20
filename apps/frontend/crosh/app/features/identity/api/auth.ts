import type {
  ApiResponse,
  RequestOtpData,
  VerifyOtpData,
  MeData,
  LogoutData,
} from "./types";

export class AuthApiError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(code: string, message: string, status: number) {
    super(message);
    this.name = "AuthApiError";
    this.code = code;
    this.status = status;
  }
}

async function request<T>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const res = await fetch(path, {
    headers: { "Content-Type": "application/json", ...options?.headers },
    ...options,
  });

  const body: ApiResponse<T> = await res.json();

  if (!body.success) {
    throw new AuthApiError(body.error.code, body.error.message, res.status);
  }

  return body.data;
}

export function requestOtp(email: string): Promise<RequestOtpData> {
  return request<RequestOtpData>("/api/auth/otp/request", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export function verifyOtp(
  email: string,
  code: string,
): Promise<VerifyOtpData> {
  return request<VerifyOtpData>("/api/auth/otp/verify", {
    method: "POST",
    body: JSON.stringify({ email, code }),
  });
}

export function getMe(): Promise<MeData> {
  return request<MeData>("/api/auth/me", { method: "GET" });
}

export function logout(csrfToken: string): Promise<LogoutData> {
  return request<LogoutData>("/api/auth/logout", {
    method: "POST",
    headers: { "X-CSRF-Token": csrfToken },
  });
}
