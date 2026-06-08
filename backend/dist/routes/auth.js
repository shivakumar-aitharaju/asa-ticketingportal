"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const auth_controller_1 = require("../controllers/auth.controller");
const zod_to_swagger_1 = require("../lib/zod-to-swagger");
const auth_schema_1 = require("../schemas/auth.schema");
const auth = async function (fastify) {
    await fastify.register(async function (f) {
        const ctrl = new auth_controller_1.AuthController(f);
        f.post('/login', {
            schema: {
                description: 'Login with email and password',
                tags: ['auth'],
                body: (0, zod_to_swagger_1.zodToFastifySchema)(auth_schema_1.LoginSchema),
            },
            preValidation: async (req, rep) => {
                const r = auth_schema_1.LoginSchema.safeParse(req.body);
                if (!r.success)
                    return rep.code(400).send({ error: { message: 'Validation error', statusCode: 400, details: r.error.format() } });
                req.body = r.data;
            }
        }, ctrl.login.bind(ctrl));
        f.post('/forgot-password', {
            schema: { description: 'Send password reset email', tags: ['auth'], body: (0, zod_to_swagger_1.zodToFastifySchema)(auth_schema_1.ForgotPasswordSchema) },
            preValidation: async (req, rep) => {
                const r = auth_schema_1.ForgotPasswordSchema.safeParse(req.body);
                if (!r.success)
                    return rep.code(400).send({ error: { message: 'Validation error', statusCode: 400, details: r.error.format() } });
                req.body = r.data;
            }
        }, ctrl.forgotPassword.bind(ctrl));
        f.get('/verify-reset-token', {
            schema: { description: 'Verify password reset token', tags: ['auth'], querystring: { type: 'object', required: ['token'], properties: { token: { type: 'string' } } } }
        }, ctrl.verifyResetToken.bind(ctrl));
        f.post('/reset-password', {
            schema: { description: 'Reset password using token', tags: ['auth'], body: (0, zod_to_swagger_1.zodToFastifySchema)(auth_schema_1.ResetPasswordSchema) },
            preValidation: async (req, rep) => {
                const r = auth_schema_1.ResetPasswordSchema.safeParse(req.body);
                if (!r.success)
                    return rep.code(400).send({ error: { message: 'Validation error', statusCode: 400, details: r.error.format() } });
                req.body = r.data;
            }
        }, ctrl.resetPassword.bind(ctrl));
        f.post('/refresh', {
            schema: { description: 'Refresh access token', tags: ['auth'], body: { type: 'object', required: ['refreshToken'], properties: { refreshToken: { type: 'string' } } } }
        }, ctrl.refresh.bind(ctrl));
        f.get('/me', {
            schema: { description: 'Get current user', tags: ['auth'], security: [{ bearerAuth: [] }] },
            preHandler: [f.authenticate]
        }, ctrl.me.bind(ctrl));
    }, { prefix: '/api/auth' });
};
exports.default = auth;
//# sourceMappingURL=auth.js.map