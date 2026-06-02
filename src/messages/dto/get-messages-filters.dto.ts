import { IsEnum, IsISO8601, IsOptional, IsString } from 'class-validator';
import { Status } from 'src/generated/prisma/enums';

export class GetMessagesFiltersDto {
  @IsOptional()
  @IsEnum(Status)
  status?: Status;

  @IsOptional()
  @IsString()
  provider?: string;

  @IsOptional()
  @IsISO8601()
  from?: string;

  @IsOptional()
  @IsISO8601()
  to?: string;
}
