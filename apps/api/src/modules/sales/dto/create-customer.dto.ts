import { IsEmail, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { CondicionIva } from '../entities/customer.entity';

export class CreateCustomerDto {
  @IsString()
  @MinLength(2)
  name: string;

  @IsString()
  @IsOptional()
  cuit?: string;

  @IsEnum(CondicionIva)
  condicionIva: CondicionIva;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  contactName?: string;

  @IsEmail()
  @IsOptional()
  contactEmail?: string;

  @IsString()
  @IsOptional()
  contactPhone?: string;
}
