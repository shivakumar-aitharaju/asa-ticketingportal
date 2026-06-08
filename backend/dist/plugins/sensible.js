"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sensible_1 = __importDefault(require("@fastify/sensible"));
const fastify_plugin_1 = __importDefault(require("fastify-plugin"));
exports.default = (0, fastify_plugin_1.default)(async function (fastify) {
    fastify.register(sensible_1.default);
}, { name: 'sensible' });
//# sourceMappingURL=sensible.js.map