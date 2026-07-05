import { Global, Module, OnApplicationBootstrap, OnApplicationShutdown, Logger, Inject } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { AppDataSource, dbConfig } from '@veyrasend/db';

/** DI token for the TypeORM DataSource. */
export const DATA_SOURCE = 'DATA_SOURCE';

/** Decorator factory to inject the DataSource. */
export const InjectDataSource = () => Inject(DATA_SOURCE);

/**
 * Owns the single TypeORM DataSource (from @veyrasend/db). synchronize is
 * false (ADR-0006); migrations are run out-of-band via the db package CLI.
 * Services inject the DataSource and build tenant-scoped queries from it.
 */
@Global()
@Module({
  providers: [
    {
      provide: DATA_SOURCE,
      useFactory: (): DataSource => AppDataSource,
    },
  ],
  exports: [DATA_SOURCE],
})
export class DbModule implements OnApplicationBootstrap, OnApplicationShutdown {
  private readonly logger = new Logger('DbModule');

  async onApplicationBootstrap(): Promise<void> {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
      const safeUrl = dbConfig.databaseUrl.replace(/:[^:@/]+@/, ':***@');
      this.logger.log(`DataSource initialized on ${safeUrl}`);
    }
  }

  async onApplicationShutdown(): Promise<void> {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  }
}
