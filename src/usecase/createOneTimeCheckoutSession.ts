import Stripe from 'stripe'
import { stripe } from '../stripe'
import { findPaymentUserUseCase } from './findPaymentUser'

/**
 * 一回きりの支払いのセッションを作成する
 * @param amount 寄附金額
 * @param twinteUserId undefinedの場合は紐付け無しで実行される
 * @returns 生成されたセッション
 */
export async function createOneTimeCheckoutSessionUseCase(
  amount: number,
  twinteUserId?: string
): Promise<Stripe.Checkout.Session> {
  // TwinteIDに紐付いているcustomerを取得/作成
  const customer = twinteUserId
    ? (await findPaymentUserUseCase(twinteUserId)).id
    : undefined

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    submit_type: 'donate',
    customer,
    line_items: [
      {
        name: 'Twin:te寄付',
        description: '寄付いただいたお金はTwin:teの運用や開発に使用します',
        images: ['https://www.twinte.net/ogp.jpg'],
        amount,
        currency: 'jpy',
        quantity: 1,
      },
    ],
    success_url: process.env.STRIPE_CHECKOUT_SUCCESS_URL!,
    cancel_url: process.env.STRIPE_CHECKOUT_CANCEL_URL!,
  })
  return session
}
