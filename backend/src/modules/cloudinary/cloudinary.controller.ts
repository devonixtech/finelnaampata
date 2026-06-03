import { Controller, Post, Body, UseGuards, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Public } from '../../common/decorators/public.decorator';
import { CloudinaryService } from './cloudinary.service';

@ApiTags('cloudinary')
@Controller('cloudinary')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CloudinaryController {
    constructor(private readonly cloudinaryService: CloudinaryService) { }

    @Post('sign')
    @Public()
    @ApiOperation({ summary: 'Generate Cloudinary upload signature' })
    @ApiResponse({ status: 200, description: 'Signature generated' })
    async getSignature() {
        return this.cloudinaryService.generateSignature();
    }
}
