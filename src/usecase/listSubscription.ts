import Stripe from 'stripe'
import { stripe } from '../stripe'
import { findPaymentUserUseCase } from './findPaymentUser'

/**
 * 指定されたユーザーのサブスクの一覧を取得する
 * @param twinteUserId
 * @returns
 */
export async function listSubscriptionUseCase(twinteUserId: string) {
  const customer = (await findPaymentUserUseCase(twinteUserId)).id
  const res: Stripe.Subscription[] = []
  let starting_after: string | undefined
  while (true) {
    const intents = await stripe.subscriptions.list({
      limit: 100,
      customer,
      starting_after,
    })
    res.push(...intents.data)
    if (!intents.has_more) break
    starting_after = intents.data[intents.data.length - 1].id
  }
  return res
}
