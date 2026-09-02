export const EMAIL_SENDER = Symbol('EMAIL_SENDER');

export interface EmailMessage {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

export interface IEmailSender {
  send(message: EmailMessage): Promise<void>;
}
