import 'reflect-metadata'
import { createConnection, getConnection } from 'typeorm'
import { logger } from '../logger'
import { PaymentUser } from './model/PaymentUser'

/**
 * postgresへ接続
 */
export async function connectDatabase() {
  const config = {
    host: process.env.PG_HOST ?? 'postgres',
    port: parseInt(process.env.PG_PORT ?? '5432'),
    username: process.env.PG_USERNAME ?? 'postgres',
    password: process.env.PG_PASSWORD ?? 'postgres',
    database: process.env.PG_DATABASE ?? 'twinte_donation_service',
  }

  logger.debug('postgres config', { ...config, password: '*****' })

  const conn = await createConnection({
    type: 'postgres',
    ...config,
    entities: [PaymentUser],
    synchronize: true,
  })
  logger.info('connected to postgres.')
  return conn
}

/**
 * postgresから切断
 */
export function disconnectDatabase() {
  return getConnection().close()
}
