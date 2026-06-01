import {
    IsString,
    IsNotEmpty,
    IsOptional,
    IsDateString,
    IsUUID,
    MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateDealDto {
    @ApiProperty({ example: 'Grand Opening Sale' })
    @IsString()
    @IsNotEmpty()
    @MaxLength(200)
    title: string;

    @ApiPropertyOptional({ example: 'Get 30% off all services this weekend!' })
    @IsOptional()
    @IsString()
    description?: string;

    @ApiPropertyOptional({ example: '30% OFF' })
    @IsOptional()
    @IsString()
    @MaxLength(60)
    offerBadge?: string;

    @ApiPropertyOptional({ example: 'https://res.cloudinary.com/...' })
    @IsOptional()
    @IsString()
    imageUrl?: string;

    @ApiProperty({ example: 'uuid-of-business' })
    @IsUUID()
    @IsNotEmpty()
    businessId: string;

    @ApiPropertyOptional({ example: '2026-03-10T00:00:00.000Z' })
    @IsOptional()
    @IsDateString()
    startDate?: string;

    @ApiPropertyOptional({ example: '2026-03-20T00:00:00.000Z' })
    @IsOptional()
    @IsDateString()
    endDate?: string;

    @ApiPropertyOptional({ example: '2026-03-31T00:00:00.000Z' })
    @IsOptional()
    @IsDateString()
    expiryDate?: string;

    @ApiPropertyOptional({ example: ['Free Delivery', 'Buy 1 Get 1'] })
    @IsOptional()
    @IsString({ each: true })
    highlights?: string[];

    @ApiPropertyOptional({ example: ['Valid only on weekends', 'Cannot be combined with other offers'] })
    @IsOptional()
    @IsString({ each: true })
    terms?: string[];

    @ApiPropertyOptional({ example: 'uuid-of-pricing' })
    @IsOptional()
    @IsUUID()
    pricingId?: string;
}
