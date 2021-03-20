import { getRepository } from 'typeorm'
import { PaymentUser } from '../src/database/model/PaymentUser'

export async function clearDB() {
  await getRepository(PaymentUser).delete({})
}
