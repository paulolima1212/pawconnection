import { Injectable, Logger } from '@nestjs/common';
import { EmailMessage, IEmailSender } from '../../domain/ports/email-sender.port';

@Injectable()
export class ConsoleEmailSender implements IEmailSender {
  private readonly logger = new Logger(ConsoleEmailSender.name);

  async send(message: EmailMessage): Promise<void> {
    this.logger.log(
      `Email to ${message.to}\nSubject: ${message.subject}\n\n${message.text}`,
    );
  }
}
