import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class StatsQueryDto {
  /**
   * Number of months of history to return (rolling window ending in the
   * current month). Default 12, capped at 36 to keep queries fast.
   */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(3)
  @Max(36)
  months?: number = 12;
}
