"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateSLAConfigSchema = exports.CreateSLAConfigSchema = void 0;
const zod_1 = require("zod");
const priority_enum_1 = require("../types/priority.enum");
exports.CreateSLAConfigSchema = zod_1.z.object({
    name: zod_1.z.string().min(3, 'Name must be at least 3 characters').max(255),
    priority: zod_1.z.nativeEnum(priority_enum_1.Priority),
    departmentId: zod_1.z.string().uuid().nullable().optional(),
    categoryId: zod_1.z.string().uuid().nullable().optional(),
    firstResponseMinutes: zod_1.z.number().int().min(1, 'Must be at least 1 minute'),
    resolutionMinutes: zod_1.z.number().int().min(1, 'Must be at least 1 minute'),
    businessHoursOnly: zod_1.z.boolean().default(true),
    isActive: zod_1.z.boolean().default(true),
});
exports.UpdateSLAConfigSchema = exports.CreateSLAConfigSchema.partial();
//# sourceMappingURL=sla.schema.js.map