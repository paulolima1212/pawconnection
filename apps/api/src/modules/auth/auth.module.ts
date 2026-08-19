import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ProfileModule } from '../profile/profile.module';
import { JwtStrategy } from './infrastructure/jwt.strategy';
import {
  GetAuthMeUseCase,
  LoginUseCase,
  RegisterUseCase,
} from './application/auth.use-cases';
import { AuthController } from './presentation/auth.controller';

@Module({
  imports: [
    ProfileModule,
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
  providers: [JwtStrategy, RegisterUseCase, LoginUseCase, GetAuthMeUseCase],
  exports: [JwtModule, PassportModule],
})
export class AuthModule {}
