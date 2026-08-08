import {
    IsString,
    IsEnum,
    IsUUID,
    IsOptional,
    IsNumber,
    IsArray,
    IsBoolean,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SubscriptionPlanType } from '../../../entities/subscription-plan.entity';

export class CreatePlanDto {
    @ApiProperty({ example: 'Premium Plan' })
    @IsString()
    name: string;

    @ApiProperty({ enum: SubscriptionPlanType, example: SubscriptionPlanType.PREMIUM })
    @IsEnum(SubscriptionPlanType)
    planType: SubscriptionPlanType;

    @ApiPropertyOptional({ example: 'Unlimited listings for high-volume vendors' })
    @IsOptional()
    @IsString()
    description?: string;

    @ApiProperty({ example: 499.00 })
    @IsNumber()
    price: number;

    @ApiProperty({ example: 'monthly' })
    @IsString()
    billingCycle: string;

    @ApiProperty({ default: false })
    @IsOptional()
    @IsBoolean()
    isFeatured?: boolean = false;

    @ApiPropertyOptional({ example: { showAnalytics: true, showLeads: true, maxListings: 1 } })
    @IsOptional()
    dashboardFeatures?: Record<string, any> = {};

    @ApiPropertyOptional({ default: true })
    @IsOptional()
    @IsBoolean()
    isActive?: boolean = true;
}

export class UpdatePlanDto {
    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    name?: string;

    @ApiPropertyOptional({ enum: SubscriptionPlanType })
    @IsOptional()
    @IsEnum(SubscriptionPlanType)
    planType?: SubscriptionPlanType;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    description?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsNumber()
    price?: number;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    billingCycle?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsBoolean()
    isFeatured?: boolean;

    @ApiPropertyOptional({ example: { showAnalytics: true, showLeads: true, maxListings: 1 } })
    @IsOptional()
    dashboardFeatures?: Record<string, any>;

    @ApiPropertyOptional()
    @IsOptional()
    @IsBoolean()
    isActive?: boolean;
}

export class CheckoutDto {
    @ApiProperty({ description: 'Plan UUID' })
    @IsString()
    planId: string;

    @ApiPropertyOptional({ description: 'Target ID for boosts (Listing UUID, Offer UUID, etc.)' })
    @IsOptional()
    @IsUUID()
    targetId?: string;

    @ApiPropertyOptional({ example: 'monthly' })
    @IsOptional()
    @IsString()
    cycle?: string;

    @ApiPropertyOptional({ description: 'Referral code entered by the buyer during checkout' })
    @IsOptional()
    @IsString()
    referralCode?: string;

    @ApiPropertyOptional({ description: 'Whether to apply affiliate credits to this purchase' })
    @IsOptional()
    @IsBoolean()
    applyCredits?: boolean;
}

export class AssignPlanDto {
    @ApiProperty({ description: 'Vendor UUID' })
    @IsUUID()
    vendorId: string;

    @ApiProperty({ description: 'Plan UUID' })
    @IsString()
    planId: string;

    @ApiPropertyOptional({ description: 'Duration in days', default: 30 })
    @IsOptional()
    @IsNumber()
    durationDays?: number;
}

export class ChangePlanDto {
    @ApiProperty({ description: 'New Plan UUID' })
    @IsString()
    planId: string;
}

export class CreatePricingPlanDto {
    @ApiProperty({ example: '24 Hour Spotlight' })
    @IsString()
    name: string;

    @ApiPropertyOptional({ example: 'Featured on home page for 24 hours' })
    @IsOptional()
    @IsString()
    description?: string;

    @ApiProperty({ example: 'homepage_featured' })
    @IsString()
    type: string;

    @ApiProperty({ example: 499.00 })
    @IsNumber()
    price: number;

    @ApiProperty({ example: 24 })
    @IsNumber()
    duration: number;

    @ApiProperty({ example: 'hours' })
    @IsString()
    unit: string;

    @ApiPropertyOptional({ default: true })
    @IsOptional()
    @IsBoolean()
    isActive?: boolean = true;

    @ApiPropertyOptional()
    @IsOptional()
    features?: Record<string, any>;
}

export class UpdatePricingPlanDto {
    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    name?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    description?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    type?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsNumber()
    price?: number;

    @ApiPropertyOptional()
    @IsOptional()
    @IsNumber()
    duration?: number;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    unit?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsBoolean()
    isActive?: boolean;

    @ApiPropertyOptional()
    @IsOptional()
    features?: Record<string, any>;
}
