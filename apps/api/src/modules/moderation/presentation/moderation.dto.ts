import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { REPORT_REASONS, ReportReason } from '../domain/report-reason';
import { REPORT_DETAILS_MAX_LENGTH } from '../domain/post-report.entity';

export class ReportPostDto {
  @ApiProperty({ enum: REPORT_REASONS })
  @IsString()
  @IsIn([...REPORT_REASONS])
  reason!: ReportReason;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(REPORT_DETAILS_MAX_LENGTH)
  details?: string;
}
