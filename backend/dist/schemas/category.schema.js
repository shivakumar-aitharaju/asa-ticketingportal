"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateCategorySchema = exports.CreateCategorySchema = void 0;
const zod_1 = require("zod");
exports.CreateCategorySchema = zod_1.z.object({
    name: zod_1.z.string().min(2).max(255),
    description: zod_1.z.string().optional(),
});
exports.UpdateCategorySchema = zod_1.z.object({
    name: zod_1.z.string().min(2).max(255).optional(),
    description: zod_1.z.string().optional().nullable(),
    isActive: zod_1.z.boolean().optional(),
});
//# sourceMappingURL=category.schema.js.map