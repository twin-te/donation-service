import Stripe from 'stripe'
import { stripe } from '../stripe'
import { findPaymentUserUseCase } from './findPaymentUser'

/**
 * 指定したユーザーの支払履歴を取得する
 * @param twinteUserId
 * @returns
 */
export async function listPaymentHistoryUseCase(twinteUserId: string) {
  const customer = (await findPaymentUserUseCase(twinteUserId)).id
  const res: Stripe.PaymentIntent[] = []
  let starting_after: string | undefined
  while (true) {
    const intents = await stripe.paymentIntents.list({
      limit: 100,
      customer,
      starting_after,
    })
    res.push(...intents.data)
    if (!intents.has_more) break
    starting_after = intents.data[intents.data.length - 1].id
    await delay(40)
  }
  return res
}

function delay(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}
