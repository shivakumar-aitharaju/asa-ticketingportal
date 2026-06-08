"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const fastify_plugin_1 = __importDefault(require("fastify-plugin"));
const data_source_1 = require("../configs/data-source");
exports.default = (0, fastify_plugin_1.default)(async function (fastify) {
    if (!data_source_1.AppDataSource.isInitialized) {
        await data_source_1.AppDataSource.initialize();
        fastify.log.info('TypeORM DataSource initialized');
        await data_source_1.AppDataSource.runMigrations();
        fastify.log.info('TypeORM migrations applied');
    }
    fastify.decorate('dataSource', data_source_1.AppDataSource);
    fastify.addHook('onClose', async (instance) => {
        if (instance.dataSource.isInitialized) {
            await instance.dataSource.destroy();
            fastify.log.info('TypeORM DataSource closed');
        }
    });
}, { name: 'typeorm', dependencies: ['env'] });
//# sourceMappingURL=typeorm.js.map