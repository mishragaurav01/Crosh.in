export type OtpErrorCode =
  | "OTP_INVALID"
  | "OTP_EXPIRED"
  | "OTP_MAX_ATTEMPTS"
  | "OTP_RATE_LIMITED"
  | "UNAUTHENTICATED";

export interface ApiSuccess<T> {
  success: true;
  data: T;
}

export interface ApiError {
  success: false;
  error: { code: string; message: string };
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

export interface RequestOtpData {
  message: string;
}

export interface VerifyOtpData {
  user: { id: string; email: string; isAdmin: boolean };
  csrfToken: string;
}

export interface MeData {
  user: { id: string; email: string; isAdmin: boolean };
}

export interface LogoutData {
  message: string;
}
