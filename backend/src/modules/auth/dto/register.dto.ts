import { IsEmail, IsString, MinLength, MaxLength, IsOptional, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsGlobalPhone } from '../../../common/validators/is-global-phone.validator';

export class RegisterDto {
    @ApiProperty({ example: 'user@example.com' })
    @IsEmail({}, { message: 'Invalid email format' })
    email: string;

    @ApiProperty({ example: 'SecurePass123!', minLength: 8 })
    @IsString()
    @MinLength(8, { message: 'Password must be at least 8 characters long' })
    @MaxLength(50, { message: 'Password must not exceed 50 characters' })
    @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,50}$/, { 
        message: 'Password must contain at least one uppercase letter, one lowercase letter, and one number' 
    })
    password: string;

    @ApiProperty({ example: 'John Doe' })
    @IsString()
    @MinLength(2, { message: 'Full name must be at least 2 characters long' })
    @MaxLength(100, { message: 'Full name must not exceed 100 characters' })
    fullName: string;

    @ApiPropertyOptional({ example: '+1234567890' })
    @IsOptional()
    @IsString()
    @IsGlobalPhone({ message: 'Phone number must be a valid E.164 number with country code, e.g. +923001234567' })
    phone?: string;

    @ApiPropertyOptional({ example: 'user', enum: ['user', 'vendor'] })
    @IsOptional()
    @IsString()
    role?: string = 'user';

    @ApiPropertyOptional({ example: 'REF12345' })
    @IsOptional()
    @IsString()
    referralCode?: string;
}
