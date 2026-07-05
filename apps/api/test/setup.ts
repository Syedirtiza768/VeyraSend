import * as fs from 'fs';
import * as path from 'path';

// Load .env into process.env for tests (jest does not read --env-file).
const envPath = path.resolve(__dirname, '../../.env');
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z_]+)=(.*)$/);
    if (m && process.env[m[1]] === undefined) {
      process.env[m[1]] = m[2];
    }
  }
}

// Default for integration tests (Inbound Parse hardening).
process.env.SENDGRID_INBOUND_PARSE_SECRET =
  process.env.SENDGRID_INBOUND_PARSE_SECRET ?? 'test-inbound-secret';
