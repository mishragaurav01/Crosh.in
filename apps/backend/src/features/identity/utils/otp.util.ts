import { randomInt } from "node:crypto";

const OTP_LENGTH = 6
const OTP_MIN = 10 ** (OTP_LENGTH - 1)
const OTP_MAX = 10 ** OTP_LENGTH

export function generateOtp(): string {
  return randomInt(OTP_MIN, OTP_MAX).toString()
}

export async function hashOtp(code: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(code)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
}
