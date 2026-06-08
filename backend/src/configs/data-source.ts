import 'reflect-metadata'
import { DataSource, DefaultNamingStrategy, type NamingStrategyInterface } from 'typeorm'

class SnakeNamingStrategy extends DefaultNamingStrategy implements NamingStrategyInterface {
  columnName(propertyName: string, customName: string): string {
    return customName || propertyName.replace(/([A-Z])/g, '_$1').toLowerCase()
  }
  joinColumnName(relationName: string, referencedColumnName: string): string {
    return this.columnName(relationName, '') + '_' + referencedColumnName
  }
  joinTableColumnName(tableName: string, propertyName: string, columnName?: string): string {
    return this.columnName(tableName, '') + '_' + (columnName || this.columnName(propertyName, ''))
  }
}

const isProduction = process.env.NODE_ENV === 'production'

// Supabase / cloud PG: set DATABASE_URL and it takes priority.
// Local dev: use individual DB_HOST / DB_PORT / DB_USER / DB_PASSWORD / DB_NAME.
const connectionOptions = process.env.DATABASE_URL
  ? {
      url: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }, // required by Supabase
    }
  : {
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || '5432'),
      username: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
    }

export const AppDataSource = new DataSource({
  namingStrategy: new SnakeNamingStrategy(),
  type: 'postgres',
  ...connectionOptions,
  entities: [__dirname + '/../entities/*.{ts,js}'],
  migrations: [__dirname + '/../migrations/*.{ts,js}'],
  synchronize: false,
  logging: !isProduction,
  migrationsTableName: 'migrations',
})
