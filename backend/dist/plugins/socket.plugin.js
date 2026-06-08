"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fastify_plugin_1 = __importDefault(require("fastify-plugin"));
const fastify_socket_io_1 = __importDefault(require("fastify-socket.io"));
exports.default = (0, fastify_plugin_1.default)(async function (fastify) {
    await fastify.register(fastify_socket_io_1.default, {
        cors: {
            origin: '*',
            methods: ['GET', 'POST']
        }
    });
    fastify.ready(() => {
        fastify.io.on('connection', (socket) => {
            fastify.log.info(`Socket connected: ${socket.id}`);
            socket.on('join', (userId) => {
                socket.join(`user:${userId}`);
                fastify.log.info(`Socket ${socket.id} joined user:${userId}`);
            });
            socket.on('join:department', (departmentId) => {
                socket.join(`dept:${departmentId}`);
            });
            socket.on('join:ticket', (ticketId) => {
                socket.join(`ticket:${ticketId}`);
            });
            socket.on('disconnect', () => {
                fastify.log.info(`Socket disconnected: ${socket.id}`);
            });
        });
    });
}, { name: 'socket', dependencies: ['env'] });
//# sourceMappingURL=socket.plugin.js.map