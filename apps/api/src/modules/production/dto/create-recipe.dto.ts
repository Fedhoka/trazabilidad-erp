import { Type } from 'class-transformer';
import { IsArray, IsNumber, IsOptional, IsString, IsUUID, Max, Min, MinLength, ValidateNested } from 'class-validator';

export class CreateRecipeComponentDto {
  @IsUUID()
  materialId: string;

  @IsNumber()
  @Min(0.0001)
  qtyPerBatch: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  lossPct?: number;
}

export class CreateRecipeDto {
  @IsString()
  @MinLength(2)
  name: string;

  @IsUUID()
  outputMaterialId: string;

  @IsNumber()
  @Min(0.0001)
  outputQty: number;

  @IsString()
  batchSizeUom: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateRecipeComponentDto)
  components: CreateRecipeComponentDto[];
}
