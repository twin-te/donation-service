import { getRepository } from 'typeorm'
import { PaymentUser } from '../database/model/PaymentUser'
import { findPaymentUserUseCase } from './findPaymentUser'

/**
 * 指定されたユーザの情報を更新する
 * @param twinteUserId
 * @param displayName
 * @param link
 * @returns
 */
export async function updatePaymentUserUseCase(
  twinteUserId: string,
  displayName: string | null,
  link: string | null
): Promise<PaymentUser> {
  const paymentUser = await findPaymentUserUseCase(twinteUserId)
  paymentUser.displayName = displayName
  paymentUser.link = link
  return getRepository(PaymentUser).save(paymentUser)
}
