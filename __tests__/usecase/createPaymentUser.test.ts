import { mocked } from 'ts-jest/utils'
import { v4 } from 'uuid'
import { connectDatabase, disconnectDatabase } from '../../src/database'
import { stripe } from '../../src/stripe'
import { createPaymentUserUseCase } from '../../src/usecase/createPaymentUser'
import { clearDB } from '../_clearDB'

jest.mock('../../src/stripe/index')

const twinteUserId = v4()

beforeAll(async () => {
  await connectDatabase()
  await clearDB()
})

test('create', () => {
  // @ts-ignore
  mocked(stripe.customers.create).mockResolvedValue({
    id: 'foo',
  })
  return expect(createPaymentUserUseCase(twinteUserId)).resolves.toEqual(
    expect.objectContaining({
      twinteUserId,
      id: 'foo',
    })
  )
})

afterAll(disconnectDatabase)
