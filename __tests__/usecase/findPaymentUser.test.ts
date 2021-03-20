import { mocked } from 'ts-jest/utils'
import { v4 } from 'uuid'
import { connectDatabase, disconnectDatabase } from '../../src/database'
import { createPaymentUserUseCase } from '../../src/usecase/createPaymentUser'
import { findPaymentUserUseCase } from '../../src/usecase/findPaymentUser'
import { clearDB } from '../_clearDB'

jest.mock('../../src/stripe/index')
jest.mock('../../src/usecase/createPaymentUser')

const twinteUserId = v4()
let customer: string | undefined

beforeAll(async () => {
  await connectDatabase()
  await clearDB()
})

test('初回', async () => {
  mocked(createPaymentUserUseCase).mockResolvedValue({
    id: 'foo',
    twinteUserId,
    displayName: null,
    link: null,
  })
  const paymentUser = await findPaymentUserUseCase(twinteUserId)
  expect(paymentUser).toEqual({
    id: expect.any(String),
    twinteUserId,
    displayName: null,
    link: null,
  })
  customer = paymentUser.id
})

test('二回目以降は生成済みのcustomerが返る', () =>
  expect(findPaymentUserUseCase(twinteUserId)).resolves.toEqual(
    expect.objectContaining({
      id: customer,
    })
  ))

afterAll(disconnectDatabase)
