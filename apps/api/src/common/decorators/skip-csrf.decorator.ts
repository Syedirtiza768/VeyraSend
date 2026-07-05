import { SetMetadata } from '@nestjs/common';

export const NO_CSRF_KEY = 'noCsrf';

/**
 * Exempts a route from the double-submit CSRF guard. Use ONLY for inbound
 * webhooks from external services (SendGrid event/Inbound Parse) which cannot
 * present a CSRF token. Such routes must instead verify request authenticity
 * via a signature or shared secret.
 */
export const SkipCsrf = () => SetMetadata(NO_CSRF_KEY, true);
