import { ApiProperty } from '@nestjs/swagger';

export class MessageDeliveryResultDto {
  @ApiProperty({ example: 'discord' })
  provider!: string;

  @ApiProperty({ example: 'testing', description: 'Destination channel' })
  destination!: string;

  @ApiProperty({
    enum: ['SUCCESS', 'FAILED'],
    example: 'SUCCESS',
  })
  status!: 'SUCCESS' | 'FAILED';

  @ApiProperty({
    required: false,
    example: 'Connection timeout',
  })
  errorMessage?: string;
}

export class SendMessageResponseDto {
  @ApiProperty({ example: 'testing' })
  content!: string;

  @ApiProperty({ example: '2026-06-02T12:00:00.00Z' })
  createdAt!: Date;

  @ApiProperty({ type: [MessageDeliveryResultDto] })
  deliveries!: MessageDeliveryResultDto[];
}
