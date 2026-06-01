import { IsNumberString, IsOptional, IsString } from 'class-validator';

export class DuplicateCheckDto {
    @IsString()
    businessName: string;

    @IsString()
    phone: string;

    @IsString()
    address: string;

    @IsString()
    city: string;

    @IsOptional()
    @IsString()
    state?: string;

    @IsOptional()
    @IsNumberString()
    latitude?: string;

    @IsOptional()
    @IsNumberString()
    longitude?: string;
}

