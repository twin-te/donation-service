import { mocked } from 'ts-jest/utils'
import { connectDatabase, disconnectDatabase } from '../../src/database'
import { stripe } from '../../src/stripe'
import { getTotalAmountUseCase } from '../../src/usecase/getTotalAmount'
import { clearDB } from '../_clearDB'

jest.mock('../../src/stripe/index')

let total = 0

beforeAll(async () => {
  await connectDatabase()
  await clearDB()
})

test(
  '初回',
  async () => {
    mocked(stripe.paymentIntents.list)
      .mockResolvedValueOnce({
        data: [
          // @ts-ignore
          { status: 'succeeded', amount: 500 },
          // @ts-ignore
          { status: 'succeeded', amount: 1500 },
        ],
        has_more: true,
      })
      .mockResolvedValueOnce({
        data: [
          // @ts-ignore
          { status: 'processing', amount: 500 },
          // @ts-ignore
          { status: 'succeeded', amount: 1500 },
        ],
        has_more: false,
      })
    total = await getTotalAmountUseCase(false)
    expect(total).toBe(3500)
  },
  1000 * 60
)

test('10分以内ならキャッシュで前回の値が返る', () => {
  mocked(stripe.paymentIntents.list)
    .mockResolvedValueOnce({
      data: [
        // @ts-ignore
        { status: 'succeeded', amount: 500 },
        // @ts-ignore
        { status: 'succeeded', amount: 1500 },
      ],
      has_more: true,
    })
    .mockResolvedValueOnce({
      data: [
        // @ts-ignore
        { status: 'succeeded', amount: 500 },
        // @ts-ignore
        { status: 'succeeded', amount: 1500 },
      ],
      has_more: false,
    })
  return expect(getTotalAmountUseCase(false)).resolves.toBe(total)
})

test('強制更新で値も更新される', () => {
  mocked(stripe.paymentIntents.list)
    .mockReset()
    .mockResolvedValueOnce({
      data: [
        // @ts-ignore
        { status: 'succeeded', amount: 500 },
        // @ts-ignore
        { status: 'succeeded', amount: 1500 },
      ],
      has_more: true,
    })
    .mockResolvedValueOnce({
      data: [
        // @ts-ignore
        { status: 'succeeded', amount: 500 },
        // @ts-ignore
        { status: 'succeeded', amount: 1500 },
      ],
      has_more: false,
    })
  return expect(getTotalAmountUseCase(true)).resolves.toBe(4000)
})

afterAll(disconnectDatabase)
