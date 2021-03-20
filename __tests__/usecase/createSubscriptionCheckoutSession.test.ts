import { mocked } from 'ts-jest/utils'
import { v4 } from 'uuid'
import { connectDatabase, disconnectDatabase } from '../../src/database'
import { stripe } from '../../src/stripe'
import { createSubscriptionCheckoutSessionUseCase } from '../../src/usecase/createSubscriptionCheckoutSession'
import { findPaymentUserUseCase } from '../../src/usecase/findPaymentUser'
import { clearDB } from '../_clearDB'
jest.mock('../../src/stripe/index')
jest.mock('../../src/usecase/findPaymentUser')

const twinteUserId = v4()

beforeAll(async () => {
  await connectDatabase()
  await clearDB()
})

test('TwinteUserIdあり', () => {
  mocked(findPaymentUserUseCase).mockResolvedValue({
    id: 'foo',
    twinteUserId,
    displayName: null,
    link: null,
  })
  // @ts-ignore
  mocked(stripe.checkout.sessions.create).mockImplementation(async (params) => {
    expect(params.customer).toEqual('foo')
    return {
      amount_total: 500,
      customer: params.customer,
      mode: 'subscription',
    }
  })
  return expect(
    createSubscriptionCheckoutSessionUseCase('plan_hoge', twinteUserId)
  ).resolves.toEqual(
    expect.objectContaining({
      amount_total: expect.any(Number),
      customer: expect.any(String),
      mode: 'subscription',
    })
  )
})

afterAll(disconnectDatabase)
