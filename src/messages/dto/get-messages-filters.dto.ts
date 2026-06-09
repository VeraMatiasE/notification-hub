import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';
import { Status } from 'src/generated/prisma/enums';

export class GetMessagesFiltersDto {
  @IsOptional()
  @IsEnum(Status)
  @ApiPropertyOptional({ example: 'success' })
  status?: Status;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ example: 'discord' })
  provider?: string;

  @IsOptional()
  @IsDateString()
  @ApiPropertyOptional({
    example: '2026-06-01',
    description: 'ISO date (YYYY-MM-DD)',
  })
  from?: string;

  @IsOptional()
  @IsDateString()
  @ApiPropertyOptional({
    example: '2026-06-02',
    description: 'ISO date (YYYY-MM-DD)',
  })
  to?: string;
}
