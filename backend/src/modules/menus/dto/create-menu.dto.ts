import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsArray,
  IsDateString,
  IsNumber,
  Min,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

class MenuRecipeDto {
  @ApiProperty({ example: 'recipe-id' })
  @IsString()
  @IsNotEmpty()
  @Type(() => String)
  recipeId!: string;

  @ApiProperty({ example: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  order?: number;
}

export class CreateMenuDto {
  @ApiProperty({ example: 'Menú de Verano 2026' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  @Type(() => String)
  name!: string;

  @ApiProperty({
    example: 'Platos frescos para temporada de calor',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string | null;

  @ApiProperty({ example: '2026-06-01T00:00:00.000Z' })
  @IsDateString()
  @Type(() => String)
  validFrom!: string;

  @ApiProperty({ example: '2026-08-31T23:59:59.000Z', required: false })
  @IsOptional()
  @IsDateString()
  @Type(() => String)
  validTo?: string;

  @ApiProperty({ type: [MenuRecipeDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MenuRecipeDto)
  recipes!: MenuRecipeDto[];
}
