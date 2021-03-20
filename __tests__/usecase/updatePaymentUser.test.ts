import { getRepository } from 'typeorm'
import { v4 } from 'uuid'
import { connectDatabase, disconnectDatabase } from '../../src/database'
import { PaymentUser } from '../../src/database/model/PaymentUser'
import { updatePaymentUserUseCase } from '../../src/usecase/updatePaymentUser'
import { clearDB } from '../_clearDB'

const twinteUserId = v4()

beforeAll(async () => {
  await connectDatabase()
  await clearDB()
  await getRepository(PaymentUser).save({
    id: 'foo',
    twinteUserId,
    displayName: null,
    link: null,
  })
})

test('success', () =>
  expect(
    updatePaymentUserUseCase(twinteUserId, 'hoge', 'fuga')
  ).resolves.toEqual({
    id: 'foo',
    twinteUserId,
    displayName: 'hoge',
    link: 'fuga',
  }))

afterAll(disconnectDatabase)
