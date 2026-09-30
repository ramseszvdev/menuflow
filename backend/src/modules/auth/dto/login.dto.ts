import { IsEmail, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'juan@restaurante.com' })
  @Type(() => String)
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'contraseña123' })
  @Type(() => String)
  @IsString()
  password!: string;
}
