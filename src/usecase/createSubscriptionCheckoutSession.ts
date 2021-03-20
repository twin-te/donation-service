import Stripe from 'stripe'
import { stripe } from '../stripe'
import { findPaymentUserUseCase } from './findPaymentUser'

/**
 * サブスク登録用のセッションを作成する
 * @param planId Stripeダッシュボードで登録されているプランID
 * @param twinteUserId TwinteUserID
 * @returns 生成されたセッション
 */
export async function createSubscriptionCheckoutSessionUseCase(
  planId: string,
  twinteUserId: string
): Promise<Stripe.Checkout.Session> {
  const customer = (await findPaymentUserUseCase(twinteUserId)).id
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    customer,
    subscription_data: {
      items: [
        {
          plan: planId,
        },
      ],
    },
    success_url: process.env.STRIPE_CHECKOUT_SUCCESS_URL!,
    cancel_url: process.env.STRIPE_CHECKOUT_CANCEL_URL!,
  })
  return session
}
