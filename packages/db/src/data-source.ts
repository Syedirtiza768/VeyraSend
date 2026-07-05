import 'reflect-metadata';
import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { loadConfig } from '@veyrasend/config';

const config = loadConfig();

/**
 * TypeORM DataSource. synchronize is permanently false (ADR-0006, brief §2.6).
 * All schema changes ship as migrations under src/migrations.
 *
 * This file exports exactly one DataSource instance so the TypeORM CLI can
 * load it:
 *   pnpm --filter @veyrasend/db migration:generate src/migrations/<Name>
 *   pnpm --filter @veyrasend/db migration:run
 */
const AppDataSource = new DataSource({
  type: 'postgres',
  url: config.databaseUrl,
  synchronize: false,
  migrationsRun: false,
  logging: config.nodeEnv === 'development' ? ['error', 'warn'] : ['error'],
  entities: [__dirname + '/entities/*.{js,ts}'],
  migrations: [__dirname + '/migrations/*.{js,ts}'],
});

export default AppDataSource;
