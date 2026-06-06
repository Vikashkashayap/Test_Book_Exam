import nodemailer from 'nodemailer';
import { env } from '../config/env';

let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter | null {
  if (!env.SMTP_HOST || !env.SMTP_USER) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT ?? 587,
      secure: false,
      auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
    });
  }
  return transporter;
}

export async function sendEmail(options: {
  to: string;
  subject: string;
  html: string;
}): Promise<boolean> {
  const transport = getTransporter();
  if (!transport) {
    console.log('[Email skipped]', options.subject, '->', options.to);
    return false;
  }

  await transport.sendMail({
    from: env.EMAIL_FROM,
    to: options.to,
    subject: options.subject,
    html: options.html,
  });
  return true;
}

export async function sendWelcomeEmail(email: string, name: string): Promise<void> {
  await sendEmail({
    to: email,
    subject: 'Welcome to ExamPrep Pro',
    html: `<h1>Welcome, ${name}!</h1><p>Start your exam preparation journey today.</p>`,
  });
}

export async function sendTestResultEmail(
  email: string,
  name: string,
  testTitle: string,
  score: number,
  percentage: number
): Promise<void> {
  await sendEmail({
    to: email,
    subject: `Result: ${testTitle}`,
    html: `<p>Hi ${name},</p><p>You scored <strong>${score}</strong> (${percentage.toFixed(1)}%) in ${testTitle}.</p>`,
  });
}
