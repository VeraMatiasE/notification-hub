import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Length } from 'class-validator';

export class RegisterDto {
  @IsString()
  @Length(3, 30)
  @IsNotEmpty()
  @ApiProperty()
  username!: string;

  @IsString()
  @Length(8, 128)
  @IsNotEmpty()
  @ApiProperty()
  password!: string;
}
