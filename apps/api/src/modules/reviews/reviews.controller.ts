import { Controller, Get, Post, Put, Body, Query, UseGuards, Req, Param } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('reviews')
export class ReviewsController {
    constructor(private readonly reviewsService: ReviewsService) { }

    @Get()
    findAll(@Query() query: any) {
        return this.reviewsService.findAll(query);
    }

    @Post()
    @UseGuards(JwtAuthGuard)
    create(@Req() req: any, @Body() createReviewDto: any) {
        const userId = req.user.id;
        const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
        const deviceId = req.headers['x-device-id'];
        return this.reviewsService.create(userId, createReviewDto, ipAddress, deviceId);
    }

    @Post(':id/helpful')
    @UseGuards(JwtAuthGuard)
    markHelpful(@Param('id') id: string, @Req() req: any) {
        return this.reviewsService.markHelpful(id, req.user.id);
    }

    @Post(':id/flag')
    @UseGuards(JwtAuthGuard)
    flagAsSpam(@Param('id') id: string, @Req() req: any) {
        return this.reviewsService.flagAsSpam(id, req.user.id);
    }

    @Put(':id/status')
    @UseGuards(JwtAuthGuard)
    updateStatus(@Param('id') id: string, @Body('status') status: 'active' | 'flagged' | 'hidden') {
        // In production, add AdminGuard to ensure only admins can do this
        return this.reviewsService.updateStatus(id, status);
    }
}
