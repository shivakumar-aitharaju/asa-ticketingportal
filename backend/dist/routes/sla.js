"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sla_service_1 = require("../services/sla.service");
const response_dto_1 = require("../dtos/response.dto");
const zod_to_swagger_1 = require("../lib/zod-to-swagger");
const sla_schema_1 = require("../schemas/sla.schema");
const user_role_enum_1 = require("../types/user-role.enum");
const sla = async function (fastify) {
    await fastify.register(async function (f) {
        const service = new sla_service_1.SLAService(f.dataSource);
        const adminOnly = [f.authenticate, f.authorize([user_role_enum_1.UserRole.Admin])];
        const managerAbove = [f.authenticate, f.authorize([user_role_enum_1.UserRole.Admin, user_role_enum_1.UserRole.Manager])];
        f.get('/configs', { schema: { tags: ['sla'] }, preHandler: managerAbove }, async (req, rep) => {
            const configs = await service.getAllConfigs();
            rep.send((0, response_dto_1.successResponse)(configs));
        });
        f.post('/configs', {
            schema: { tags: ['sla'], body: (0, zod_to_swagger_1.zodToFastifySchema)(sla_schema_1.CreateSLAConfigSchema) },
            preHandler: adminOnly,
            preValidation: async (req, rep) => {
                const r = sla_schema_1.CreateSLAConfigSchema.safeParse(req.body);
                if (!r.success)
                    return rep.code(400).send({ error: { message: 'Validation error', statusCode: 400, details: r.error.format() } });
                req.body = r.data;
            }
        }, async (req, rep) => {
            const config = await service.createConfig(req.body);
            rep.code(201).send((0, response_dto_1.successResponse)(config, 'SLA configuration created'));
        });
        f.patch('/configs/:id', {
            schema: { tags: ['sla'], body: (0, zod_to_swagger_1.zodToFastifySchema)(sla_schema_1.UpdateSLAConfigSchema) },
            preHandler: adminOnly,
            preValidation: async (req, rep) => {
                const r = sla_schema_1.UpdateSLAConfigSchema.safeParse(req.body);
                if (!r.success)
                    return rep.code(400).send({ error: { message: 'Validation error', statusCode: 400, details: r.error.format() } });
                req.body = r.data;
            }
        }, async (req, rep) => {
            const config = await service.updateConfig(req.params.id, req.body);
            rep.send((0, response_dto_1.successResponse)(config, 'SLA configuration updated'));
        });
    }, { prefix: '/api/sla' });
};
exports.default = sla;
//# sourceMappingURL=sla.js.map