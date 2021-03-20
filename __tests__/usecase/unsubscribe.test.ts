import { v4 } from 'uuid'
import { connectDatabase, disconnectDatabase } from '../../src/database'
import { clearDB } from '../_clearDB'
import { mocked } from 'ts-jest/utils'
import { stripe } from '../../src/stripe'
import { findPaymentUserUseCase } from '../../src/usecase/findPaymentUser'
import { listSubscriptionUseCase } from '../../src/usecase/listSubscription'
import { unsubscribeUseCase } from '../../src/usecase/unsubscribe'
import { NotFoundError } from '../../src/error'

jest.mock('../../src/stripe/index')
jest.mock('../../src/usecase/findPaymentUser')
jest.mock('../../src/usecase/listSubscription')

const twinteUserId = v4()
const subscriptionId = 'hoge'

beforeAll(async () => {
  await connectDatabase()
  await clearDB()
})

test('成功', async () => {
  mocked(findPaymentUserUseCase).mockResolvedValue({
    id: 'hoge',
    twinteUserId,
    displayName: null,
    link: null,
  })
  //@ts-ignore
  mocked(listSubscriptionUseCase).mockResolvedValue([{ id: subscriptionId }])
  //@ts-ignore
  mocked(stripe.subscriptions.del).mockResolvedValue({ status: 'canceled' })
  const res = await unsubscribeUseCase(twinteUserId, subscriptionId)
})

test('指定されたサブスクリプションIDが無効', () => {
  mocked(findPaymentUserUseCase).mockResolvedValue({
    id: 'hoge',
    twinteUserId,
    displayName: null,
    link: null,
  })
  //@ts-ignore
  mocked(listSubscriptionUseCase).mockResolvedValue([{ id: subscriptionId }])
  return expect(unsubscribeUseCase(twinteUserId, 'fuga')).rejects.toThrow(
    NotFoundError
  )
})

test('キャンセルにならなかった（起こり得ないはずだが一応）', async () => {
  mocked(findPaymentUserUseCase).mockResolvedValue({
    id: 'hoge',
    twinteUserId,
    displayName: null,
    link: null,
  })
  //@ts-ignore
  mocked(listSubscriptionUseCase).mockResolvedValue([{ id: subscriptionId }])
  //@ts-ignore
  mocked(stripe.subscriptions.del).mockResolvedValue({ status: 'incomplete' })
  return expect(
    unsubscribeUseCase(twinteUserId, subscriptionId)
  ).rejects.toThrow()
})

afterAll(disconnectDatabase)
