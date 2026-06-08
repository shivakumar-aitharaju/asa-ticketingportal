"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppDataSource = void 0;
require("reflect-metadata");
const typeorm_1 = require("typeorm");
class SnakeNamingStrategy extends typeorm_1.DefaultNamingStrategy {
    columnName(propertyName, customName) {
        return customName || propertyName.replace(/([A-Z])/g, '_$1').toLowerCase();
    }
    joinColumnName(relationName, referencedColumnName) {
        return this.columnName(relationName, '') + '_' + referencedColumnName;
    }
    joinTableColumnName(tableName, propertyName, columnName) {
        return this.columnName(tableName, '') + '_' + (columnName || this.columnName(propertyName, ''));
    }
}
const isProduction = process.env.NODE_ENV === 'production';
const connectionOptions = process.env.DATABASE_URL
    ? {
        url: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false },
    }
    : {
        host: process.env.DB_HOST,
        port: parseInt(process.env.DB_PORT || '5432'),
        username: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
    };
exports.AppDataSource = new typeorm_1.DataSource({
    namingStrategy: new SnakeNamingStrategy(),
    type: 'postgres',
    ...connectionOptions,
    entities: [__dirname + '/../entities/*.{ts,js}'],
    migrations: [__dirname + '/../migrations/*.{ts,js}'],
    synchronize: false,
    logging: !isProduction,
    migrationsTableName: 'migrations',
});
//# sourceMappingURL=data-source.js.map