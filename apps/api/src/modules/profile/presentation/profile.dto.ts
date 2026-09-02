import {
  IsArray,
  IsBoolean,
  IsEmail,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  Max,
  Min,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  AppConnectionIntent,
  AppDesexed,
  AppGender,
  AppInterest,
  AppTemperament,
  AppVaccinated,
} from '../../../shared/domain/types';

export class UpdateOwnerDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  fullName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(120)
  age?: number;

  @ApiPropertyOptional({ enum: AppGender })
  @IsOptional()
  @IsEnum(AppGender)
  gender?: AppGender;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  bio?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl()
  photoUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  longitude?: number;

  @ApiPropertyOptional({ example: 'phoebe_walker' })
  @IsOptional()
  @IsString()
  @Matches(/^[a-zA-Z0-9_]{3,20}$/, {
    message: 'Handle must be 3–20 letters, numbers, or underscores',
  })
  handle?: string;
}

export class UpdatePetDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(30)
  age?: number;

  @ApiPropertyOptional({
    description: 'Pet date of birth (YYYY-MM-DD). Preferred over age; age is derived when omitted.',
    example: '2020-05-12',
  })
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  birthDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  breed?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  bio?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl()
  photoUrl?: string;

  @ApiPropertyOptional({ enum: AppTemperament, isArray: true })
  @IsOptional()
  @IsArray()
  @IsEnum(AppTemperament, { each: true })
  temperament?: AppTemperament[];

  @ApiPropertyOptional({ enum: AppVaccinated })
  @IsOptional()
  @IsEnum(AppVaccinated)
  vaccinated?: AppVaccinated;

  @ApiPropertyOptional({
    enum: AppDesexed,
    description: 'Whether the pet is desexed (Australian English for neutered/spayed)',
  })
  @IsOptional()
  @IsEnum(AppDesexed)
  desexed?: AppDesexed;

  @ApiPropertyOptional({ enum: AppGender })
  @IsOptional()
  @IsEnum(AppGender)
  gender?: AppGender;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  favoritesThings?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  favoriteMeal?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  enjoysPark?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  enjoysWater?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  enjoysWalks?: boolean;
}

export class SetInterestsDto {
  @ApiProperty({ enum: AppInterest, isArray: true })
  @IsArray()
  @IsEnum(AppInterest, { each: true })
  interests!: AppInterest[];
}

export class SetLookingForDto {
  @ApiProperty({ enum: AppConnectionIntent, isArray: true })
  @IsArray()
  @IsEnum(AppConnectionIntent, { each: true })
  lookingFor!: AppConnectionIntent[];
}
