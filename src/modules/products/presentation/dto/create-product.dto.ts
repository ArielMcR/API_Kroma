import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateProductDto {
  @IsNotEmpty()
  @IsString()
  name!: string;

  @IsNotEmpty()
  @IsNumber()
  unitPrice!: number;

  @IsNotEmpty()
  @IsNumber()
  profitPercentage!: number;

  @IsNotEmpty()
  @IsNumber()
  salePrice!: number;

  @IsOptional()
  @IsNumber()
  stock?: number | null;
}
