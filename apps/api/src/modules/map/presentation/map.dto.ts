import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsNumber, IsOptional, Max, Min } from 'class-validator';

export class UpdateMapLocationDto {
  @ApiProperty({ example: -23.5505 })
  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude!: number;

  @ApiProperty({ example: -46.6333 })
  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude!: number;
}

export class ListDogFriendlyPlacesQueryDto {
  @ApiProperty({ example: -33.8688 })
  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude!: number;

  @ApiProperty({ example: 151.2093 })
  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude!: number;

  @ApiPropertyOptional({ example: 5, description: 'Search radius in km (1–50). Defaults to 5.' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(50)
  radiusKm?: number;

  @ApiPropertyOptional({
    enum: ['forYou', 'parks', 'services', 'cafes', 'all'],
    description: 'forYou personalizes types from the viewer profile',
  })
  @IsOptional()
  @IsIn(['forYou', 'parks', 'services', 'cafes', 'all'])
  category?: string;
}

export class MapUserPinDto {
  @ApiProperty() id!: string;
  @ApiProperty() fullName!: string;
  @ApiProperty() handle!: string;
  @ApiProperty({ nullable: true }) photoUrl!: string | null;
  @ApiProperty({ nullable: true }) ownerAge!: number | null;
  @ApiProperty({ enum: ['Male', 'Female'] }) ownerGender!: string;
  @ApiProperty({ nullable: true }) ownerBio!: string | null;
  @ApiProperty({ nullable: true }) petName!: string | null;
  @ApiProperty({ nullable: true }) petPhotoUrl!: string | null;
  @ApiProperty({ nullable: true }) petBreed!: string | null;
  @ApiProperty({ enum: ['Male', 'Female'] }) petGender!: string;
  @ApiProperty({ nullable: true }) petBio!: string | null;
  @ApiProperty({ type: [String] }) lookingFor!: string[];
  @ApiProperty() latitude!: number;
  @ApiProperty() longitude!: number;
  @ApiProperty({ nullable: true }) distanceKm!: number | null;
  @ApiProperty({ nullable: true }) locationUpdatedAt!: string | null;
}
