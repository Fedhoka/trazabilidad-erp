import { Type } from 'class-transformer';
import { IsArray, IsIn, IsInt, IsNumber, IsOptional, IsString, IsUUID, Min, ValidateNested } from 'class-validator';

export class IssueInvoiceLineDto {
  @IsString()
  description: string;

  @IsNumber()
  @Min(0.0001)
  quantity: number;

  @IsNumber()
  @Min(0)
  unitPrice: number;

  @IsNumber()
  @IsIn([0, 10.5, 21])
  ivaRate: number;
}

export class IssueInvoiceDto {
  @IsInt()
  @Min(1)
  pointOfSaleNumber: number;

  @IsUUID()
  customerId: string;

  @IsUUID()
  @IsOptional()
  salesOrderId?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => IssueInvoiceLineDto)
  lines: IssueInvoiceLineDto[];
}
