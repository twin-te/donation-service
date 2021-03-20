import { getRepository } from 'typeorm'
import { PaymentUser } from '../database/model/PaymentUser'
import { stripe } from '../stripe'

/**
 * StripeCustomerを生成し、指定されたTwinteIDに紐付ける
 * @param twinteUserId
 * @returns
 */
export async function createPaymentUserUseCase(
  twinteUserId: string
): Promise<PaymentUser> {
  const stripeCustomer = await stripe.customers.create()
  return getRepository(PaymentUser).save({
    id: stripeCustomer.id,
    twinteUserId,
  })
}
