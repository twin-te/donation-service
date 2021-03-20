import { getRepository } from 'typeorm'
import { PaymentUser } from '../database/model/PaymentUser'
import { createPaymentUserUseCase } from './createPaymentUser'

/**
 * 指定されたTwinteIDに紐付けられたPaymentUserを取得する
 * 存在しない場合は作成される
 * @param twinteUserId
 * @returns
 */
export async function findPaymentUserUseCase(
  twinteUserId: string
): Promise<PaymentUser> {
  return (
    (await getRepository(PaymentUser).findOne({ twinteUserId })) ??
    (await createPaymentUserUseCase(twinteUserId))
  )
}
