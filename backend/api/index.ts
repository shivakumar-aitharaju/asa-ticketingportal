import 'reflect-metadata'
import Fastify from 'fastify'
import type { VercelRequest, VercelResponse } from '@vercel/node'

// Re-use the same Fastify instance across warm Lambda invocations
let instance: ReturnType<typeof Fastify> | null = null

async function getApp() {
  if (instance) return instance

  instance = Fastify({ logger: false })

  // dist/ is produced by `pnpm build` (tsc) which Vercel runs before deploying
  const { app, options } = await import('../dist/app')
  await instance.register(app, options)
  await instance.ready()

  return instance
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const app = await getApp()
    app.server.emit('request', req, res)
  } catch (err: any) {
    console.error('[vercel-handler] startup error:', err?.message ?? err)
    res.status(500).json({
      error: { message: err?.message ?? 'Internal Server Error', statusCode: 500 },
    })
  }
}
