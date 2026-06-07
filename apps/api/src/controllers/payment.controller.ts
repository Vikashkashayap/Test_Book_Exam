import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { Payment } from '../models/Payment';
import { Subscription } from '../models/Subscription';
import { User } from '../models/User';
import { createOrder, verifyPaymentSignature } from '../services/razorpay.service';
import { getPayablePlan, getOrCreatePricingConfig } from '../services/pricing-config.service';
import { env } from '../config/env';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/ApiError';
import { PLAN_FEATURES } from '@exam-prep/shared';

export const createPaymentOrder = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { plan: planId } = req.body;
  if (!planId || typeof planId !== 'string') {
    throw new ApiError(400, 'Plan is required');
  }

  let planConfig;
  try {
    planConfig = await getPayablePlan(planId.trim().toLowerCase());
  } catch {
    throw new ApiError(400, 'Invalid or unavailable plan');
  }

  const order = await createOrder(req.user!.id, planConfig.planId);

  const payment = await Payment.create({
    userId: req.user!.id,
    razorpayOrderId: order.orderId,
    amount: order.amount / 100,
    currency: order.currency,
    plan: planConfig.planId,
    status: 'created',
  });

  res.json({
    success: true,
    data: {
      orderId: order.orderId,
      amount: order.amount,
      currency: order.currency,
      paymentId: payment._id,
      keyId: env.RAZORPAY_KEY_ID,
      planName: planConfig.name,
    },
  });
});

export const verifyPayment = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  const valid = verifyPaymentSignature(
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature
  );
  if (!valid) throw new ApiError(400, 'Invalid payment signature');

  const payment = await Payment.findOne({ razorpayOrderId: razorpay_order_id });
  if (!payment) throw new ApiError(404, 'Payment not found');

  payment.status = 'paid';
  payment.razorpayPaymentId = razorpay_payment_id;
  payment.razorpaySignature = razorpay_signature;
  await payment.save();

  let planFeatures: string[] = [];
  const config = await getOrCreatePricingConfig();
  const planConfig = config.plans.find((p) => p.planId === payment.plan);
  planFeatures = planConfig?.features ?? PLAN_FEATURES[payment.plan] ?? [];

  const startDate = new Date();
  const endDate = new Date();
  endDate.setMonth(endDate.getMonth() + 1);

  const subscription = await Subscription.create({
    userId: payment.userId,
    plan: payment.plan,
    status: 'active',
    startDate,
    endDate,
    features: planFeatures,
  });

  payment.subscriptionId = subscription._id;
  await payment.save();

  await User.findByIdAndUpdate(payment.userId, {
    subscriptionPlan: payment.plan,
    subscriptionExpiresAt: endDate,
  });

  res.json({ success: true, data: { subscription, payment } });
});

export const webhook = asyncHandler(async (_req, res: Response) => {
  res.json({ success: true, received: true });
});
