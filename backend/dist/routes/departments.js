"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const department_controller_1 = require("../controllers/department.controller");
const zod_to_swagger_1 = require("../lib/zod-to-swagger");
const department_schema_1 = require("../schemas/department.schema");
const user_role_enum_1 = require("../types/user-role.enum");
const departments = async function (fastify) {
    await fastify.register(async function (f) {
        const ctrl = new department_controller_1.DepartmentController(f);
        const adminOnly = [f.authenticate, f.authorize([user_role_enum_1.UserRole.Admin])];
        const staffAbove = [f.authenticate, f.authorize([user_role_enum_1.UserRole.Admin, user_role_enum_1.UserRole.Manager, user_role_enum_1.UserRole.TeamLeader])];
        f.get('/', { schema: { tags: ['departments'] }, preHandler: [f.authenticate] }, ctrl.findAll.bind(ctrl));
        f.get('/:id', { schema: { tags: ['departments'] }, preHandler: staffAbove }, ctrl.findById.bind(ctrl));
        f.get('/:id/categories', { schema: { tags: ['departments'] }, preHandler: [f.authenticate] }, ctrl.getCategories.bind(ctrl));
        f.post('/', { schema: { tags: ['departments'], body: (0, zod_to_swagger_1.zodToFastifySchema)(department_schema_1.CreateDepartmentSchema) }, preHandler: adminOnly,
            preValidation: async (req, rep) => {
                const r = department_schema_1.CreateDepartmentSchema.safeParse(req.body);
                if (!r.success)
                    return rep.code(400).send({ error: { message: 'Validation error', statusCode: 400, details: r.error.format() } });
                req.body = r.data;
            }
        }, ctrl.create.bind(ctrl));
        f.patch('/:id', { schema: { tags: ['departments'], body: (0, zod_to_swagger_1.zodToFastifySchema)(department_schema_1.UpdateDepartmentSchema) }, preHandler: adminOnly,
            preValidation: async (req, rep) => {
                const r = department_schema_1.UpdateDepartmentSchema.safeParse(req.body);
                if (!r.success)
                    return rep.code(400).send({ error: { message: 'Validation error', statusCode: 400, details: r.error.format() } });
                req.body = r.data;
            }
        }, ctrl.update.bind(ctrl));
        f.delete('/:id', { schema: { tags: ['departments'] }, preHandler: adminOnly }, ctrl.delete.bind(ctrl));
        f.post('/:id/categories', { schema: { tags: ['departments'], body: (0, zod_to_swagger_1.zodToFastifySchema)(department_schema_1.MapCategorySchema) }, preHandler: adminOnly,
            preValidation: async (req, rep) => {
                const r = department_schema_1.MapCategorySchema.safeParse(req.body);
                if (!r.success)
                    return rep.code(400).send({ error: { message: 'Validation error', statusCode: 400, details: r.error.format() } });
                req.body = r.data;
            }
        }, ctrl.mapCategory.bind(ctrl));
        f.delete('/:id/categories/:categoryId', { schema: { tags: ['departments'] }, preHandler: adminOnly }, ctrl.unmapCategory.bind(ctrl));
        f.get('/:id/members', { schema: { tags: ['departments'] }, preHandler: adminOnly }, ctrl.getMembers.bind(ctrl));
        f.post('/:id/members', { schema: { tags: ['departments'] }, preHandler: adminOnly }, ctrl.addMember.bind(ctrl));
        f.delete('/:id/members/:userId', { schema: { tags: ['departments'] }, preHandler: adminOnly }, ctrl.removeMember.bind(ctrl));
    }, { prefix: '/api/departments' });
};
exports.default = departments;
//# sourceMappingURL=departments.js.map