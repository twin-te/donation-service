import { connectDatabase } from './database'
import { startGrpcServer } from './grpc'
import { logger } from './logger'
import { scheduleTotalAmountUpdate } from './usecase/getTotalAmount'
import { scheduleListContributorsUpdate } from './usecase/listContributors'

async function main() {
  logger.info('starting...')
  await connectDatabase()
  await startGrpcServer()
  scheduleListContributorsUpdate()
  scheduleTotalAmountUpdate()
}

main()
