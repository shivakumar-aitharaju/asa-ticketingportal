"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResetUserPasswordSchema = exports.UpdateProfileSchema = exports.UpdateUserSchema = exports.CreateUserSchema = void 0;
const zod_1 = require("zod");
const user_role_enum_1 = require("../types/user-role.enum");
exports.CreateUserSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(8, 'Password must be at least 8 characters'),
    firstName: zod_1.z.string().min(1).max(255).optional(),
    lastName: zod_1.z.string().min(1).max(255).optional(),
    phone: zod_1.z.string().optional(),
    role: zod_1.z.nativeEnum(user_role_enum_1.UserRole).default(user_role_enum_1.UserRole.Client),
    departmentId: zod_1.z.string().uuid().optional().nullable(),
});
exports.UpdateUserSchema = zod_1.z.object({
    firstName: zod_1.z.string().min(1).max(255).optional(),
    lastName: zod_1.z.string().min(1).max(255).optional(),
    phone: zod_1.z.string().optional().nullable(),
    role: zod_1.z.nativeEnum(user_role_enum_1.UserRole).optional(),
    departmentId: zod_1.z.string().uuid().optional().nullable(),
    isActive: zod_1.z.boolean().optional(),
});
exports.UpdateProfileSchema = zod_1.z.object({
    firstName: zod_1.z.string().min(1).max(255).optional(),
    lastName: zod_1.z.string().min(1).max(255).optional(),
    phone: zod_1.z.string().optional().nullable(),
    notificationPrefs: zod_1.z.record(zod_1.z.string(), zod_1.z.any()).optional(),
});
exports.ResetUserPasswordSchema = zod_1.z.object({
    password: zod_1.z.string().min(8),
});
//# sourceMappingURL=user.schema.js.map