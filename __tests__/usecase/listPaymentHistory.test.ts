import { v4 } from 'uuid'
import { connectDatabase, disconnectDatabase } from '../../src/database'
import { clearDB } from '../_clearDB'
import { mocked } from 'ts-jest/utils'
import { stripe } from '../../src/stripe'
import { listPaymentHistoryUseCase } from '../../src/usecase/listPaymentHistory'
import { findPaymentUserUseCase } from '../../src/usecase/findPaymentUser'

jest.mock('../../src/stripe/index')
jest.mock('../../src/usecase/findPaymentUser')

const twinteUserId = v4()

beforeAll(async () => {
  await connectDatabase()
  await clearDB()
})

test('success', async () => {
  mocked(findPaymentUserUseCase).mockResolvedValue({
    id: 'hoge',
    twinteUserId,
    displayName: null,
    link: null,
  })
  mocked(stripe.paymentIntents.list)
    .mockResolvedValueOnce({
      //@ts-ignore
      data: [{ id: 'foo' }],
      has_more: true,
    })
    .mockResolvedValueOnce({
      //@ts-ignore
      data: [{ id: 'bar' }],
      has_more: false,
    })
  const res = await listPaymentHistoryUseCase(twinteUserId)
  expect(res.map((p) => p.id)).toEqual(['foo', 'bar'])
})

afterAll(disconnectDatabase)
