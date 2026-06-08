"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MapCategorySchema = exports.UpdateDepartmentSchema = exports.CreateDepartmentSchema = void 0;
const zod_1 = require("zod");
exports.CreateDepartmentSchema = zod_1.z.object({
    name: zod_1.z.string().min(2).max(255),
    description: zod_1.z.string().optional(),
});
exports.UpdateDepartmentSchema = zod_1.z.object({
    name: zod_1.z.string().min(2).max(255).optional(),
    description: zod_1.z.string().optional().nullable(),
    isActive: zod_1.z.boolean().optional(),
});
exports.MapCategorySchema = zod_1.z.object({
    categoryId: zod_1.z.string().uuid(),
});
//# sourceMappingURL=department.schema.js.map