import { Resend } from 'resend'

let resend: Resend | null = null

function getResend(): Resend {
  if (!resend) {
    resend = new Resend(process.env.RESEND_API_KEY)
  }
  return resend
}

export async function sendOtpEmail(params: {
  to: string
  code: string
}): Promise<void> {
  // TEMPORARY: Resend is not in service — log the OTP to the terminal instead.
  // Restore the Resend call below once email delivery works again.
  console.log(`[DEV OTP] ${params.to} -> code: ${params.code}`)
  return

  await getResend().emails.send({
    from: process.env.EMAIL_FROM ?? 'noreply@example.com',
    to: params.to,
    subject: 'Your verification code',
    html: `<p>Your verification code is: <strong>${params.code}</strong></p><p>This code expires in 10 minutes.</p>`,
  })
}
