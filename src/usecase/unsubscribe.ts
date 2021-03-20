import { NotFoundError } from '../error'
import { stripe } from '../stripe'
import { listSubscriptionUseCase } from './listSubscription'

export async function unsubscribeUseCase(
  twinteUserId: string,
  subscriptionId: string
) {
  const subscriptions = await listSubscriptionUseCase(twinteUserId)
  if (!subscriptions.find((s) => s.id === subscriptionId))
    throw new NotFoundError(
      '指定されたサブスクリプションは見つかりませんでした'
    )
  const res = await stripe.subscriptions.del(subscriptionId)

  // 起こり得ないはずだが一応
  if (res.status !== 'canceled')
    throw new Error('サブスクリプションのキャンセルに失敗しました')
}
