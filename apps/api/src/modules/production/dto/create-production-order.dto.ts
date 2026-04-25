import { IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class CreateProductionOrderDto {
  @IsUUID()
  recipeId: string;

  @IsNumber()
  @Min(0.0001)
  plannedQty: number;

  @IsString()
  @IsOptional()
  notes?: string;
}
