"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const user_controller_1 = require("../controllers/user.controller");
const zod_to_swagger_1 = require("../lib/zod-to-swagger");
const user_schema_1 = require("../schemas/user.schema");
const user_role_enum_1 = require("../types/user-role.enum");
const users = async function (fastify) {
    await fastify.register(async function (f) {
        const ctrl = new user_controller_1.UserController(f);
        const adminOnly = [f.authenticate, f.authorize([user_role_enum_1.UserRole.Admin])];
        const managerAbove = [f.authenticate, f.authorize([user_role_enum_1.UserRole.Admin, user_role_enum_1.UserRole.Manager])];
        f.get('/profile', { schema: { tags: ['users'] }, preHandler: [f.authenticate] }, ctrl.getProfile.bind(ctrl));
        f.patch('/profile', {
            schema: { tags: ['users'], body: (0, zod_to_swagger_1.zodToFastifySchema)(user_schema_1.UpdateProfileSchema) },
            preHandler: [f.authenticate],
            preValidation: async (req, rep) => {
                const r = user_schema_1.UpdateProfileSchema.safeParse(req.body);
                if (!r.success)
                    return rep.code(400).send({ error: { message: 'Validation error', statusCode: 400, details: r.error.format() } });
                req.body = r.data;
            }
        }, ctrl.updateProfile.bind(ctrl));
        f.get('/', { schema: { tags: ['users'] }, preHandler: managerAbove }, ctrl.findAll.bind(ctrl));
        f.post('/', {
            schema: { tags: ['users'], body: (0, zod_to_swagger_1.zodToFastifySchema)(user_schema_1.CreateUserSchema) },
            preHandler: adminOnly,
            preValidation: async (req, rep) => {
                const r = user_schema_1.CreateUserSchema.safeParse(req.body);
                if (!r.success)
                    return rep.code(400).send({ error: { message: 'Validation error', statusCode: 400, details: r.error.format() } });
                req.body = r.data;
            }
        }, ctrl.create.bind(ctrl));
        f.get('/:id', { schema: { tags: ['users'] }, preHandler: managerAbove }, ctrl.findById.bind(ctrl));
        f.patch('/:id', {
            schema: { tags: ['users'], body: (0, zod_to_swagger_1.zodToFastifySchema)(user_schema_1.UpdateUserSchema) },
            preHandler: adminOnly,
            preValidation: async (req, rep) => {
                const r = user_schema_1.UpdateUserSchema.safeParse(req.body);
                if (!r.success)
                    return rep.code(400).send({ error: { message: 'Validation error', statusCode: 400, details: r.error.format() } });
                req.body = r.data;
            }
        }, ctrl.update.bind(ctrl));
        f.post('/:id/reset-password', {
            schema: { tags: ['users'], body: (0, zod_to_swagger_1.zodToFastifySchema)(user_schema_1.ResetUserPasswordSchema) },
            preHandler: adminOnly,
            preValidation: async (req, rep) => {
                const r = user_schema_1.ResetUserPasswordSchema.safeParse(req.body);
                if (!r.success)
                    return rep.code(400).send({ error: { message: 'Validation error', statusCode: 400, details: r.error.format() } });
                req.body = r.data;
            }
        }, ctrl.resetPassword.bind(ctrl));
        f.delete('/:id', { schema: { tags: ['users'] }, preHandler: adminOnly }, ctrl.deactivate.bind(ctrl));
        f.get('/workload/:departmentId', { schema: { tags: ['users'] }, preHandler: [f.authenticate, f.authorize([user_role_enum_1.UserRole.Admin, user_role_enum_1.UserRole.Manager, user_role_enum_1.UserRole.TeamLeader])] }, ctrl.getWorkload.bind(ctrl));
    }, { prefix: '/api/users' });
};
exports.default = users;
//# sourceMappingURL=users.js.map