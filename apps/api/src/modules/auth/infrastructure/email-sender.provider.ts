import { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EMAIL_SENDER } from '../domain/ports/email-sender.port';
import { ConsoleEmailSender } from './console-email.sender';
import { ResendEmailSender } from './resend-email.sender';

export const emailSenderProvider: Provider = {
  provide: EMAIL_SENDER,
  inject: [ConfigService],
  useFactory: (config: ConfigService) => {
    const apiKey = config.get<string>('RESEND_API_KEY')?.trim();
    return apiKey ? new ResendEmailSender(config) : new ConsoleEmailSender();
  },
};
