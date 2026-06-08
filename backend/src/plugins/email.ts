import fp from 'fastify-plugin'
import { ClientSecretCredential } from '@azure/identity'
import { Client } from '@microsoft/microsoft-graph-client'
import { TokenCredentialAuthenticationProvider } from '@microsoft/microsoft-graph-client/authProviders/azureTokenCredentials'

declare module 'fastify' {
  interface FastifyInstance {
    sendEmail: (to: string, subject: string, html: string) => Promise<void>
  }
}

export default fp(async function (fastify) {
  fastify.decorate('sendEmail', async function (to: string, subject: string, html: string) {
    const sendEnabled = fastify.config.SEND_EMAIL_NOTIFICATIONS

    if (!sendEnabled) {
      fastify.log.info(`[EMAIL SKIP] To: ${to} | Subject: ${subject}`)
      return
    }

    try {
      const credential = new ClientSecretCredential(
        fastify.config.MS_GRAPH_TENANT_ID,
        fastify.config.MS_GRAPH_CLIENT_ID,
        fastify.config.MS_GRAPH_CLIENT_SECRET
      )

      const authProvider = new TokenCredentialAuthenticationProvider(credential, {
        scopes: ['https://graph.microsoft.com/.default']
      })

      const graphClient = Client.initWithMiddleware({ authProvider })

      await graphClient.api(`/users/${fastify.config.MS_GRAPH_SENDER_EMAIL}/sendMail`).post({
        message: {
          subject,
          body: { contentType: 'HTML', content: html },
          toRecipients: [{ emailAddress: { address: to } }]
        }
      })
    } catch (err) {
      fastify.log.error({ err }, `Failed to send email to ${to}`)
    }
  })
}, { name: 'email', dependencies: ['env'] })
