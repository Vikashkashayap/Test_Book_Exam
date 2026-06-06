import { Notification } from '../models/Notification';
import { Types } from 'mongoose';
import { sendEmail } from './email.service';
import { env } from '../config/env';

export async function sendInAppNotification(payload: {
  userId: Types.ObjectId | string;
  type: string;
  title: string;
  message: string;
  link?: string;
}): Promise<void> {
  await Notification.create({
    userId: payload.userId,
    type: payload.type,
    title: payload.title,
    message: payload.message,
    link: payload.link,
  });
}

export async function sendEmailNotification(
  email: string,
  subject: string,
  html: string
): Promise<void> {
  await sendEmail({ to: email, subject, html });
}

/** WhatsApp — integrate MSG91 / Interakt / Gupshup in production */
export async function sendWhatsAppNotification(
  phone: string,
  message: string
): Promise<boolean> {
  if (env.NODE_ENV === 'development') {
    console.log(`[WhatsApp] ${phone}: ${message}`);
    return true;
  }
  // TODO: WhatsApp Business API
  return false;
}

export async function notifyUser(
  userId: Types.ObjectId | string,
  channels: ('email' | 'whatsapp' | 'in_app')[],
  payload: {
    email?: string;
    phone?: string;
    title: string;
    message: string;
    link?: string;
    type?: string;
  }
): Promise<void> {
  const tasks: Promise<unknown>[] = [];

  if (channels.includes('in_app')) {
    tasks.push(
      sendInAppNotification({
        userId,
        type: payload.type ?? 'system',
        title: payload.title,
        message: payload.message,
        link: payload.link,
      })
    );
  }
  if (channels.includes('email') && payload.email) {
    tasks.push(sendEmailNotification(payload.email, payload.title, `<p>${payload.message}</p>`));
  }
  if (channels.includes('whatsapp') && payload.phone) {
    tasks.push(sendWhatsAppNotification(payload.phone, `${payload.title}: ${payload.message}`));
  }

  await Promise.allSettled(tasks);
}
