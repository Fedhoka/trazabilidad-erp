import { Type } from 'class-transformer';
import { IsArray, IsDateString, IsEnum, IsNumber, IsOptional, IsString, IsUUID, Min, ValidateNested } from 'class-validator';
import { QcStatus } from '../entities/goods-receipt-line.entity';

export class CreateGoodsReceiptLineDto {
  @IsUUID()
  purchaseOrderLineId: string;

  @IsNumber()
  @Min(0.0001)
  quantity: number;

  @IsNumber()
  @Min(0)
  unitCost: number;

  @IsString()
  lotCode: string;

  @IsDateString()
  @IsOptional()
  expiresOn?: string;

  @IsEnum(QcStatus)
  qcStatus: QcStatus;

  @IsString()
  @IsOptional()
  qcNotes?: string;
}

export class CreateGoodsReceiptDto {
  @IsUUID()
  purchaseOrderId: string;

  @IsDateString()
  @IsOptional()
  receivedAt?: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateGoodsReceiptLineDto)
  lines: CreateGoodsReceiptLineDto[];
}
