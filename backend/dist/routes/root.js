"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const root = async function (fastify) {
    fastify.get('/health', {
        schema: { tags: ['system'], description: 'Health check' }
    }, async (req, rep) => {
        rep.send({ status: 'ok', timestamp: new Date().toISOString(), service: 'raiseaticket-backend' });
    });
};
exports.default = root;
//# sourceMappingURL=root.js.map