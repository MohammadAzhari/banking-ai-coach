// WhatsApp message types, webhook payloads, etc.
export interface WhatsAppMessage {
  from: string;
  to: string;
  body: string;
  timestamp: string;
  messageId: string;
}

export interface WebhookPayload {
  entry: Array<{
    changes: Array<{
      value: {
        messages?: Array<any>;
        statuses?: Array<any>;
      };
    }>;
  }>;
}