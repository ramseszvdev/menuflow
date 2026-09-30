// register.dto.ts
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';

export class RegisterDto {
  @IsEmail()
  @Type(() => String)
  email!: string;

  @IsString()
  @Type(() => String)
  @MinLength(6)
  password!: string;

  @IsString()
  @Type(() => String)
  @IsNotEmpty()
  name!: string;

  @IsString()
  @Type(() => String)
  @IsNotEmpty()
  restaurantName!: string;

  @IsString()
  @IsOptional()
  @Type(() => String)
  phone?: string;
}
