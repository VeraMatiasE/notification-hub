import { ApiProperty } from '@nestjs/swagger';

export class UserMetricsDto {
  @ApiProperty()
  userId!: number;

  @ApiProperty({ example: 'user' })
  username!: string;

  @ApiProperty({ example: 2 })
  totalMessagesSent!: number;

  @ApiProperty({ example: 98 })
  remainingMessagesToday!: number;
}
