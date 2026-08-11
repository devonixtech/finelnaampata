import { IsNumber, IsOptional, IsBoolean, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdatePricingRuleDto {
    @ApiPropertyOptional({ example: 2500 })
    @IsNumber()
    @Min(0)
    @IsOptional()
    pricePerDay?: number;

    @ApiPropertyOptional({ example: true })
    @IsBoolean()
    @IsOptional()
    isActive?: boolean;
}
