import { ApiProperty } from '@nestjs/swagger';

export class ListMessageResponseDto {
  @ApiProperty({ example: 'discord' })
  provider!: string;

  @ApiProperty({ example: 'testing' })
  channel!: string;

  @ApiProperty({ example: 'SUCCESS' })
  status!: string;

  @ApiProperty({ example: '2026-06-02T12:00:00Z' })
  sentAt!: Date | null;

  @ApiProperty({ example: '2026-06-02T12:00:00Z' })
  createdAt!: Date | null;
}
