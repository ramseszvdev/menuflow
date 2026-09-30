import { IsString, IsEnum, IsOptional, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export enum PlanType {
  BASIC = 'basic',
  PRO = 'pro',
  ENTERPRISE = 'enterprise',
}

export class CreateCheckoutDto {
  @ApiProperty({ enum: PlanType })
  @IsEnum(PlanType)
  @Type(() => String)
  plan!: PlanType;

  @ApiProperty({
    required: false,
    description:
      'Ruta o URL de retorno tras pago exitoso. Solo se aceptan destinos del frontend configurado.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(2048)
  @Type(() => String)
  successUrl?: string;

  @ApiProperty({
    required: false,
    description:
      'Ruta o URL de retorno tras cancelar el pago. Solo se aceptan destinos del frontend configurado.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(2048)
  @Type(() => String)
  cancelUrl?: string;
}

export class CreateSubscriptionDto {
  @ApiProperty()
  @IsString()
  @Type(() => String)
  priceId!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @Type(() => String)
  couponId?: string;
}

export class CancelSubscriptionDto {
  @ApiProperty()
  @IsString()
  subscriptionId!: string;
}

export class UpdatePaymentMethodDto {
  @ApiProperty()
  @IsString()
  paymentMethodId!: string;
}
