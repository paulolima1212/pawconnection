import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { ProfileModule } from '../profile/profile.module';
import { EmailModule } from '../../shared/infrastructure/email/email.module';
import { JwtStrategy } from './infrastructure/jwt.strategy';
import {
  GetAuthMeUseCase,
  LoginUseCase,
  RegisterUseCase,
} from './application/auth.use-cases';
import {
  RequestPasswordResetUseCase,
  ResetPasswordUseCase,
} from './application/password-reset.use-cases';
import { AuthController } from './presentation/auth.controller';
import { PASSWORD_RESET_TOKEN_REPOSITORY } from './domain/repositories/password-reset-token.repository';
import { PrismaPasswordResetTokenRepository } from './infrastructure/prisma-password-reset-token.repository';

@Module({
  imports: [
    ProfileModule,
    EmailModule,
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: config.get<string>('JWT_EXPIRES_IN', '7d') as never,
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    JwtStrategy,
    RegisterUseCase,
    LoginUseCase,
    GetAuthMeUseCase,
    RequestPasswordResetUseCase,
    ResetPasswordUseCase,
    {
      provide: PASSWORD_RESET_TOKEN_REPOSITORY,
      useClass: PrismaPasswordResetTokenRepository,
    },
  ],
  exports: [JwtModule, PassportModule],
})
export class AuthModule {}
