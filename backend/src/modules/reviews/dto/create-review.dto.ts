import {
    IsString,
    IsInt,
    IsOptional,
    IsArray,
    IsUUID,
    Min,
    Max,
    MinLength,
    MaxLength,
    ArrayMaxSize,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateReviewDto {
    @ApiProperty({ description: 'Business UUID' })
    @IsUUID()
    businessId: string;

    @ApiProperty({ example: 5, minimum: 1, maximum: 5 })
    @IsInt()
    @Min(1, { message: 'Rating must be at least 1' })
    @Max(5, { message: 'Rating must not exceed 5' })
    rating: number;

    @ApiPropertyOptional({ example: 'Excellent service!' })
    @IsOptional()
    @IsString()
    @MinLength(3)
    @MaxLength(255)
    title?: string;

    @ApiPropertyOptional({ example: 'Had a wonderful experience. Highly recommended!' })
    @IsOptional()
    @IsString()
    @MinLength(10)
    comment?: string;

    @ApiPropertyOptional({ type: [String], example: ['https://example.com/img1.jpg'], description: 'Max 5 photos' })
    @IsOptional()
    @IsArray()
    @ArrayMaxSize(5, { message: 'Maximum 5 photos allowed per review' })
    @IsString({ each: true })
    images?: string[];
}
