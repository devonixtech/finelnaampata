import { IsEnum, IsUUID, IsArray, IsDateString, IsOptional } from 'class-validator';
import { PromotionPlacement } from '../../../entities/promotion-pricing-rule.entity';

export class BasePromotionDto {
    @IsOptional()
    @IsArray()
    @IsEnum(PromotionPlacement, { each: true })
    placements?: PromotionPlacement[];

    @IsOptional()
    @IsDateString()
    startTime?: string;

    @IsOptional()
    @IsDateString()
    endTime?: string;
}

export class CalculatePriceDto extends BasePromotionDto {
    @IsOptional()
    @IsUUID()
    offerEventId?: string;

    @IsOptional()
    @IsUUID()
    dealId?: string;

    @IsOptional()
    @IsUUID()
    eventId?: string;

    @IsOptional()
    @IsUUID()
    pricingId?: string; // ID of a Booster Plan (PricingPlan)
}

export class CreateBookingDto extends BasePromotionDto {
    @IsOptional()
    @IsUUID()
    offerEventId?: string;

    @IsOptional()
    @IsUUID()
    dealId?: string;

    @IsOptional()
    @IsUUID()
    eventId?: string;

    @IsOptional()
    @IsUUID()
    businessId?: string; 
}

