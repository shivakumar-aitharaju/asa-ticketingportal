"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jwt_1 = __importDefault(require("@fastify/jwt"));
const fastify_plugin_1 = __importDefault(require("fastify-plugin"));
exports.default = (0, fastify_plugin_1.default)(async function (fastify) {
    await fastify.register(jwt_1.default, {
        secret: fastify.config.JWT_SECRET,
        sign: { expiresIn: fastify.config.JWT_EXPIRES_IN || '30m' }
    });
    if (fastify.config.JWT_REFRESH_SECRET) {
        await fastify.register(jwt_1.default, {
            secret: fastify.config.JWT_REFRESH_SECRET,
            namespace: 'refresh',
            sign: { expiresIn: fastify.config.JWT_REFRESH_EXPIRES_IN || '30d' }
        });
    }
    fastify.decorate('authenticate', async function (request, reply) {
        try {
            await request.jwtVerify();
        }
        catch {
            reply.code(401).send({ error: { message: 'Unauthorized', statusCode: 401 } });
        }
    });
    fastify.decorate('getUserId', function (request) {
        try {
            const decoded = request.user;
            return decoded?.id || null;
        }
        catch {
            return null;
        }
    });
    fastify.decorate('getUserRole', function (request) {
        try {
            const decoded = request.user;
            return decoded?.role || null;
        }
        catch {
            return null;
        }
    });
    fastify.decorate('authorize', function (roles) {
        return async function (request, reply) {
            const userRole = fastify.getUserRole(request);
            if (!userRole || !roles.includes(userRole)) {
                reply.code(403).send({ error: { message: 'Forbidden: Insufficient permissions', statusCode: 403 } });
            }
        };
    });
}, { name: 'auth', dependencies: ['env', 'typeorm'] });
//# sourceMappingURL=auth.js.map