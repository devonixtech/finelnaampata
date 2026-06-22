import {
    IsString,
    IsEmail,
    IsOptional,
    IsNumber,
    IsArray,
    IsUUID,
    MinLength,
    MaxLength,
    Min,
    Max,
    Matches,
    IsUrl,
    ValidateNested,
    IsEnum,
    IsInt,
    IsObject,
    IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DayOfWeek } from '../../../entities/business-hours.entity';
import { IsGlobalPhone } from '../../../common/validators/is-global-phone.validator';

export class BusinessHoursDto {
    @ApiProperty({ enum: DayOfWeek })
    @IsEnum(DayOfWeek)
    dayOfWeek: DayOfWeek;

    @ApiProperty({ default: true })
    @IsOptional()
    isOpen?: boolean = true;

    @ApiPropertyOptional({ example: '09:00' })
    @IsOptional()
    @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, { message: 'Invalid time format (HH:MM)' })
    openTime?: string;

    @ApiPropertyOptional({ example: '18:00' })
    @IsOptional()
    @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, { message: 'Invalid time format (HH:MM)' })
    closeTime?: string;
}

export class FaqDto {
    @ApiProperty({ example: 'What are your working hours?' })
    @IsString()
    question: string;

    @ApiProperty({ example: 'We are open 24/7.' })
    @IsString()
    answer: string;
}

export class NamedPhoneDto {
    @ApiProperty({ example: 'Sales' })
    @IsString()
    @MinLength(1)
    @MaxLength(50)
    label: string;

    @ApiProperty({ example: '+923001234567' })
    @IsString()
    @IsGlobalPhone({ message: 'Named phone must be a valid E.164 number with country code, e.g. +923001234567' })
    number: string;
}

export class CreateBusinessDto {
    @ApiProperty({ example: 'Best Restaurant' })
    @IsString()
    @MinLength(2)
    @MaxLength(255)
    title: string;

    @ApiPropertyOptional({ description: 'Category UUID (Optional if suggestedCategoryName is provided)' })
    @IsOptional()
    @IsUUID()
    categoryId?: string;

    @ApiPropertyOptional({ description: 'New category suggested by vendor' })
    @IsOptional()
    @IsString()
    @MaxLength(100)
    suggestedCategoryName?: string;

    @ApiPropertyOptional({ description: 'Array of subcategory UUIDs', type: [String] })
    @IsOptional()
    @IsArray()
    @IsUUID('4', { each: true })
    subCategoryIds?: string[];

    @ApiProperty({ example: 'A wonderful dining experience...' })
    @IsString()
    @MinLength(10)
    description: string;

    @ApiPropertyOptional({ example: 'Great food and ambiance', maxLength: 500 })
    @IsOptional()
    @IsString()
    @MaxLength(500)
    shortDescription?: string;

    @ApiPropertyOptional({ example: 'contact@restaurant.com' })
    @IsOptional()
    @IsEmail()
    email?: string;

    @ApiProperty({ example: '+1234567890' })
    @IsString()
    @IsGlobalPhone({ message: 'Phone number must be a valid E.164 number with country code, e.g. +923001234567' })
    phone: string;

    @ApiPropertyOptional({ example: '+1234567890' })
    @IsOptional()
    @IsString()
    @IsGlobalPhone({ message: 'WhatsApp number must be a valid E.164 number with country code, e.g. +923001234567' })
    whatsapp?: string;

