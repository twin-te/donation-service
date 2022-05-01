import { startGrpcServer, stopGrpcServer } from '../../src/grpc'
import * as protoLoader from '@grpc/proto-loader'
import path from 'path'
import * as grpc from '@grpc/grpc-js'
import {
  DonationService,
  PaymentStatus,
  PaymentType,
  SubscriptionStatus,
} from '../../generated'
import { ServiceClientConstructor } from '@grpc/grpc-js/build/src/make-client'
import { GrpcClient } from '../../src/grpc/type'
import { mocked } from 'ts-jest/utils'
import { createOneTimeCheckoutSessionUseCase } from '../../src/usecase/createOneTimeCheckoutSession'
import { v4 } from 'uuid'
import { Status } from '@grpc/grpc-js/build/src/constants'
import { createSubscriptionCheckoutSessionUseCase } from '../../src/usecase/createSubscriptionCheckoutSession'
import { listPaymentHistoryUseCase } from '../../src/usecase/listPaymentHistory'
import { deepContaining } from '../_deepContaining'
import { listSubscriptionUseCase } from '../../src/usecase/listSubscription'
import { unsubscribeUseCase } from '../../src/usecase/unsubscribe'
import { NotFoundError } from '../../src/error'
import { getTotalAmountUseCase } from '../../src/usecase/getTotalAmount'
import { listContributorUseCase } from '../../src/usecase/listContributors'
import { findPaymentUserUseCase } from '../../src/usecase/findPaymentUser'
import { updatePaymentUserUseCase } from '../../src/usecase/updatePaymentUser'

jest.mock('../../src/usecase/createOneTimeCheckoutSession')
jest.mock('../../src/usecase/createSubscriptionCheckoutSession')
jest.mock('../../src/usecase/listPaymentHistory')
jest.mock('../../src/usecase/listSubscription')
jest.mock('../../src/usecase/unsubscribe')
jest.mock('../../src/usecase/findPaymentUser')
jest.mock('../../src/usecase/updatePaymentUser')
jest.mock('../../src/usecase/getTotalAmount')
jest.mock('../../src/usecase/listContributors')

const def = protoLoader.loadSync(
  path.resolve(__dirname, `../../protos/DonationService.proto`)
)
const pkg = grpc.loadPackageDefinition(def)
const ClientConstructor = pkg.DonationService as ServiceClientConstructor
let client: GrpcClient<DonationService>

const userId = v4()

beforeAll(async () => {
  await startGrpcServer()
  client = (new ClientConstructor(
    'localhost:50051',
    grpc.ChannelCredentials.createInsecure()
  ) as unknown) as GrpcClient<DonationService>
})

describe('createOneTimeCheckoutSession', () => {
  test('ユーザーIDあり成功', (done) => {
    mocked(createOneTimeCheckoutSessionUseCase).mockImplementation(
      // @ts-ignore
      async (amount, userId) => {
        expect(amount).toBe(500)
        expect(userId).toEqual(userId)
        return {
          id: 'foo',
        }
      }
    )
    client.createOneTimeCheckoutSession({ amount: 500, userId }, (err, res) => {
      expect(err).toBeNull()
      expect(res?.id).toEqual('foo')
      done()
    })
  })
  test('ユーザーIDなし成功', (done) => {
    mocked(createOneTimeCheckoutSessionUseCase).mockImplementation(
      // @ts-ignore
      async (amount, userId) => {
        expect(amount).toBe(500)
        expect(userId).toBeUndefined()
        return {
          id: 'foo',
        }
      }
    )
    client.createOneTimeCheckoutSession({ amount: 500 }, (err, res) => {
      expect(err).toBeNull()
      expect(res?.id).toEqual('foo')
      done()
    })
  })
  test('失敗', (done) => {
    mocked(createOneTimeCheckoutSessionUseCase).mockImplementation(() => {
      throw new Error('Unexpected Error!')
    })
    client.createOneTimeCheckoutSession({ amount: 500 }, (err, res) => {
      expect(err?.code).toBe(Status.UNKNOWN)
      done()
    })
  })
})

describe('createSubscriptionCheckoutSession', () => {
  test('ユーザーIDあり成功', (done) => {
    mocked(createSubscriptionCheckoutSessionUseCase).mockImplementation(
      // @ts-ignore
      async (planId, userId) => {
        expect(planId).toBe('plan_foo')
        expect(userId).toEqual(userId)
        return {
          id: 'foo',
        }
      }
    )
    client.createSubscriptionCheckoutSession(
      { planId: 'plan_foo', userId },
      (err, res) => {
        expect(err).toBeNull()
        expect(res?.id).toEqual('foo')
        done()
      }
    )
  })
  test('失敗', (done) => {
    mocked(createSubscriptionCheckoutSessionUseCase).mockImplementation(() => {
      throw new Error('Unexpected Error!')
    })
    client.createSubscriptionCheckoutSession(
      { planId: 'plan_foo', userId },
      (err, res) => {
        expect(err?.code).toBe(Status.UNKNOWN)
        done()
      }
    )
  })
})

