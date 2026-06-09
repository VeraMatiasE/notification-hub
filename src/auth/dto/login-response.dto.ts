import { ApiProperty } from '@nestjs/swagger';

export class LoginResponseDto {
  @ApiProperty({ example: 'jwt.token.here' })
  accessToken!: string;
}
