"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const multipart_1 = __importDefault(require("@fastify/multipart"));
const fastify_plugin_1 = __importDefault(require("fastify-plugin"));
exports.default = (0, fastify_plugin_1.default)(async function (fastify) {
    fastify.register(multipart_1.default, {
        limits: {
            fileSize: 25 * 1024 * 1024,
            files: 5
        }
    });
}, { name: 'multipart' });
//# sourceMappingURL=multipart.js.map