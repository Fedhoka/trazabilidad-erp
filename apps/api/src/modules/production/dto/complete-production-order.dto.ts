import { IsDateString, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CompleteProductionOrderDto {
  @IsNumber()
  @Min(0.0001)
  actualQty: number;

  @IsString()
  lotCode: string;

  @IsDateString()
  @IsOptional()
  expiresOn?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
