import { stripe } from '../stripe'
import schedule from 'node-schedule'
import { logger, logger as schedulerLogger } from '../logger'

let cachedTotalAmount: number | undefined
let pending: Promise<void> | undefined

export async function getTotalAmountUseCase(
  mandatory: boolean
): Promise<number> {
  if ((mandatory || !cachedTotalAmount) && !pending) await updateData()
  else if (pending) await pending
  return cachedTotalAmount!
}

async function updateData() {
  logger.info('寄付総額の更新開始')
  let sum = 0
  let starting_after: string | undefined
  while (true) {
    const intents = await stripe.paymentIntents.list({
      limit: 100,
      starting_after,
    })
    sum += intents.data
      .filter((i) => i.status === 'succeeded')
      .map((i) => i.amount)
      .reduce((p, c) => p + c)
    if (!intents.has_more) break
    starting_after = intents.data[intents.data.length - 1].id
    await delay(40)
  }
  cachedTotalAmount = sum
  logger.info('寄付総額の更新完了')
}

function delay(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

schedule.scheduleJob('* /10 * * * *', async () => {
  pending = updateData()
  await pending
  pending = undefined
})
