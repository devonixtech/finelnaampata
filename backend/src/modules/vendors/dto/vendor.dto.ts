import {
    IsString,
    IsEmail,
    IsOptional,
    IsPhoneNumber,
    MaxLength,
    MinLength,
    IsUrl,
    IsArray,
    ValidateNested,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// Helper: treat empty strings the same as undefined so @IsEmail() etc. are skipped
const trimToUndefined = ({ value }: { value: any }) =>
    typeof value === 'string' && value.trim() === '' ? undefined : value;

export class CreateVendorDto {
    @ApiProperty({ example: 'My Awesome Shop' })
    @IsString()
    @MinLength(2)
    @MaxLength(255)
    businessName: string;

    @ApiPropertyOptional({ example: 'contact@mybusiness.com' })
    @IsOptional()
    @Transform(trimToUndefined)
    @IsEmail()
    businessEmail?: string;

    @ApiProperty({ example: '+1234567890' })
    @IsString()
    @MinLength(8)
    businessPhone: string;

    @ApiProperty({ example: '123 Business Rd, Office 4B' })
    @IsString()
    @MinLength(5)
    businessAddress: string;

    @ApiPropertyOptional({ example: 'GSTIN123456789' })
    @IsOptional()
    @Transform(trimToUndefined)
    @IsString()
    gstNumber?: string;

    @ApiPropertyOptional({ example: '1234567-8' })
    @IsOptional()
    @Transform(trimToUndefined)
    @IsString()
    ntnNumber?: string;

    @ApiPropertyOptional({ example: 'Pakistan' })
    @IsOptional()
    @IsString()
    country?: string;

    @ApiPropertyOptional({ example: 'Islamabad' })
    @IsOptional()
    @IsString()
    city?: string;

    @ApiPropertyOptional({ example: 'Federal' })
    @IsOptional()
    @IsString()
    state?: string;
}

export class UpdateVendorDto {
    @ApiPropertyOptional({ example: 'Updated Business Name' })
    @IsOptional()
    @Transform(trimToUndefined)
    @IsString()
    businessName?: string;

    @ApiPropertyOptional({ example: 'newemail@business.com' })
    @IsOptional()
    @Transform(trimToUndefined)
    @IsEmail()
    businessEmail?: string;

    @ApiPropertyOptional({ example: '+9876543210' })
    @IsOptional()
    @Transform(trimToUndefined)
    @IsString()
    businessPhone?: string;

    @ApiProperty({ example: 'New Address' })
    @IsString()
    @MinLength(5)
    businessAddress: string;

    @ApiPropertyOptional({ example: 'GSTIN123456789' })
    @IsOptional()
    @Transform(trimToUndefined)
    @IsString()
    gstNumber?: string;

    @ApiPropertyOptional({ example: '1234567-8' })
    @IsOptional()
    @Transform(trimToUndefined)
    @IsString()
    ntnNumber?: string;

    @ApiPropertyOptional({ example: { monday: { isOpen: true, openTime: '09:00', closeTime: '17:00' } } })
    @IsOptional()
    businessHours?: Record<string, { isOpen: boolean, openTime: string, closeTime: string }>;

    @ApiPropertyOptional({ example: [{ platform: 'facebook', url: 'https://facebook.com/mybusiness' }] })
    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => SocialLinkDto)
    socialLinks?: SocialLinkDto[];

    @ApiPropertyOptional({ example: 'A brief bio about the business' })
    @IsOptional()
    @Transform(trimToUndefined)
    @IsString()
    bio?: string;

    @ApiPropertyOptional({ example: 'Pakistan' })
    @IsOptional()
    @IsString()
    country?: string;

    @ApiPropertyOptional({ example: 'Islamabad' })
    @IsOptional()
    @IsString()
    city?: string;

    @ApiPropertyOptional({ example: 'Federal' })
    @IsOptional()
    @IsString()
    state?: string;
}

export class SocialLinkDto {
    @ApiProperty({ example: 'facebook' })
    @IsString()
    platform: string;

    @ApiProperty({ example: 'https://facebook.com/mybusiness' })
    @IsUrl({ require_protocol: false, require_tld: false })
    url: string;
}

export class VendorProfileDto {
    @ApiProperty()
    id: string;

    @ApiProperty()
    businessName: string;

    @ApiPropertyOptional()
    slug?: string;

    @ApiPropertyOptional()
    businessEmail?: string;

    @ApiProperty()
    businessPhone: string;

    @ApiProperty()
    businessAddress: string;

    @ApiProperty()
    isVerified: boolean;

    @ApiPropertyOptional()
    bio?: string;

    @ApiPropertyOptional({ type: [SocialLinkDto] })
    socialLinks?: SocialLinkDto[];

    @ApiPropertyOptional()
    country?: string;

    @ApiPropertyOptional()
    city?: string;

    @ApiPropertyOptional()
    state?: string;
}

export class ListingSummaryDto {
    @ApiProperty()
    id: string;

    @ApiProperty()
    title: string;

    @ApiProperty()
    slug: string;

    @ApiProperty({ type: [String] })
    images: string[];

    @ApiPropertyOptional()
    coverImageUrl?: string;

    @ApiPropertyOptional()
    logoUrl?: string;

    @ApiProperty()
    averageRating: number;

    @ApiProperty()
    totalReviews: number;

    @ApiProperty()
    city: string;

    @ApiPropertyOptional()
    categoryName?: string;
}

export class PublicVendorProfileDto {
    @ApiProperty()
    id: string;

    @ApiProperty()
    businessName: string;

    @ApiProperty()
    slug: string;

    @ApiProperty()
    vendorName: string;

    @ApiPropertyOptional()
    businessEmail?: string;

    @ApiPropertyOptional()
    businessPhone?: string;

    @ApiProperty()
    businessAddress: string;

    @ApiProperty()
    isVerified: boolean;

    @ApiPropertyOptional()
    avatarUrl?: string;

    @ApiPropertyOptional()
    bio?: string;

    @ApiProperty()
    listingCount: number;

    @ApiProperty()
    avgRating: number;

    @ApiProperty()
    totalViews: number;

    @ApiProperty({ type: [String] })
    categories: string[];

    @ApiPropertyOptional()
    createdAt?: Date;

    @ApiProperty({ type: [ListingSummaryDto] })
    @Type(() => ListingSummaryDto)
    listings: ListingSummaryDto[];
}


export class AnalyticsPointDto {
    @ApiProperty({ example: 'Jan 01' })
    day: string;

    @ApiProperty({ example: '2026-01-01' })
    date: string;

    @ApiProperty({ example: 5 })
    leads: number;

    @ApiProperty({ example: 25 })
    views: number;
}

export class VendorDashboardStatsDto {
    @ApiProperty({ example: 1 })
    businessCount: number;

    @ApiProperty({ example: 0 })
    pendingCount: number;

    @ApiPropertyOptional()
    activeSubscription: any;

    @ApiProperty({ example: 150 })
    totalLeads: number;

    @ApiProperty({ example: 1200 })
    totalViews: number;

    @ApiProperty({ example: 45 })
    totalReviews: number;

    @ApiProperty({ example: 85 })
    profileCompletion: number;

    @ApiProperty({ example: true })
    isVerified: boolean;

    @ApiProperty({ type: [AnalyticsPointDto] })
    analytics: AnalyticsPointDto[];
}

