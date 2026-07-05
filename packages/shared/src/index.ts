/**
 * Shared enums and types for VeyraSend. Expanded per phase. These are the
 * cross-boundary contracts used by api, web, db, and the sendgrid wrapper.
 */

export const CampaignState = {
  DRAFT: 'draft',
  SCHEDULED: 'scheduled',
  ACTIVE: 'active',
  PAUSED: 'paused',
  COMPLETED: 'completed',
  FAILED: 'failed',
} as const;
export type CampaignState = (typeof CampaignState)[keyof typeof CampaignState];

export const MessageStatus = {
  ACCEPTED: 'accepted',
  QUEUED: 'queued',
  SENT: 'sent',
  DELIVERED: 'delivered',
  DEFERRED: 'deferred',
  BOUNCED: 'bounced',
  FAILED: 'failed',
} as const;
export type MessageStatus = (typeof MessageStatus)[keyof typeof MessageStatus];

export const EmailEventType = {
  PROCESSED: 'processed',
  DELIVERED: 'delivered',
  DEFERRED: 'deferred',
  OPEN: 'open',
  CLICK: 'click',
  BOUNCE: 'bounce',
  DROPPED: 'dropped',
  SPAM_REPORT: 'spam_report',
  UNSUBSCRIBE: 'unsubscribe',
  GROUP_UNSUBSCRIBE: 'group_unsubscribe',
  GROUP_RESUBSCRIBE: 'group_resubscribe',
} as const;
export type EmailEventType = (typeof EmailEventType)[keyof typeof EmailEventType];

export const AutomationTriggerType = {
  LIST_ADDED: 'list_added',
  TAG_ADDED: 'tag_added',
  FORM_SUBMITTED: 'form_submitted',
  API_EVENT: 'api_event',
  MANUAL: 'manual',
  EMAIL_OPENED: 'email_opened',
  EMAIL_CLICKED: 'email_clicked',
  NO_RESPONSE: 'no_response',
  DATE_BASED: 'date_based',
} as const;
export type AutomationTriggerType =
  (typeof AutomationTriggerType)[keyof typeof AutomationTriggerType];

export const AutomationActionType = {
  SEND: 'send',
  WAIT: 'wait',
  TAG: 'tag',
  MOVE_LIST: 'move_list',
  NOTIFY: 'notify',
  BRANCH: 'branch',
  STOP: 'stop',
} as const;
export type AutomationActionType =
  (typeof AutomationActionType)[keyof typeof AutomationActionType];

/** Common, tenant-scoped response envelope. */
export interface ApiResult<T> {
  data: T;
}

export interface ApiError {
  error: {
    code: string;
    message: string;
  };
}

/** Health probe contract shared by api and web. */
export interface HealthResponse {
  status: 'ok' | 'degraded' | 'down';
  service: string;
  checks: Record<string, { status: 'ok' | 'down'; detail?: string }>;
  time: string;
}
