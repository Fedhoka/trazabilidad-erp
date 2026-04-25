import { Type } from 'class-transformer';
import { IsArray, IsNumber, IsOptional, IsString, IsUUID, Min, ValidateNested } from 'class-validator';

export class CreatePurchaseOrderLineDto {
  @IsUUID()
  materialId: string;

  @IsNumber()
  @Min(0.0001)
  quantity: number;

  @IsNumber()
  @Min(0)
  unitPrice: number;
}

export class CreatePurchaseOrderDto {
  @IsUUID()
  supplierId: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePurchaseOrderLineDto)
  lines: CreatePurchaseOrderLineDto[];
}
