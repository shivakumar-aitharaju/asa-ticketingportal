import 'reflect-metadata'
import fp from 'fastify-plugin'
import { DataSource } from 'typeorm'
import { AppDataSource } from '../configs/data-source'

declare module 'fastify' {
  interface FastifyInstance {
    dataSource: DataSource
  }
}

export default fp(async function (fastify) {
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize()
    fastify.log.info('TypeORM DataSource initialized')

    await AppDataSource.runMigrations()
    fastify.log.info('TypeORM migrations applied')
  }

  fastify.decorate('dataSource', AppDataSource)

  fastify.addHook('onClose', async (instance) => {
    if (instance.dataSource.isInitialized) {
      await instance.dataSource.destroy()
      fastify.log.info('TypeORM DataSource closed')
    }
  })
}, { name: 'typeorm', dependencies: ['env'] })
