import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EmailMessage, IEmailSender } from '../domain/ports/email-sender.port';

@Injectable()
export class ResendEmailSender implements IEmailSender {
  constructor(private readonly config: ConfigService) {}

  async send(message: EmailMessage): Promise<void> {
    const apiKey = this.config.getOrThrow<string>('RESEND_API_KEY');
    const from = this.config.get<string>(
      'EMAIL_FROM',
      'Paw Connection <noreply@pawconnection.app>',
    );

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: [message.to],
        subject: message.subject,
        text: message.text,
        html: message.html,
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Failed to send email via Resend: ${response.status} ${body}`);
    }
  }
}
