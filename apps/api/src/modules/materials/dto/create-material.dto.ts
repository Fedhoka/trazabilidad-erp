import { IsEnum, IsInt, IsOptional, IsString, Min, MinLength } from 'class-validator';
import { MaterialKind } from '../entities/material.entity';

export class CreateMaterialDto {
  @IsString()
  @MinLength(2)
  name: string;

  @IsString()
  @MinLength(1)
  code: string;

  @IsEnum(MaterialKind)
  kind: MaterialKind;

  @IsString()
  baseUom: string;

  @IsInt()
  @Min(1)
  @IsOptional()
  shelfLifeDays?: number;
}
