"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const audit_controller_1 = require("../controllers/audit.controller");
const user_role_enum_1 = require("../types/user-role.enum");
const audit = async function (fastify) {
    await fastify.register(async function (f) {
        const ctrl = new audit_controller_1.AuditController(f);
        const adminOnly = [f.authenticate, f.authorize([user_role_enum_1.UserRole.Admin])];
        f.get('/', { schema: { tags: ['audit'] }, preHandler: adminOnly }, ctrl.getAll.bind(ctrl));
        f.get('/:resource/:resourceId', { schema: { tags: ['audit'] }, preHandler: adminOnly }, ctrl.getForResource.bind(ctrl));
    }, { prefix: '/api/audit' });
};
exports.default = audit;
//# sourceMappingURL=audit.js.map