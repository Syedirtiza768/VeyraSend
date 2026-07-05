import { Injectable } from '@nestjs/common';
import { loadConfig, type AppConfig } from '@veyrasend/config';

/**
 * Thin Nest wrapper around the validated typed config from @veyrasend/config.
 * Constructed once at bootstrap (fail-fast). Never expose secret fields via
 * responses; use redactedConfig for any logging.
 */
@Injectable()
export class ConfigService {
  private readonly cfg: AppConfig;

  constructor() {
    this.cfg = loadConfig();
  }

  get all(): AppConfig {
    return this.cfg;
  }

  get nodeEnv(): AppConfig['nodeEnv'] {
    return this.cfg.nodeEnv;
  }

  get apiPort(): number {
    return this.cfg.apiPort;
  }

  get databaseUrl(): string {
    return this.cfg.databaseUrl;
  }

  get redisUrl(): string {
    return this.cfg.redisUrl;
  }

  get sendgrid(): AppConfig['sendgrid'] {
    return this.cfg.sendgrid;
  }
}
