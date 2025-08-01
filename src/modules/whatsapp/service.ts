import axios from "axios";
import { whatsappConfig } from "./config";
import { WhatsAppMessage } from "./types";

export class WhatsAppService {
  private apiUrl: string;

  constructor() {
    this.apiUrl = `${whatsappConfig.apiUrl}/${whatsappConfig.apiVersion}/${whatsappConfig.phoneNumberId}`;
  }

  // Send a text message
  async sendMessage(to: string, message: string): Promise<any> {
    const response = await axios.post(
      `${this.apiUrl}/messages`,
      {
        messaging_product: "whatsapp",
        to: to,
        type: "text",
        text: { body: message },
      },
      {
        headers: {
          Authorization: `Bearer ${whatsappConfig.accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );
    return response.data;
  }

  // Send interactive button message
  async sendButtonMessage(
    to: string,
    bodyText: string,
    buttons: Array<{ id: string; title: string }>
  ): Promise<any> {
    const response = await axios.post(
      `${this.apiUrl}/messages`,
      {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: to,
        type: "interactive",
        interactive: {
          type: "button",
          body: {
            text: bodyText,
          },
          action: {
            buttons: buttons.map((button) => ({
              type: "reply",
              reply: {
                id: button.id,
                title: button.title,
              },
            })),
          },
        },
      },
      {
        headers: {
          Authorization: `Bearer ${whatsappConfig.accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );
    return response.data;
  }

  // Process incoming webhook messages
  processWebhookMessage(body: any): WhatsAppMessage | null {
    const entry = body.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;
    const message = value?.messages?.[0];
    const profileName = value?.contacts?.[0].profile.name;

    if (message) {
      // Handle both text messages and button responses
      let messageBody = "";

      if (message.type === "text") {
        messageBody = message.text?.body || "";
      } else if (
        message.type === "interactive" &&
        message.interactive?.type === "button_reply"
      ) {
        messageBody = message.interactive.button_reply.id || "";
      }

      return {
        from: message.from,
        to: whatsappConfig.phoneNumberId,
        body: messageBody,
        timestamp: message.timestamp,
        messageId: message.id,
        profileName,
      };
    }
    return null;
  }

  // Send a template message
  async sendTemplate(
    to: string,
    templateName: string,
    languageCode: string = "en"
  ): Promise<any> {
    const response = await axios.post(
      `${this.apiUrl}/messages`,
      {
        messaging_product: "whatsapp",
        to: to,
        type: "template",
        template: {
          name: templateName,
          language: { code: languageCode },
        },
      },
      {
        headers: {
          Authorization: `Bearer ${whatsappConfig.accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );
    return response.data;
  }
}

export const whatsappService = new WhatsAppService();
