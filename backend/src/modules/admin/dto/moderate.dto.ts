import { IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ModerateReviewDto {
    @ApiProperty({ example: true })
    isApproved: boolean;
}
