"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.startEmailIngest = startEmailIngest;
const microsoft_graph_client_1 = require("@microsoft/microsoft-graph-client");
const identity_1 = require("@azure/identity");
const ticket_service_1 = require("./ticket.service");
const attachment_service_1 = require("./attachment.service");
const POLL_INTERVAL_MS = 5 * 60 * 1000;
const INGEST_MAILBOX = 'asa-tickets@asaind.co.in';
function buildGraphClient(tenantId, clientId, clientSecret) {
    const credential = new identity_1.ClientSecretCredential(tenantId, clientId, clientSecret);
    const authProvider = {
        getAccessToken: async () => {
            const token = await credential.getToken('https://graph.microsoft.com/.default');
            return token?.token ?? '';
        },
    };
    return microsoft_graph_client_1.Client.initWithMiddleware({ authProvider });
}
async function startEmailIngest(fastify, dataSource) {
    const { MS_GRAPH_TENANT_ID, MS_GRAPH_CLIENT_ID, MS_GRAPH_CLIENT_SECRET } = process.env;
    if (!MS_GRAPH_TENANT_ID || !MS_GRAPH_CLIENT_ID || !MS_GRAPH_CLIENT_SECRET || MS_GRAPH_CLIENT_SECRET === 'YOUR_MS_GRAPH_CLIENT_SECRET') {
        fastify.log.warn('[email-ingest] MS Graph credentials not configured — email→ticket disabled');
        return;
    }
    const ticketService = new ticket_service_1.TicketService(dataSource, fastify);
    const attachmentService = new attachment_service_1.AttachmentService(dataSource);
    const userRepo = dataSource.getRepository(require('../entities/user.entity').User);
    async function poll() {
        try {
            const graph = buildGraphClient(MS_GRAPH_TENANT_ID, MS_GRAPH_CLIENT_ID, MS_GRAPH_CLIENT_SECRET);
            const messages = await graph
                .api(`/users/${INGEST_MAILBOX}/mailFolders/Inbox/messages`)
                .filter('isRead eq false')
                .select('id,subject,bodyPreview,body,from,toRecipients,hasAttachments,receivedDateTime')
                .top(20)
                .get();
            if (!messages?.value?.length)
                return;
            for (const email of messages.value) {
                try {
                    await processEmail(email, graph, ticketService, attachmentService, userRepo, fastify);
                }
                catch (err) {
                    fastify.log.error(`[email-ingest] Failed to process email ${email.id}: ${err.message}`);
                }
            }
        }
        catch (err) {
            fastify.log.error(`[email-ingest] Poll error: ${err.message}`);
        }
    }
    setTimeout(() => {
        poll();
        setInterval(poll, POLL_INTERVAL_MS);
    }, 30_000);
    fastify.log.info(`[email-ingest] Started — polling ${INGEST_MAILBOX} every ${POLL_INTERVAL_MS / 60000} min`);
}
async function processEmail(email, graph, ticketService, attachmentService, userRepo, fastify) {
    const senderEmail = email.from?.emailAddress?.address?.toLowerCase();
    const subject = email.subject || '(No subject)';
    const body = email.body?.content
        ? stripHtml(email.body.content)
        : email.bodyPreview || '(No body)';
    let creatorId;
    const senderUser = await userRepo.findOne({ where: { email: senderEmail } });
    if (senderUser) {
        creatorId = senderUser.id;
    }
    else {
        const admin = await userRepo.findOne({ where: { role: 'admin' } });
        if (!admin) {
            fastify.log.warn(`[email-ingest] No admin found, skipping email ${email.id}`);
            await markRead(graph, email.id);
            return;
        }
        creatorId = admin.id;
    }
    const deptResult = await ticketService['ticketRepo'].manager.query(`SELECT id FROM departments WHERE deleted_at IS NULL LIMIT 1`);
    if (!deptResult?.length) {
        fastify.log.warn('[email-ingest] No departments found');
        await markRead(graph, email.id);
        return;
    }
    const description = senderUser
        ? body
        : `[Email from: ${senderEmail}]\n\n${body}`;
    const ticket = await ticketService.create({
        subject: subject.slice(0, 500),
        description: description.slice(0, 10000) || 'No details provided.',
        departmentId: deptResult[0].id,
        priority: 'low',
        isEscalated: false,
        tags: ['email'],
    }, creatorId);
    fastify.log.info(`[email-ingest] Created ticket ${ticket.ticketNumber} from email "${subject}"`);
    if (email.hasAttachments) {
        try {
            const atts = await graph.api(`/users/${INGEST_MAILBOX}/messages/${email.id}/attachments`).get();
            for (const att of atts?.value ?? []) {
                if (att['@odata.type'] === '#microsoft.graph.fileAttachment' && att.contentBytes) {
                    const buffer = Buffer.from(att.contentBytes, 'base64');
                    const mockFile = {
                        filename: att.name || 'attachment',
                        mimetype: att.contentType || 'application/octet-stream',
                        toBuffer: async () => buffer,
                    };
                    await attachmentService.upload(ticket.id, creatorId, mockFile);
                }
            }
        }
        catch (err) {
            fastify.log.warn(`[email-ingest] Attachment processing failed for ${ticket.ticketNumber}: ${err.message}`);
        }
    }
    await markRead(graph, email.id);
}
async function markRead(graph, messageId) {
    try {
        await graph.api(`/users/${INGEST_MAILBOX}/messages/${messageId}`).patch({ isRead: true });
    }
    catch (err) {
    }
}
function stripHtml(html) {
    return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}
//# sourceMappingURL=email-ingest.service.js.map