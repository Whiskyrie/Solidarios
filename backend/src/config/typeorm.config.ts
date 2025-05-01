// data-source.ts
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { join } from 'path';

// Carrega as variáveis de ambiente do arquivo .env
dotenv.config();

// Configuração para as entidades
const entitiesPath = join(__dirname, 'src', '**', '*.entity{.ts,.js}');

// Configuração para as migrações
const migrationsPath = join(
  __dirname,
  'src',
  'database',
  'migrations',
  '*{.ts,.js}',
);

// Exporta o DataSource para ser usado pela CLI do TypeORM e pelo aplicativo
export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || '811920',
  database: process.env.DB_DATABASE || 'solidarios',
  entities: [entitiesPath],
  migrations: [migrationsPath],
  synchronize: process.env.NODE_ENV !== 'production', // Não usar synchronize em produção
  logging: process.env.DB_LOGGING === 'true',
  migrationsRun: false, // Impede a execução automática de migrações
  migrationsTableName: 'migrations',
});
