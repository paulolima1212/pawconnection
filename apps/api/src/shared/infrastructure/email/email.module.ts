import { Module } from '@nestjs/common';
import { EMAIL_SENDER } from '../../domain/ports/email-sender.port';
import { emailSenderProvider } from './email-sender.provider';

@Module({
  providers: [emailSenderProvider],
  exports: [EMAIL_SENDER],
})
export class EmailModule {}
