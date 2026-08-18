export type OtpErrorCode =
  | 'OTP_INVALID'
  | 'OTP_EXPIRED'
  | 'OTP_MAX_ATTEMPTS'
  | 'OTP_RATE_LIMITED'
  | 'UNAUTHENTICATED'

export class OtpError extends Error {
  readonly code: OtpErrorCode

  constructor(code: OtpErrorCode, message: string) {
    super(message)
    this.name = 'OtpError'
    this.code = code
  }
}
