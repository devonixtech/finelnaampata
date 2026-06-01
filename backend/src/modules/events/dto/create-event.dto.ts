import {
    IsString,
    IsNotEmpty,
    IsOptional,
    IsDateString,
    IsUUID,
    MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateEventDto {
    @ApiProperty({ example: 'Tech Conference 2026' })
    @IsString()
    @IsNotEmpty()
    @MaxLength(200)
    title: string;

    @ApiPropertyOptional({ example: 'Annual technology conference with guest speakers' })
    @IsOptional()
    @IsString()
    description?: string;

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

    @ApiPropertyOptional({ example: ['Networking Session', 'Interactive Workshops'] })
    @IsOptional()
    @IsString({ each: true })
    highlights?: string[];

    @ApiPropertyOptional({ example: ['Age limit: 18+', 'Ticket required for entry'] })
    @IsOptional()
    @IsString({ each: true })
    terms?: string[];

    @ApiPropertyOptional({ example: 'uuid-of-pricing' })
    @IsOptional()
    @IsUUID()
    pricingId?: string;
}
