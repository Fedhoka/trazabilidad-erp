import { IsNumber, IsUUID, Min } from 'class-validator';

export class RecordConsumptionDto {
  @IsUUID()
  materialLotId: string;

  @IsNumber()
  @Min(0.0001)
  quantity: number;
}
