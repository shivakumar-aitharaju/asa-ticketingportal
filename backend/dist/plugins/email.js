"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fastify_plugin_1 = __importDefault(require("fastify-plugin"));
const identity_1 = require("@azure/identity");
const microsoft_graph_client_1 = require("@microsoft/microsoft-graph-client");
const azureTokenCredentials_1 = require("@microsoft/microsoft-graph-client/authProviders/azureTokenCredentials");
exports.default = (0, fastify_plugin_1.default)(async function (fastify) {
    fastify.decorate('sendEmail', async function (to, subject, html) {
        const sendEnabled = fastify.config.SEND_EMAIL_NOTIFICATIONS;
        if (!sendEnabled) {
            fastify.log.info(`[EMAIL SKIP] To: ${to} | Subject: ${subject}`);
            return;
        }
        try {
            const credential = new identity_1.ClientSecretCredential(fastify.config.MS_GRAPH_TENANT_ID, fastify.config.MS_GRAPH_CLIENT_ID, fastify.config.MS_GRAPH_CLIENT_SECRET);
            const authProvider = new azureTokenCredentials_1.TokenCredentialAuthenticationProvider(credential, {
                scopes: ['https://graph.microsoft.com/.default']
            });
            const graphClient = microsoft_graph_client_1.Client.initWithMiddleware({ authProvider });
            await graphClient.api(`/users/${fastify.config.MS_GRAPH_SENDER_EMAIL}/sendMail`).post({
                message: {
                    subject,
                    body: { contentType: 'HTML', content: html },
                    toRecipients: [{ emailAddress: { address: to } }]
                }
            });
        }
        catch (err) {
            fastify.log.error({ err }, `Failed to send email to ${to}`);
        }
    });
}, { name: 'email', dependencies: ['env'] });
//# sourceMappingURL=email.js.map