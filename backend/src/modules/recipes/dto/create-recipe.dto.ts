import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  Min,
  MaxLength,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

class RecipeIngredientDto {
  @ApiProperty({ example: 'ingredient-id' })
  @IsString()
  @IsNotEmpty()
  @Type(() => String)
  ingredientId!: string;

  @ApiProperty({ example: 0.5 })
  @IsNumber()
  @Min(0)
  quantity!: number;
}

export class CreateRecipeDto {
  @ApiProperty({ example: 'Paella Valenciana' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name!: string;
  @ApiProperty({ example: 'Arroz con mariscos y verduras', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  @Type(() => String)
  description?: string;

  @ApiProperty({ example: 25.0 })
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  sellingPrice!: number;

  @ApiProperty({ example: 45, required: false })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  preparationTime?: number;

  @ApiProperty({ type: [RecipeIngredientDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RecipeIngredientDto)
  ingredients!: RecipeIngredientDto[];
}
