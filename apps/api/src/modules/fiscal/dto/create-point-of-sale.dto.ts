import { IsInt, IsString, Max, Min } from 'class-validator';

export class CreatePointOfSaleDto {
  @IsInt()
  @Min(1)
  @Max(999)
  number: number;

  @IsString()
  name: string;
}
