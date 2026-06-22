import {
    IsOptional,
    IsString,
    IsNumber,
    IsUUID,
    Min,
    Max,
    IsEnum,
    IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export enum SearchSortBy {
    RELEVANCE = 'relevance',
    DISTANCE = 'distance',
    RATING = 'rating',
    NEWEST = 'newest',
    MOST_REVIEWED = 'reviews',
    MOST_CONTACTED = 'contacted',
}

export class SearchBusinessDto extends PaginationDto {
    @ApiPropertyOptional({ example: 'restaurant' })
    @IsOptional()
    @IsString()
    query?: string;

    @ApiPropertyOptional({ example: 40.7128, description: 'User latitude' })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(-90)
    @Max(90)
    latitude?: number;

    @ApiPropertyOptional({ example: -74.0060, description: 'User longitude' })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(-180)
    @Max(180)
    longitude?: number;

    @ApiPropertyOptional({ example: 10, description: 'Search radius in kilometers', default: 10 })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(1)
    @Max(100)
    radius?: number = 10;

    @ApiPropertyOptional({ description: 'Category UUID' })
    @IsOptional()
    @IsUUID()
    categoryId?: string;

    @ApiPropertyOptional({ example: 'New York' })
    @IsOptional()
    @IsString()
    city?: string;

    @ApiPropertyOptional({ example: 'Pakistan' })
    @IsOptional()
    @IsString()
    country?: string;

    @ApiPropertyOptional({ example: 'restaurants' })
    @IsOptional()
    @IsString()
    categorySlug?: string;

    @ApiPropertyOptional({ example: 4, minimum: 1, maximum: 5 })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(1)
    @Max(5)
    minRating?: number;

    @ApiPropertyOptional({ example: '$$', enum: ['$', '$$', '$$$', '$$$$'] })
    @IsOptional()
    @IsString()
    priceRange?: string;

    @ApiPropertyOptional({ default: false })
    @IsOptional()
    @Type(() => Boolean)
    @IsBoolean()
    openNow?: boolean = false;

    @ApiPropertyOptional({ default: false })
    @IsOptional()
    @Type(() => Boolean)
    @IsBoolean()
    featuredOnly?: boolean = false;

    @ApiPropertyOptional({ default: false })
    @IsOptional()
    @Type(() => Boolean)
    @IsBoolean()
    verifiedOnly?: boolean = false;

    // Trigger redeploy to fix skipped status
    @ApiPropertyOptional({ example: 'new', description: 'Quick filter (new, featured)' })
    @IsOptional()
    @IsString()
    filter?: string;

    @ApiPropertyOptional({ default: false })
    @IsOptional()
    @Type(() => Boolean)
    @IsBoolean()
    fastResponse?: boolean = false;

    @ApiPropertyOptional({ default: false })
    @IsOptional()
    @Type(() => Boolean)
    @IsBoolean()
    onlineNow?: boolean = false;

    @ApiPropertyOptional({ default: false })
    @IsOptional()
    @Type(() => Boolean)
    @IsBoolean()
    experience?: boolean = false;

    @ApiPropertyOptional({ default: false })
    @IsOptional()
    @Type(() => Boolean)
    @IsBoolean()
    mostContacted?: boolean = false;

    @ApiPropertyOptional({ enum: SearchSortBy, default: SearchSortBy.RELEVANCE })
    @IsOptional()
    @IsEnum(SearchSortBy)
    sortBy?: SearchSortBy = SearchSortBy.RELEVANCE;

    @ApiPropertyOptional({ example: 'Restaurant', description: 'Business type filter' })
    @IsOptional()
    @IsString()
    businessType?: string;

    @ApiPropertyOptional({ description: 'The ID of the user performing the search (internal use)' })
    @IsOptional()
    @IsUUID()
    userId?: string;
}
