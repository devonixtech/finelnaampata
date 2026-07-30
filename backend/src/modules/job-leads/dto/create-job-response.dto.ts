import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsNumber, IsOptional, Min, MaxLength } from 'class-validator';

export class CreateJobResponseDto {
    @ApiProperty({ example: 'I can fix this today for 4000 PKR' })
    @IsString()
    @IsNotEmpty()
    @MaxLength(2000)
    message: string;

    @ApiPropertyOptional({ example: 4000 })
    @IsNumber()
    @Min(0)
    @IsOptional()
    price?: number;
}
