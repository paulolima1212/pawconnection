import { IsEmail, IsString, Matches, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty()
  @IsEmail()
  email!: string;

  @ApiProperty()
  @IsString()
  @MinLength(6)
  password!: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  fullName!: string;

  @ApiProperty({ example: 'phoebe_walker' })
  @IsString()
  @Matches(/^[a-zA-Z0-9_]{3,20}$/, {
    message: 'Handle must be 3–20 letters, numbers, or underscores',
  })
  handle!: string;
}

export class LoginDto {
  @ApiProperty()
  @IsEmail()
  email!: string;

  @ApiProperty()
  @IsString()
  @MinLength(6)
  password!: string;
}

export class ForgotPasswordDto {
  @ApiProperty()
  @IsEmail()
  email!: string;
}

export class ResetPasswordDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  token!: string;

  @ApiProperty()
  @IsString()
  @MinLength(6)
  password!: string;
}