    @ApiPropertyOptional({ type: [NamedPhoneDto], description: 'Up to 5 named phone numbers for paid plans' })
    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => NamedPhoneDto)
    namedPhoneNumbers?: NamedPhoneDto[];

    @ApiPropertyOptional({ example: 'https://restaurant.com' })
    @IsOptional()
    @IsUrl({ require_protocol: false, require_tld: false })
    website?: string;

    @ApiProperty({ example: '123 Main Street, Downtown' })
    @IsString()
    @MinLength(5)
    address: string;

    @ApiPropertyOptional({ example: 'Suite 4B / Floor 2' })
    @IsOptional()
    @IsString()
    @MaxLength(255)
    addressLine2?: string;

    @ApiProperty({ example: 'New York' })
    @IsString()
    @MinLength(2)
    @MaxLength(100)
    city: string;

    @ApiProperty({ example: 'New York' })
    @IsString()
    @MinLength(2)
    @MaxLength(100)
    state: string;

    @ApiPropertyOptional({ example: 'Pakistan', default: 'Pakistan' })
    @IsOptional()
    @IsString()
    @MaxLength(100)
    country?: string = 'Pakistan';

    @ApiPropertyOptional({ example: '10001' })
    @IsOptional()
    @IsString()
    @MaxLength(20)
    pincode?: string;

    @ApiPropertyOptional({ example: 'Asia/Karachi', description: 'IANA timezone for business hours' })
    @IsOptional()
    @IsString()
    @MaxLength(64)
    timezone?: string;

    @ApiPropertyOptional({ example: 40.7128, description: 'Latitude' })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(-90)
    @Max(90)
    latitude?: number;

    @ApiPropertyOptional({ example: -74.0060, description: 'Longitude' })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(-180)
    @Max(180)
    longitude?: number;

    @ApiPropertyOptional({ example: 'https://example.com/logo.png' })
    @IsOptional()
    @IsUrl()
    logoUrl?: string;

    @ApiPropertyOptional({ example: 'https://example.com/cover.jpg' })
    @IsOptional()
    @IsUrl()
    coverImageUrl?: string;

    @ApiPropertyOptional({ type: [String], example: ['https://example.com/img1.jpg'] })
    @IsOptional()
    @IsArray()
    @IsUrl({}, { each: true })
    images?: string[];

    @ApiPropertyOptional({ type: Object, example: { 'https://example.com/img1.jpg': 'Front view' } })
    @IsOptional()
    @IsObject()
    imageCaptions?: Record<string, string>;

    @ApiPropertyOptional({ type: [String] })
    @IsOptional()
    @IsArray()
    @IsUrl({}, { each: true })
    videos?: string[];

    @ApiPropertyOptional({ example: 2010 })
    @IsOptional()
    @IsInt()
    @Min(1800)
    @Max(new Date().getFullYear())
    yearEstablished?: number;

    @ApiPropertyOptional({ example: '10-50' })
    @IsOptional()
    @IsString()
    @MaxLength(50)
    employeeCount?: string;

    @ApiPropertyOptional({ example: '$$', enum: ['$', '$$', '$$$', '$$$$'] })
    @IsOptional()
    @IsString()
    priceRange?: string;

    @ApiPropertyOptional({ type: [BusinessHoursDto] })
    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => BusinessHoursDto)
    businessHours?: BusinessHoursDto[];

    @ApiPropertyOptional({ type: [String], description: 'Array of amenity UUIDs' })
    @IsOptional()
    @IsArray()
    @IsUUID('4', { each: true })
    amenityIds?: string[];

    @ApiPropertyOptional({ example: 'Best Restaurant in NYC' })
    @IsOptional()
    @IsString()
    @MaxLength(255)
    metaTitle?: string;

    @ApiPropertyOptional({ example: 'Find the best dining experience...' })
    @IsOptional()
    @IsString()
    metaDescription?: string;

    @ApiPropertyOptional({ example: 'restaurant, dining, food, nyc' })
    @IsOptional()
    @IsString()
    metaKeywords?: string;

    // Offer / Promo Banner
    @ApiPropertyOptional({ example: false })
    @IsOptional()
    hasOffer?: boolean;

    @ApiPropertyOptional({ example: 'Grand Opening Sale' })
    @IsOptional()
    @IsString()
    @MaxLength(150)
    offerTitle?: string;

    @ApiPropertyOptional({ example: 'Get 30% off on all services this week!' })
    @IsOptional()
    @IsString()
    offerDescription?: string;

    @ApiPropertyOptional({ example: '30% OFF' })
    @IsOptional()
    @IsString()
    @MaxLength(60)
    offerBadge?: string;

    @ApiPropertyOptional({ example: '2025-12-31' })
    @IsOptional()
    offerExpiresAt?: string;

    @ApiPropertyOptional({ example: 'https://cdn.example.com/banner.jpg' })
    @IsString()
    @IsOptional()
    offerBannerUrl?: string;

    @ApiPropertyOptional({ type: 'boolean', default: false })
    @IsOptional()
    isActive?: boolean;

    @ApiPropertyOptional({ type: [FaqDto] })
    @IsArray()
    @IsOptional()
    @ValidateNested({ each: true })
    @Type(() => FaqDto)
    faqs?: FaqDto[];

    @ApiPropertyOptional({ type: 'boolean', description: 'Legal consent checkbox state' })
    @IsOptional()
    @IsBoolean()
    legalConsentAccepted?: boolean;

    @ApiPropertyOptional({ example: '2026-05-24T15:32:10.000Z' })
    @IsOptional()
    @IsString()
    legalConsentAcceptedAt?: string;

    @ApiPropertyOptional({ example: 'web-session-abc123' })
    @IsOptional()
    @IsString()
    legalConsentSessionId?: string;

    @ApiPropertyOptional({ example: 'device-xyz789' })
    @IsOptional()
    @IsString()
    legalConsentDeviceId?: string;

    @ApiPropertyOptional({ example: 'v1' })
    @IsOptional()
    @IsString()
    termsVersion?: string;

    @ApiPropertyOptional({ example: 'v1' })
    @IsOptional()
    @IsString()
    privacyVersion?: string;
}
