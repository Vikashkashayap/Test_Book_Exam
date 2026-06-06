import Razorpay from 'razorpay';
import crypto from 'crypto';
import { env } from '../config/env';
import { PLAN_PRICES_INR } from '@exam-prep/shared';
import { ApiError } from '../utils/ApiError';
import { getPlanPriceInr } from './pricing-config.service';

let razorpay: Razorpay | null = null;

function getRazorpay(): Razorpay {
  if (!env.RAZORPAY_KEY_ID || !env.RAZORPAY_KEY_SECRET) {
    throw new ApiError(503, 'Payment gateway not configured');
  }
  if (!razorpay) {
    razorpay = new Razorpay({
      key_id: env.RAZORPAY_KEY_ID,
      key_secret: env.RAZORPAY_KEY_SECRET,
    });
  }
  return razorpay;
}

export async function createOrder(
  userId: string,
  planId: string
): Promise<{ orderId: string; amount: number; currency: string }> {
  const dbPrice = await getPlanPriceInr(planId);
  const amount = Math.round((dbPrice || PLAN_PRICES_INR[planId] || 0) * 100);
  if (amount <= 0) {
    throw new ApiError(400, 'Invalid plan price');
  }
  const rp = getRazorpay();

  const order = await rp.orders.create({
    amount,
    currency: 'INR',
    receipt: `sub_${userId}_${Date.now()}`,
    notes: { userId, plan: planId },
  });

  return {
    orderId: order.id,
    amount: Number(order.amount),
    currency: order.currency,
  };
}

export function verifyPaymentSignature(
  orderId: string,
  paymentId: string,
  signature: string
): boolean {
  if (!env.RAZORPAY_KEY_SECRET) return false;
  const body = `${orderId}|${paymentId}`;
  const expected = crypto
    .createHmac('sha256', env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest('hex');
  return expected === signature;
}

export function verifyWebhookSignature(body: string, signature: string): boolean {
  if (!env.RAZORPAY_WEBHOOK_SECRET) return false;
  const expected = crypto
    .createHmac('sha256', env.RAZORPAY_WEBHOOK_SECRET)
    .update(body)
    .digest('hex');
  return expected === signature;
}
