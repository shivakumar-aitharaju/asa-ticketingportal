import type { FastifySchema } from 'fastify'
import type { ZodSchema } from 'zod'
import { zodToJsonSchema } from 'zod-to-json-schema'

export function zodToFastifySchema(schema: ZodSchema): FastifySchema['body'] {
  const jsonSchema = zodToJsonSchema(schema as any, { target: 'openApi3', $refStrategy: 'none' })
  if ('$schema' in jsonSchema) delete jsonSchema.$schema
  return jsonSchema as FastifySchema['body']
}

export function zodToFastifyResponseSchema(schema: ZodSchema): FastifySchema['response'] {
  const jsonSchema = zodToJsonSchema(schema as any, { target: 'openApi3', $refStrategy: 'none' })
  if ('$schema' in jsonSchema) delete jsonSchema.$schema
  return jsonSchema as FastifySchema['response']
}
