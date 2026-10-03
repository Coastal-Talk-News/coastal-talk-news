import { Resend } from 'resend';

export interface Mailer {
  sendTwoFactorCode(to: string, code: string): Promise<void>;
}

/** Only built when RESEND_API_KEY/EMAIL_OTP_FROM are set - see
 *  env.emailOtpEnabled and the `app.mailer` decorator in plugins/auth.ts. */
export function createMailer(apiKey: string, from: string): Mailer {
  const resend = new Resend(apiKey);

  return {
    async sendTwoFactorCode(to, code) {
      const { error } = await resend.emails.send({
        from,
        to,
        subject: `${code} is your sign-in code`,
        text: `Your Coastal Talk News sign-in code is ${code}. It expires in 5 minutes.\n\nIf you didn't try to sign in, you can ignore this email.`,
      });
      if (error) throw new Error(`Resend: ${error.message}`);
    },
  };
}
