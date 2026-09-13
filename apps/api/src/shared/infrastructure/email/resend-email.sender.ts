import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EmailMessage, IEmailSender } from '../../domain/ports/email-sender.port';

@Injectable()
export class ResendEmailSender implements IEmailSender {
  private readonly logger = new Logger(ResendEmailSender.name);

  constructor(private readonly config: ConfigService) {}

  async send(message: EmailMessage): Promise<void> {
    const apiKey = this.config.getOrThrow<string>('RESEND_API_KEY');
    const from = this.config.get<string>(
      'EMAIL_FROM',
      'Paw Connection <onboarding@resend.dev>',
    );

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'User-Agent': 'PawConnection/1.0',
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
      this.logger.error({
        msg: 'email.resend_failed',
        status: response.status,
        to: message.to,
      });
      throw new Error(`Failed to send email via Resend: ${response.status} ${body}`);
    }

    this.logger.log({ msg: 'email.resend_accepted', to: message.to });
  }
}
