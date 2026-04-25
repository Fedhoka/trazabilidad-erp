import { PartialType } from '@nestjs/mapped-types';
import { IsBoolean, IsOptional } from 'class-validator';
import { CreateMaterialDto } from './create-material.dto';

export class UpdateMaterialDto extends PartialType(CreateMaterialDto) {
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
