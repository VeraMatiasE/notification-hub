import { IsNotEmpty, IsString, Length } from 'class-validator';

export class RegisterDto {
  @IsString()
  @Length(3, 30)
  @IsNotEmpty()
  username!: string;

  @IsString()
  @Length(8, 128)
  @IsNotEmpty()
  password!: string;
}
