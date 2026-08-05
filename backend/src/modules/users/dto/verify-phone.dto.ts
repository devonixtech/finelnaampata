import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Length } from 'class-validator';

export class VerifyPhoneDto {
    @ApiProperty({ description: 'The 6-digit OTP code sent to the phone' })
    @IsNotEmpty()
    @IsString()
    @Length(6, 6)
    otp: string;
}
