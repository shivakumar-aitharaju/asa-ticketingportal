"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const fastify_1 = __importDefault(require("fastify"));
const app_1 = require("./app");
const seed_1 = require("./scripts/seed");
async function start() {
    const server = (0, fastify_1.default)({
        logger: { level: process.env.NODE_ENV === 'production' ? 'info' : 'debug' },
    });
    await server.register(app_1.app, app_1.options);
    await server.listen({
        port: parseInt(process.env.PORT ?? '8090', 10),
        host: '0.0.0.0',
    });
    (0, seed_1.seed)().catch(err => {
        server.log.warn({ err }, '[seed] Background seed failed (non-fatal)');
    });
}
start().catch(err => {
    console.error(err);
    process.exit(1);
});
//# sourceMappingURL=server.js.map