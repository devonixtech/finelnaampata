import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUUID, IsOptional, IsNumber, Min, MaxLength } from 'class-validator';

export class CreateJobLeadDto {
    @ApiProperty({ example: 'Plumbing Repair' })
    @IsString()
    @IsNotEmpty()
    @MaxLength(255)
    title: string;

    @ApiProperty({ example: 'Leaking pipe in the kitchen' })
    @IsString()
    @IsNotEmpty()
    @MaxLength(2000)
    description: string;

    @ApiProperty({ example: 'category-uuid' })
    @IsUUID()
    @IsNotEmpty()
    categoryId: string;

    @ApiPropertyOptional({ example: 'Pakistan' })
    @IsString()
    @IsOptional()
    country?: string;

    @ApiPropertyOptional({ example: 'Karachi' })
    @IsString()
    @IsOptional()
    city?: string;

    @ApiPropertyOptional({ example: 'North Nazimabad' })
    @IsString()
    @IsOptional()
    location?: string;

    @ApiPropertyOptional({ example: 5000 })
    @IsNumber()
    @Min(0)
    @IsOptional()
    budget?: number;

    @ApiPropertyOptional({ example: 24.8607 })
    @IsNumber()
    @IsOptional()
    latitude?: number;

    @ApiPropertyOptional({ example: 67.0011 })
    @IsNumber()
    @IsOptional()
    longitude?: number;
}