describe('listPaymentHistory', () => {
  test('成功', (done) => {
    // @ts-ignore
    mocked(listPaymentHistoryUseCase).mockImplementation(async (id) => {
      expect(id).toEqual(userId)
      return [
        {
          id: 'foo',
          invoice: null,
          status: 'succeeded',
          amount: 500,
          created: 1651373136,
        },
        {
          id: 'bar',
          invoice: 'hoge',
          status: 'canceled',
          amount: 500,
          created: 1654051536,
        },
        {
          id: 'hoge',
          invoice: null,
          status: 'requires_action',
          amount: 500,
          created: 1680921936,
        },
      ]
    })
    client.listPaymentHistory({ userId }, (err, res) => {
      expect(err).toBeNull()
      expect(res?.payments).toEqual(
        deepContaining([
          {
            id: 'foo',
            type: PaymentType.OneTime,
            status: PaymentStatus.Succeeded,
            amount: 500,
            created: 1651373136,
          },
          {
            id: 'bar',
            type: PaymentType.Subscription,
            status: PaymentStatus.Canceled,
            amount: 500,
            created: 1654051536,
          },
          {
            id: 'hoge',
            type: PaymentType.OneTime,
            status: PaymentStatus.Pending,
            amount: 500,
            created: 1680921936,
          },
        ])
      )
      done()
    })
  })
  test('失敗', (done) => {
    mocked(listPaymentHistoryUseCase).mockImplementation(() => {
      throw new Error('Unexpected Error!')
    })
    client.listPaymentHistory({ userId }, (err, res) => {
      expect(err?.code).toBe(Status.UNKNOWN)
      done()
    })
  })
})

describe('listSubscription', () => {
  test('成功', (done) => {
    //@ts-ignore
    mocked(listSubscriptionUseCase).mockImplementation(async (id) => {
      expect(id).toEqual(userId)
      return [
        {
          id: 'foo',
          status: 'active',
          items: {
            data: [
              {
                plan: { id: 'plan_foo', nickname: 'nickname_foo', amount: 500 },
              },
            ],
          },
          created: 1646102736,
        },
        {
          id: 'bar',
          status: 'canceled',
          items: {
            data: [
              {
                plan: {
                  id: 'plan_bar',
                  nickname: 'nickname_bar',
                  amount: 1000,
                },
              },
            ],
          },
          created: 1649385936,
        },
      ]
    })
    client.listSubscription({ userId }, (err, res) => {
      expect(err).toBeNull()
      expect(res?.subscriptions).toEqual(
        deepContaining([
          {
            id: 'foo',
            status: SubscriptionStatus.Active,
            plans: [{ id: 'plan_foo', name: 'nickname_foo', amount: 500 }],
            created: 1646102736,
          },
          {
            id: 'bar',
            status: SubscriptionStatus.Canceled,
            plans: [{ id: 'plan_bar', name: 'nickname_bar', amount: 1000 }],
            created: 1649385936,
          },
        ])
      )
      done()
    })
  })

  test('失敗', (done) => {
    //@ts-ignore
    mocked(listSubscriptionUseCase).mockImplementation(() => {
      throw new Error('Unexpected Error!')
    })
    client.listSubscription({ userId }, (err, res) => {
      expect(err?.code).toBe(Status.UNKNOWN)
      done()
    })
  })
})

describe('unsubscribe', () => {
  test('成功', (done) => {
    const subscriptionId = 'subid'
    mocked(unsubscribeUseCase).mockImplementation(async (id, subId) => {
      expect(id).toEqual(userId)
      expect(subId).toEqual(subscriptionId)
    })
    client.unsubscribe({ userId, id: subscriptionId }, (err, res) => {
      expect(err).toBeNull()
      done()
    })
  })
  test('NotFound', (done) => {
    const subscriptionId = 'subid'
    mocked(unsubscribeUseCase).mockRejectedValue(
      new NotFoundError('指定されたサブスクリプションは見つかりませんでした')
    )
    client.unsubscribe({ userId, id: subscriptionId }, (err, res) => {
      expect(err?.code).toBe(Status.NOT_FOUND)
      done()
    })
  })
  test('失敗', (done) => {
    const subscriptionId = 'subid'
    mocked(unsubscribeUseCase).mockImplementation(async (id, subId) => {
      throw new Error('Unexpected Error!')
    })
    client.unsubscribe({ userId, id: subscriptionId }, (err, res) => {
      expect(err?.code).toBe(Status.UNKNOWN)
      done()
    })
  })
})

