import { getRepository, IsNull, Not } from 'typeorm'
import { PaymentUser } from '../database/model/PaymentUser'
import { listPaymentHistoryUseCase } from './listPaymentHistory'
import { logger, logger as schedulerLogger } from '../logger'
import schedule from 'node-schedule'

let cachedUsers: PaymentUser[] | undefined

/**
 * 寄付してくれたユーザー一覧を取得
 * StripeAPIの上限回避のため、値をキャッシュする（10分ごとに更新）
 * @param mandatory 強制的に最新情報に更新
 * @returns
 */
export async function listContributorUseCase(
  mandatory: boolean
): Promise<PaymentUser[]> {
  if (mandatory || !cachedUsers) await updateData()
  return cachedUsers!
}

async function updateData() {
  logger.info('寄付者一覧を更新中')
  const users = await getRepository(PaymentUser).find({
    displayName: Not(IsNull()), // 名前を設定しているユーザーのみ
  })
  const mask = await Promise.all(
    users.map(async (u) => {
      const history = await listPaymentHistoryUseCase(u.twinteUserId)
      // 成功した寄付があるか判定
      return history.some((h) => h.status === 'succeeded' && h.amount > 0)
    })
  )
  cachedUsers = users.filter((_, i) => mask[i])
  logger.info('寄付者一覧の更新完了')
}

schedule.scheduleJob('* /10 * * * *', () => updateData())
