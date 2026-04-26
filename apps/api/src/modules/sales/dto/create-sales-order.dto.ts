import { Type } from 'class-transformer';
import { IsArray, IsNumber, IsOptional, IsString, IsUUID, Min, ValidateNested } from 'class-validator';

export class CreateSalesOrderLineDto {
  @IsUUID()
  materialId: string;

  @IsNumber()
  @Min(0.0001)
  quantity: number;

  @IsNumber()
  @Min(0)
  unitPrice: number;
}

export class CreateSalesOrderDto {
  @IsUUID()
  customerId: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateSalesOrderLineDto)
  lines: CreateSalesOrderLineDto[];
}
