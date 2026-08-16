import { Type } from 'class-transformer';
import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export class CreateSaleItemDto {
  @IsNotEmpty()
  @IsNumber()
  productId!: number;

  @IsNotEmpty()
  @IsNumber()
  quantity!: number;
}

export class CreateSaleDto {
  @IsOptional()
  @IsNumber()
  clientId?: number | null;

  @IsNotEmpty()
  @IsString()
  paymentMethod!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateSaleItemDto)
  items!: CreateSaleItemDto[];
}
