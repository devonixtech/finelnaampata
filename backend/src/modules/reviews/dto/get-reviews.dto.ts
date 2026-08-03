import { IsOptional, IsInt, IsUUID, Min, Max, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class GetReviewsDto extends PaginationDto {
    @ApiPropertyOptional({ description: 'Filter by business UUID' })
    @IsOptional()
    @IsUUID()
    businessId?: string;

    @ApiPropertyOptional({ description: 'Filter by user UUID' })
    @IsOptional()
    @IsUUID()
    userId?: string;

    @ApiPropertyOptional({ example: 5, minimum: 1, maximum: 5 })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(5)
    rating?: number;

    @ApiPropertyOptional({ description: 'Filter by vendor UUID' })
    @IsOptional()
    @IsUUID()
    vendorId?: string;

    @ApiPropertyOptional({ 
        description: 'Sort reviews by',
        enum: ['newest', 'oldest', 'highest', 'lowest', 'most_helpful', 'most_relevant', 'relevant', 'photos_first'],
        default: 'relevant'
    })
    @IsOptional()
    @IsString()
    sortBy?: string;
}
