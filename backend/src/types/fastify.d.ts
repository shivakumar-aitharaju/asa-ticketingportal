import { JWT } from '@fastify/jwt'
import { FastifyRequest, FastifyReply } from 'fastify'
import { DataSource } from 'typeorm'
import { UserRole } from './user-role.enum'

declare module '@fastify/jwt' {
  interface JWT {
    refresh: JWT
  }
}

declare module 'fastify' {
  interface FastifyInstance {
    config: {
      PORT: number
      NODE_ENV: string
      DB_HOST: string
      DB_PORT: number
      DB_USER: string
      DB_PASSWORD: string
      DB_NAME: string
      JWT_SECRET: string
      JWT_EXPIRES_IN: string
      JWT_REFRESH_SECRET: string
      JWT_REFRESH_EXPIRES_IN: string
      FRONTEND_URL: string
      SEED_ADMIN_EMAIL: string
      SEED_ADMIN_PASSWORD: string
      MS_GRAPH_TENANT_ID?: string
      MS_GRAPH_CLIENT_ID?: string
      MS_GRAPH_CLIENT_SECRET?: string
      MS_GRAPH_SENDER_EMAIL?: string
      EMAIL_METHOD?: 'smtp' | 'graph' | 'auto'
      AWS_S3_BUCKET_NAME?: string
      AWS_REGION?: string
      AWS_ACCESS_KEY_ID?: string
      AWS_SECRET_ACCESS_KEY?: string
      REDIS_HOST: string
      REDIS_PORT: number
      REDIS_PASSWORD?: string
      SEND_EMAIL_NOTIFICATIONS: boolean
      SEND_REAL_NOTIFICATIONS: boolean
    }
    jwt: JWT
    dataSource: DataSource
    authenticate(request: FastifyRequest, reply: FastifyReply): Promise<void>
    authorize(roles: UserRole[]): (request: FastifyRequest, reply: FastifyReply) => Promise<void>
    getUserId(request: FastifyRequest): string | null
    getUserRole(request: FastifyRequest): UserRole | null
  }

  interface FastifyRequest {
    user?: {
      id: string
      role: UserRole
      email: string
      departmentId?: string | null
    }
  }
}
