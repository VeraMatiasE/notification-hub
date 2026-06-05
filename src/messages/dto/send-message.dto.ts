import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export enum ProvidersName {
  DISCORD = 'discord',
  SLACK = 'slack',
  TELEGRAM = 'telegram',
}

export class ProvicerDto {
  @IsNotEmpty()
  @IsEnum(ProvidersName)
  @ApiProperty({
    enum: [ProvidersName.DISCORD, ProvidersName.SLACK, ProvidersName.TELEGRAM],
  })
  name!: ProvidersName;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: 'channel of destionation',
  })
  destination!: string;
}

export class SendMessageDto {
  @IsNotEmpty()
  @IsString()
  @ApiProperty()
  content!: string;

  @IsArray()
  @IsNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => ProvicerDto)
  @ArrayMinSize(1)
  @ArrayMaxSize(10)
  @ApiProperty({ type: [ProvicerDto] })
  providers!: ProvicerDto[];
}
