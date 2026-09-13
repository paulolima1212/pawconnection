import { Logger, Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EMAIL_SENDER } from '../../domain/ports/email-sender.port';
import { ConsoleEmailSender } from './console-email.sender';
import { ResendEmailSender } from './resend-email.sender';

export const emailSenderProvider: Provider = {
  provide: EMAIL_SENDER,
  inject: [ConfigService],
  useFactory: (config: ConfigService) => {
    const logger = new Logger('EmailSender');
    const apiKey = config.get<string>('RESEND_API_KEY')?.trim();
    if (apiKey) {
      logger.log('Using ResendEmailSender');
      return new ResendEmailSender(config);
    }
    logger.warn(
      'RESEND_API_KEY is unset; password reset emails will only be logged to the console',
    );
    return new ConsoleEmailSender();
  },
};
