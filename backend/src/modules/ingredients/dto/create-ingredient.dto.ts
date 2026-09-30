import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  Min,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CreateIngredientDto {
  @ApiProperty({ example: 'Harina de trigo' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  @Type(() => String)
  name!: string;

  @ApiProperty({ example: 'kg', enum: ['kg', 'g', 'l', 'ml', 'unidad'] })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  @Type(() => String)
  unit!: string;

  @ApiProperty({ example: 1.5 })
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  costPerUnit!: number;

  @ApiProperty({ example: 10, required: false })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  stock?: number;

  @ApiProperty({ example: 2, required: false })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  minStock?: number;
}
