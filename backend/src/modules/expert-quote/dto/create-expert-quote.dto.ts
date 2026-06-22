import { IsEmail, IsString, IsOptional, IsPhoneNumber, MinLength, MaxLength } from 'class-validator';

export class CreateExpertQuoteDto {
    @IsString()
    @MinLength(2)
    @MaxLength(150)
    customerName: string;

    @IsEmail()
    customerEmail: string;

    @IsOptional()
    @IsString()
    customerPhone?: string;

    @IsString()
    @MaxLength(150)
    categorySlug: string;

    @IsString()
    @MaxLength(200)
    categoryName: string;

    @IsString()
    @MinLength(20)
    @MaxLength(2000)
    description: string;

    @IsOptional()
    @IsString()
    preferredContact?: string;

    @IsOptional()
    @IsString()
    city?: string;

    @IsOptional()
    @IsString()
    userId?: string;
}
