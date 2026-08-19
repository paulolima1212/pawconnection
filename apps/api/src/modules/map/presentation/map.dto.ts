import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, Max, Min } from 'class-validator';

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
