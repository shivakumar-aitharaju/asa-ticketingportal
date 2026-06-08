import 'reflect-metadata'
import Fastify from 'fastify'
import { app, options } from './app'

async function start() {
  const server = Fastify({
    logger: { level: process.env.NODE_ENV === 'production' ? 'info' : 'debug' },
  })

  await server.register(app, options)
  await server.listen({
    port: parseInt(process.env.PORT ?? '8090', 10),
    host: '0.0.0.0',
  })
}

start().catch(err => {
  console.error(err)
  process.exit(1)
})
