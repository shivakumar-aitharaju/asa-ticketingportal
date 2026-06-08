"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.options = exports.app = void 0;
const autoload_1 = __importDefault(require("@fastify/autoload"));
const cors_1 = __importDefault(require("@fastify/cors"));
const sensible_1 = require("@fastify/sensible");
const node_path_1 = require("node:path");
const env_1 = __importDefault(require("./plugins/env"));
const email_ingest_service_1 = require("./services/email-ingest.service");
const options = {};
exports.options = options;
const app = async function (fastify, opts) {
    await fastify.register(env_1.default);
    await fastify.register(cors_1.default, {
        origin: true,
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin']
    });
    fastify.setErrorHandler(function (error, request, reply) {
        fastify.log.error(error);
        const statusCode = error instanceof sensible_1.HttpError || error.statusCode
            ? (error.statusCode ?? 500)
            : 500;
        const message = error.message ?? 'Internal Server Error';
        const nodeEnv = fastify.config?.NODE_ENV ?? 'development';
        const errorResponse = {
            error: {
                message,
                statusCode,
                ...(error.details && { details: error.details }),
                ...(nodeEnv === 'development' && { stack: error.stack })
            }
        };
        reply.code(statusCode).send(errorResponse);
    });
    fastify.setNotFoundHandler(function (request, reply) {
        reply.code(404).send({
            error: { message: 'Route not found', statusCode: 404, details: { path: request.url } }
        });
    });
    void fastify.register(autoload_1.default, {
        dir: (0, node_path_1.join)(__dirname, 'plugins'),
        options: opts,
        ignorePattern: /env\.(ts|js)$/
    });
    void fastify.register(autoload_1.default, {
        dir: (0, node_path_1.join)(__dirname, 'routes'),
        options: opts
    });
    fastify.after(() => {
        fastify.ready().then(() => {
            const ds = fastify.dataSource;
            if (ds)
                (0, email_ingest_service_1.startEmailIngest)(fastify, ds).catch(() => { });
        });
    });
};
exports.app = app;
exports.default = app;
//# sourceMappingURL=app.js.map