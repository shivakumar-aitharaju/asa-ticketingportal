"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const swagger_1 = __importDefault(require("@fastify/swagger"));
const swagger_ui_1 = __importDefault(require("@fastify/swagger-ui"));
const fastify_plugin_1 = __importDefault(require("fastify-plugin"));
exports.default = (0, fastify_plugin_1.default)(async function (fastify) {
    await fastify.register(swagger_1.default, {
        openapi: {
            info: { title: 'ASA RaiseATicket API', description: 'Enterprise ticketing portal API', version: '1.0.0' },
            tags: [
                { name: 'auth', description: 'Authentication endpoints' },
                { name: 'tickets', description: 'Ticket management' },
                { name: 'users', description: 'User management' },
                { name: 'departments', description: 'Departments' },
                { name: 'categories', description: 'Ticket categories' },
                { name: 'notifications', description: 'Notifications' },
                { name: 'analytics', description: 'Analytics & reports' },
                { name: 'audit', description: 'Audit logs' },
                { name: 'sla', description: 'SLA configuration' },
                { name: 'uploads', description: 'File uploads' },
            ],
            components: {
                securitySchemes: {
                    bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }
                }
            },
            security: [{ bearerAuth: [] }]
        }
    });
    await fastify.register(swagger_ui_1.default, {
        routePrefix: '/docs',
        uiConfig: { docExpansion: 'list', deepLinking: false }
    });
}, { name: 'swagger', dependencies: ['env'] });
//# sourceMappingURL=swagger.js.map