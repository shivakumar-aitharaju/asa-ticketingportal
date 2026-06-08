import env, { FastifyEnvOptions } from '@fastify/env'
import fp from 'fastify-plugin'

const schema = {
  type: 'object',
  required: ['PORT', 'NODE_ENV', 'DB_HOST', 'DB_PORT', 'DB_USER', 'DB_PASSWORD', 'DB_NAME', 'JWT_SECRET'],
  properties: {
    PORT: { type: 'number', default: 8090 },
    NODE_ENV: { type: 'string', default: 'development' },
    DB_HOST: { type: 'string' },
    DB_PORT: { type: 'number', default: 5432 },
    DB_USER: { type: 'string' },
    DB_PASSWORD: { type: 'string' },
    DB_NAME: { type: 'string' },
    JWT_SECRET: { type: 'string' },
    JWT_EXPIRES_IN: { type: 'string', default: '30m' },
    JWT_REFRESH_SECRET: { type: 'string' },
    JWT_REFRESH_EXPIRES_IN: { type: 'string', default: '30d' },
    FRONTEND_URL: { type: 'string', default: 'http://localhost:8091' },
    SEED_ADMIN_EMAIL: { type: 'string' },
    SEED_ADMIN_PASSWORD: { type: 'string' },
    MS_GRAPH_TENANT_ID: { type: 'string' },
    MS_GRAPH_CLIENT_ID: { type: 'string' },
    MS_GRAPH_CLIENT_SECRET: { type: 'string' },
    MS_GRAPH_SENDER_EMAIL: { type: 'string' },
    EMAIL_METHOD: { type: 'string', default: 'graph', enum: ['smtp', 'graph', 'auto'] },
    AWS_S3_BUCKET_NAME: { type: 'string' },
    AWS_REGION: { type: 'string', default: 'ap-south-1' },
    AWS_ACCESS_KEY_ID: { type: 'string' },
    AWS_SECRET_ACCESS_KEY: { type: 'string' },
    REDIS_HOST: { type: 'string', default: 'localhost' },
    REDIS_PORT: { type: 'number', default: 6379 },
    REDIS_PASSWORD: { type: 'string' },
    SEND_EMAIL_NOTIFICATIONS: { type: 'boolean', default: false },
    SEND_REAL_NOTIFICATIONS: { type: 'boolean', default: false },
  }
}

const options: FastifyEnvOptions = { confKey: 'config', schema, dotenv: true }

export default fp<FastifyEnvOptions>(async function (fastify) {
  await fastify.register(env, options)
}, { name: 'env' })
