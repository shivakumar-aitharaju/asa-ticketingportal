import type { FastifyInstance } from 'fastify'
import type { DataSource } from 'typeorm'
import { Client as GraphClient, type AuthenticationProvider } from '@microsoft/microsoft-graph-client'
import { ClientSecretCredential } from '@azure/identity'
import { TicketService } from './ticket.service'
import { UserRole } from '../types/user-role.enum'
import { AttachmentService } from './attachment.service'

const POLL_INTERVAL_MS = 5 * 60 * 1000 // 5 minutes
const INGEST_MAILBOX = 'asa-tickets@asaind.co.in'

function buildGraphClient(tenantId: string, clientId: string, clientSecret: string): GraphClient {
  const credential = new ClientSecretCredential(tenantId, clientId, clientSecret)
  const authProvider: AuthenticationProvider = {
    getAccessToken: async () => {
      const token = await credential.getToken('https://graph.microsoft.com/.default')
      return token?.token ?? ''
    },
  }
  return GraphClient.initWithMiddleware({ authProvider })
}

export async function startEmailIngest(fastify: FastifyInstance, dataSource: DataSource) {
  const { MS_GRAPH_TENANT_ID, MS_GRAPH_CLIENT_ID, MS_GRAPH_CLIENT_SECRET } = process.env

  if (!MS_GRAPH_TENANT_ID || !MS_GRAPH_CLIENT_ID || !MS_GRAPH_CLIENT_SECRET || MS_GRAPH_CLIENT_SECRET === 'YOUR_MS_GRAPH_CLIENT_SECRET') {
    fastify.log.warn('[email-ingest] MS Graph credentials not configured — email→ticket disabled')
    return
  }

  const ticketService = new TicketService(dataSource, fastify)
  const attachmentService = new AttachmentService(dataSource)
  const userRepo = dataSource.getRepository(require('../entities/user.entity').User)

  async function poll() {
    try {
      const graph = buildGraphClient(MS_GRAPH_TENANT_ID!, MS_GRAPH_CLIENT_ID!, MS_GRAPH_CLIENT_SECRET!)

      // Get unread emails from the ingest mailbox
      const messages = await graph
        .api(`/users/${INGEST_MAILBOX}/mailFolders/Inbox/messages`)
        .filter('isRead eq false')
        .select('id,subject,bodyPreview,body,from,toRecipients,hasAttachments,receivedDateTime')
        .top(20)
        .get()

      if (!messages?.value?.length) return

      for (const email of messages.value) {
        try {
          await processEmail(email, graph, ticketService, attachmentService, userRepo, fastify)
        } catch (err: any) {
          fastify.log.error(`[email-ingest] Failed to process email ${email.id}: ${err.message}`)
        }
      }
    } catch (err: any) {
      fastify.log.error(`[email-ingest] Poll error: ${err.message}`)
    }
  }

  // Initial poll after 30s startup delay
  setTimeout(() => {
    poll()
    setInterval(poll, POLL_INTERVAL_MS)
  }, 30_000)

  fastify.log.info(`[email-ingest] Started — polling ${INGEST_MAILBOX} every ${POLL_INTERVAL_MS / 60000} min`)
}

async function processEmail(
  email: any,
  graph: GraphClient,
  ticketService: TicketService,
  attachmentService: AttachmentService,
  userRepo: any,
  fastify: FastifyInstance,
) {
  const senderEmail = email.from?.emailAddress?.address?.toLowerCase()
  const subject = email.subject || '(No subject)'
  const body = email.body?.content
    ? stripHtml(email.body.content)
    : email.bodyPreview || '(No body)'

  // Find sender user or fall back to admin
  let creatorId: string
  const senderUser = await userRepo.findOne({ where: { email: senderEmail } })
  if (senderUser) {
    creatorId = senderUser.id
  } else {
    const admin = await userRepo.findOne({ where: { role: 'admin' } })
    if (!admin) {
      fastify.log.warn(`[email-ingest] No admin found, skipping email ${email.id}`)
      await markRead(graph, email.id)
      return
    }
    creatorId = admin.id
  }

  // Get default department (first one)
  const deptResult = await ticketService['ticketRepo'].manager.query(
    `SELECT id FROM departments WHERE deleted_at IS NULL LIMIT 1`
  )
  if (!deptResult?.length) {
    fastify.log.warn('[email-ingest] No departments found')
    await markRead(graph, email.id)
    return
  }

  const description = senderUser
    ? body
    : `[Email from: ${senderEmail}]\n\n${body}`

  const ticket = await ticketService.create(
    {
      subject: subject.slice(0, 500),
      description: description.slice(0, 10000) || 'No details provided.',
      departmentId: deptResult[0].id,
      priority: 'low' as any,
      isEscalated: false,
      tags: ['email'],
    },
    creatorId
  )

  fastify.log.info(`[email-ingest] Created ticket ${ticket.ticketNumber} from email "${subject}"`)

  // Process attachments
  if (email.hasAttachments) {
    try {
      const atts = await graph.api(`/users/${INGEST_MAILBOX}/messages/${email.id}/attachments`).get()
      for (const att of atts?.value ?? []) {
        if (att['@odata.type'] === '#microsoft.graph.fileAttachment' && att.contentBytes) {
          const buffer = Buffer.from(att.contentBytes, 'base64')
          const mockFile = {
            filename: att.name || 'attachment',
            mimetype: att.contentType || 'application/octet-stream',
            toBuffer: async () => buffer,
          }
          await attachmentService.upload(ticket.id, creatorId, mockFile as any)
        }
      }
    } catch (err: any) {
      fastify.log.warn(`[email-ingest] Attachment processing failed for ${ticket.ticketNumber}: ${err.message}`)
    }
  }

  await markRead(graph, email.id)
}

async function markRead(graph: GraphClient, messageId: string) {
  try {
    await graph.api(`/users/${INGEST_MAILBOX}/messages/${messageId}`).patch({ isRead: true })
  } catch (err: any) {
    // Non-fatal
  }
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
}
