import { getRepository } from 'typeorm'
import { v4 } from 'uuid'
import { connectDatabase, disconnectDatabase } from '../../src/database'
import { PaymentUser } from '../../src/database/model/PaymentUser'
import { clearDB } from '../_clearDB'
import { mocked } from 'ts-jest/utils'
import { stripe } from '../../src/stripe'
import { listContributorUseCase } from '../../src/usecase/listContributors'

jest.mock('../../src/stripe/index')

const twinteUserId = v4()

beforeAll(async () => {
  await connectDatabase()
  await clearDB()
  await getRepository(PaymentUser).save({
    id: 'foo',
    twinteUserId,
  })
})

test('名前の登録も寄付もない場合', async () => {
  // ユーザーが完了してない決済だけの場合
  mocked(stripe.paymentIntents.list).mockResolvedValue({
    //@ts-ignore
    data: [{ status: 'processing', amount: 500 }],
    has_more: false,
  })
  const res = await listContributorUseCase(false)
  expect(res.length).toBe(0) // 寄付者は空
})

test('寄付はあったが名前の登録がない場合', async () => {
  mocked(stripe.paymentIntents.list).mockResolvedValue({
    //@ts-ignore
    data: [{ status: 'succeeded', amount: 500 }],
    has_more: false,
  })
  const res = await listContributorUseCase(true)
  expect(res.length).toBe(0) // 寄付者は空
})

test('寄付も名前の登録もされたがキャッシュが有効な場合', async () => {
  await getRepository(PaymentUser).save({
    id: 'foo',
    twinteUserId,
    displayName: 'bar',
  })

  mocked(stripe.paymentIntents.list).mockResolvedValue({
    //@ts-ignore
    data: [{ status: 'succeeded', amount: 500 }],
    has_more: false,
  })
  const res = await listContributorUseCase(false)
  expect(res.length).toBe(0) // 寄付者は空
})

test('寄付も名前の登録もされて強制更新した場合', async () => {
  mocked(stripe.paymentIntents.list).mockResolvedValue({
    //@ts-ignore
    data: [{ status: 'succeeded', amount: 500 }],
    has_more: false,
  })
  const res = await listContributorUseCase(true)
  expect(res.length).toBe(1) // 寄付者に表示
})

test('寄付も名前の登録がなくなって強制更新した場合', async () => {
  await getRepository(PaymentUser).save({
    id: 'foo',
    twinteUserId,
    displayName: null,
  })

  mocked(stripe.paymentIntents.list).mockResolvedValue({
    //@ts-ignore
    data: [{ status: 'succeeded', amount: 500 }],
    has_more: false,
  })
  const res = await listContributorUseCase(true)
  expect(res.length).toBe(0) // 寄付者は空
})

afterAll(disconnectDatabase)
