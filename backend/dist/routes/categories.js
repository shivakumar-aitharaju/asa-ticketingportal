"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const category_service_1 = require("../services/category.service");
const response_dto_1 = require("../dtos/response.dto");
const zod_to_swagger_1 = require("../lib/zod-to-swagger");
const category_schema_1 = require("../schemas/category.schema");
const user_role_enum_1 = require("../types/user-role.enum");
const categories = async function (fastify) {
    await fastify.register(async function (f) {
        const service = new category_service_1.CategoryService(f.dataSource);
        const adminOnly = [f.authenticate, f.authorize([user_role_enum_1.UserRole.Admin])];
        f.get('/', { schema: { tags: ['categories'] }, preHandler: [f.authenticate] }, async (req, rep) => {
            const cats = await service.findAll();
            rep.send((0, response_dto_1.successResponse)(cats));
        });
        f.post('/', { schema: { tags: ['categories'], body: (0, zod_to_swagger_1.zodToFastifySchema)(category_schema_1.CreateCategorySchema) }, preHandler: adminOnly,
            preValidation: async (req, rep) => {
                const r = category_schema_1.CreateCategorySchema.safeParse(req.body);
                if (!r.success)
                    return rep.code(400).send({ error: { message: 'Validation error', statusCode: 400, details: r.error.format() } });
                req.body = r.data;
            }
        }, async (req, rep) => {
            const cat = await service.create(req.body);
            rep.code(201).send((0, response_dto_1.successResponse)(cat, 'Category created'));
        });
        f.patch('/:id', { schema: { tags: ['categories'], body: (0, zod_to_swagger_1.zodToFastifySchema)(category_schema_1.UpdateCategorySchema) }, preHandler: adminOnly,
            preValidation: async (req, rep) => {
                const r = category_schema_1.UpdateCategorySchema.safeParse(req.body);
                if (!r.success)
                    return rep.code(400).send({ error: { message: 'Validation error', statusCode: 400, details: r.error.format() } });
                req.body = r.data;
            }
        }, async (req, rep) => {
            const cat = await service.update(req.params.id, req.body);
            rep.send((0, response_dto_1.successResponse)(cat, 'Category updated'));
        });
        f.delete('/:id', { schema: { tags: ['categories'] }, preHandler: adminOnly }, async (req, rep) => {
            await service.delete(req.params.id);
            rep.send((0, response_dto_1.successResponse)(null, 'Category deleted'));
        });
    }, { prefix: '/api/categories' });
};
exports.default = categories;
//# sourceMappingURL=categories.js.map