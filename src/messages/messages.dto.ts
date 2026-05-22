import { IsEnum, IsNotEmpty, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export enum ProvidersName {
  DISCORD = 'discord',
  SLACK = 'slack',
  TELEGRAM = 'telegram',
}

export class ProvicerDto {
  @IsNotEmpty()
  @IsEnum(ProvidersName)
  name!: ProvidersName;

  @IsNotEmpty()
  @IsString()
  destination!: string;
}

export class MessagesDTO {
  @IsNotEmpty()
  @IsString()
  content!: string;

  @IsNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => ProvicerDto)
  providers!: ProvicerDto[];
}
