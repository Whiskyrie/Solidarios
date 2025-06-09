// src/config/typeorm.config.ts (modificado)
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { join } from 'path';

// Carrega as variáveis de ambiente do arquivo .env
dotenv.config();

// Configuração para as entidades
// Em desenvolvimento, usar arquivos .ts; em produção, usar arquivos .js compilados
// Usar caminhos específicos para maior robustez
const entitiesPath =
  process.env.NODE_ENV === 'production'
    ? join(__dirname, '..', 'modules', '**', 'entities', '*.entity.js')
    : join(__dirname, '..', 'modules', '**', 'entities', '*.entity{.ts,.js}');

// Configuração para as migrações
const migrationsPath = join(
  __dirname,
  '..',
  'database',
  'migrations',
  '*{.ts,.js}',
);

// Verifica se o SSL deve ser usado
const useSSL = process.env.DB_SSL === 'true';

// Configuração SSL condicional
const sslConfig = useSSL
  ? {
      ssl: {
        rejectUnauthorized: false, // Força aceitar certificados auto-assinados
      },
    }
  : {};

// Exporta o DataSource para ser usado pela CLI do TypeORM e pelo aplicativo
export const AppDataSource = new DataSource({
  ...(process.env.DATABASE_URL
    ? {
        type: 'postgres',
        url: process.env.DATABASE_URL,
        ...sslConfig,
      }
    : {
        type: 'postgres',
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432', 10),
        username: process.env.DB_USERNAME || 'postgres',
        password: process.env.DB_PASSWORD || '811920',
        database: process.env.DB_DATABASE || 'solidarios',
        ...sslConfig,
      }),
  entities: [entitiesPath],
  migrations: [migrationsPath],
  // Usar a variável de ambiente DB_SYNCHRONIZE em vez de baseado no ambiente
  synchronize: process.env.DB_SYNCHRONIZE === 'true',
  logging: process.env.DB_LOGGING === 'true',
  migrationsRun: process.env.MIGRATIONS_RUN === 'true', // ✅ Ativar migrações
  dropSchema: false,
  cache: false,
});
export const initializeDataSource = async () => {
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }
  return AppDataSource;
};
