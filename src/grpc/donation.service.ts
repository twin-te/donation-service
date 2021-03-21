import dayjs from 'dayjs'
import {
  DonationService,
  CheckoutSession,
  ListPaymentHistoryResponse,
  PaymentType,
  PaymentStatus,
  ListSubscriptionResponse,
  SubscriptionStatus,
  UnsubscribeResponse,
  UpdatePaymentUserResponse,
  GetTotalAmountResponse,
  ListContributorsResponse,
} from '../../generated'
import { createOneTimeCheckoutSessionUseCase } from '../usecase/createOneTimeCheckoutSession'
import { createSubscriptionCheckoutSessionUseCase } from '../usecase/createSubscriptionCheckoutSession'
import { getTotalAmountUseCase } from '../usecase/getTotalAmount'
import { listContributorUseCase } from '../usecase/listContributors'
import { listPaymentHistoryUseCase } from '../usecase/listPaymentHistory'
import { listSubscriptionUseCase } from '../usecase/listSubscription'
import { unsubscribeUseCase } from '../usecase/unsubscribe'
import { updatePaymentUserUseCase } from '../usecase/updatePaymentUser'
import { toGrpcError } from './converter'
import { GrpcServer } from './type'

export const donationService: GrpcServer<DonationService> = {
  async createOneTimeCheckoutSession({ request }, callback) {
    try {
      const session = await createOneTimeCheckoutSessionUseCase(
        request.amount,
        request.userId !== '' ? request.userId : undefined
      )
      callback(
        null,
        CheckoutSession.create({
          id: session.id,
        })
      )
    } catch (e) {
      callback(toGrpcError(e))
    }
  },
  async createSubscriptionCheckoutSession({ request }, callback) {
    try {
      const session = await createSubscriptionCheckoutSessionUseCase(
        request.planId,
        request.userId
      )
      callback(
        null,
        CheckoutSession.create({
          id: session.id,
        })
      )
    } catch (e) {
      callback(toGrpcError(e))
    }
  },
  async listPaymentHistory({ request }, callback) {
    try {
      const payments = await listPaymentHistoryUseCase(request.userId)
      callback(
        null,
        ListPaymentHistoryResponse.create({
          payments: payments.map((p) => ({
            id: p.id,
            type: p.invoice ? PaymentType.Subscription : PaymentType.OneTime,
            status:
              p.status === 'succeeded'
                ? PaymentStatus.Succeeded
                : p.status === 'canceled'
                ? PaymentStatus.Canceled
                : PaymentStatus.Pending,
            amount: p.amount,
            created: dayjs(p.created).toISOString(),
          })),
        })
      )
    } catch (e) {
      callback(toGrpcError(e))
    }
  },
  async listSubscription({ request }, callback) {
    try {
      const subscriptions = await listSubscriptionUseCase(request.userId)
      callback(
        null,
        ListSubscriptionResponse.create({
          subscriptions: subscriptions.map((s) => ({
            id: s.id,
            status:
              s.status === 'active'
                ? SubscriptionStatus.Active
                : SubscriptionStatus.Canceled,
            plans: s.items.data.map((i) => ({
              id: i.plan.id,
              name: i.plan.nickname,
              amount: i.plan.amount,
            })),
            created: dayjs(s.created).toISOString(),
          })),
        })
      )
    } catch (e) {
      callback(e)
    }
  },
  async unsubscribe({ request }, callback) {
    try {
      await unsubscribeUseCase(request.userId, request.id)
      callback(null, UnsubscribeResponse.create())
    } catch (e) {
      callback(toGrpcError(e))
    }
  },
  async updatePaymentUser({ request }, callback) {
    try {
      await updatePaymentUserUseCase(
        request.userId,
        request.displayName,
        request.link
      )
      callback(null, UpdatePaymentUserResponse.create())
    } catch (e) {
      callback(toGrpcError(e))
    }
  },
  async getTotalAmount({ request }, callback) {
    try {
      const total = await getTotalAmountUseCase(request.mandatory)
      callback(null, GetTotalAmountResponse.create({ total }))
    } catch (e) {
      callback(toGrpcError(e))
    }
  },
  async listContributors({ request }, callback) {
    try {
      const contributors = await listContributorUseCase(request.mandatory)
      callback(null, ListContributorsResponse.create({ contributors }))
    } catch (e) {
      callback(toGrpcError(e))
    }
  },
}
