import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import { InvoiceType, PaymentMethod } from '../entities/invoice.entity';

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

  /**
   * Optional manual override for invoice type. When omitted the type is
   * derived from the customer's IVA condition (RI → A, otherwise B).
   * Required for monotributistas issuing C invoices.
   */
  @IsOptional()
  @IsEnum(InvoiceType)
  invoiceType?: InvoiceType;

  /** How the customer paid. Defaults to OTHER if not provided. */
  @IsOptional()
  @IsEnum(PaymentMethod)
  paymentMethod?: PaymentMethod;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => IssueInvoiceLineDto)
  lines: IssueInvoiceLineDto[];
}