describe('getTotalAmount', () => {
  test('成功 mandatory', (done) => {
    mocked(getTotalAmountUseCase).mockImplementation(async (m) => {
      expect(m).toBe(true)
      return 10000
    })
    client.getTotalAmount({ mandatory: true }, (err, res) => {
      expect(err).toBeNull()
      expect(res?.total).toEqual(10000)
      done()
    })
  })
  test('成功 not mandatory', (done) => {
    mocked(getTotalAmountUseCase).mockImplementation(async (m) => {
      expect(m).toBe(false)
      return 10000
    })
    client.getTotalAmount({}, (err, res) => {
      expect(err).toBeNull()
      expect(res?.total).toEqual(10000)
      done()
    })
  })
  test('失敗', (done) => {
    mocked(getTotalAmountUseCase).mockRejectedValue(
      new Error('Unexpected Error')
    )
    client.getTotalAmount({}, (err, res) => {
      expect(err?.code).toBe(Status.UNKNOWN)
      done()
    })
  })
})

describe('listContributors', () => {
  const contributors = [
    {
      displayName: 'foo',
      link: 'foo_link',
    },
    {
      displayName: 'bar',
      link: 'bar_link',
    },
  ]
  test('成功 mandatory', (done) => {
    //@ts-ignore
    mocked(listContributorUseCase).mockImplementation(async (m) => {
      expect(m).toBe(true)
      return contributors
    })
    client.listContributors({ mandatory: true }, (err, res) => {
      expect(err).toBeNull()
      expect(res?.contributors).toEqual(deepContaining(contributors))
      done()
    })
  })
  test('成功 not mandatory', (done) => {
    //@ts-ignore
    mocked(listContributorUseCase).mockImplementation(async (m) => {
      expect(m).toBe(false)
      return contributors
    })
    client.listContributors({}, (err, res) => {
      expect(err).toBeNull()
      expect(res?.contributors).toEqual(deepContaining(contributors))
      done()
    })
  })
  test('失敗', (done) => {
    mocked(listContributorUseCase).mockRejectedValue(
      new Error('Unexpected Error')
    )
    client.listContributors({}, (err, res) => {
      expect(err?.code).toBe(Status.UNKNOWN)
      done()
    })
  })
})

describe('getPaymentUser', () => {
  test('成功', (done) => {
    mocked(findPaymentUserUseCase).mockImplementation(async (id) => {
      expect(id).toEqual(userId)
      return {
        id: 'foo',
        twinteUserId: id,
        displayName: 'hoge',
        link: 'fuga',
      }
    })
    client.getPaymentUser({ userId }, (err, res) => {
      expect(err).toBeNull()
      expect(res).toEqual({
        id: 'foo',
        userId,
        displayName: 'hoge',
        link: 'fuga',
      })
      done()
    })
  })
  test('失敗', (done) => {
    mocked(findPaymentUserUseCase).mockRejectedValue(
      new Error('Unexpected Error!')
    )
    client.getPaymentUser({ userId }, (err, res) => {
      expect(err?.code).toBe(Status.UNKNOWN)
      done()
    })
  })
})

describe('updatePaymentUser', () => {
  test('成功', (done) => {
    mocked(updatePaymentUserUseCase).mockImplementation(
      async (id, displayName, link) => {
        expect(id).toEqual(userId)
        expect(displayName).toEqual('hoge')
        expect(link).toEqual('fuga')
        return {
          id: 'foo',
          twinteUserId: id,
          displayName: 'hoge',
          link: 'fuga',
        }
      }
    )
    client.updatePaymentUser(
      { userId, displayName: 'hoge', link: 'fuga' },
      (err, res) => {
        expect(err).toBeNull()
        expect(res).toEqual({
          id: 'foo',
          userId,
          displayName: 'hoge',
          link: 'fuga',
        })
        done()
      }
    )
  })
  test('成功 null', (done) => {
    mocked(updatePaymentUserUseCase).mockImplementation(
      async (id, displayName, link) => {
        expect(id).toEqual(userId)
        expect(displayName).toEqual(null)
        expect(link).toEqual(null)
        return {
          id: 'foo',
          twinteUserId: id,
          displayName: null,
          link: null,
        }
      }
    )
    client.updatePaymentUser({ userId }, (err, res) => {
      expect(err).toBeNull()
      expect(res).toEqual({
        id: 'foo',
        userId,
        displayName: '',
        link: '',
      })
      done()
    })
  })
  test('失敗', (done) => {
    mocked(updatePaymentUserUseCase).mockRejectedValue(
      new Error('Unexpected Error!')
    )
    client.updatePaymentUser({ userId }, (err, res) => {
      expect(err?.code).toBe(Status.UNKNOWN)
      done()
    })
  })
})

afterAll(stopGrpcServer)
