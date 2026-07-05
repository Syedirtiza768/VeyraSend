import { Injectable, Logger,InternalServerErrorException } from '@nestjs/common';
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';
import { ConfigService } from '../config/config.service';

/**
 * AES-256-GCM encryption for secrets at rest (tenant SendGrid API keys).
 * The key is the 32-byte ENCRYPTION_KEY from config. Ciphertext is stored as
 * base64 of `iv || tag || ciphertext`.
 */
@Injectable()
export class CryptoService {
  private readonly logger = new Logger('CryptoService');
  private readonly key: Buffer | null;

  constructor(config: ConfigService) {
    const hex = config.all.encryptionKey;
    this.key = hex ? Buffer.from(hex, 'hex') : null;
    if (!this.key) {
      this.logger.warn('ENCRYPTION_KEY unset — secrets will be stored unencrypted. Set it before production.');
    }
  }

  get available(): boolean {
    return this.key !== null;
  }

  encrypt(plaintext: string): string {
    if (!this.key) return `plain:${plaintext}`;
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', this.key, iv);
    const enc = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    return Buffer.concat([iv, tag, enc]).toString('base64');
  }

  decrypt(ciphertext: string): string {
    if (ciphertext.startsWith('plain:')) return ciphertext.slice(6);
    if (!this.key) {
      throw new InternalServerErrorException('ENCRYPTION_KEY unset but encrypted value present.');
    }
    try {
      const buf = Buffer.from(ciphertext, 'base64');
      const iv = buf.subarray(0, 12);
      const tag = buf.subarray(12, 28);
      const enc = buf.subarray(28);
      const decipher = createDecipheriv('aes-256-gcm', this.key, iv);
      decipher.setAuthTag(tag);
      const dec = Buffer.concat([decipher.update(enc), decipher.final()]);
      return dec.toString('utf8');
    } catch (err) {
      this.logger.error(`Decrypt failed: ${(err as Error).message}`);
      throw new InternalServerErrorException('Failed to decrypt secret.');
    }
  }
}
