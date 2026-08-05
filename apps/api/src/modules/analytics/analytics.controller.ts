import { Controller, Post, Get, Param, Body, Req, UseGuards, Query } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { AnalyticsEventType } from '../../entities/business-analytics.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Request } from 'express';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Post('track/impression')
  async trackImpressions(
    @Body('businessIds') businessIds: string[],
    @Req() req: Request
  ) {
    if (!businessIds || !businessIds.length) return { success: true };
    const ip = req.ip || req.headers['x-forwarded-for'] as string;
    await this.analyticsService.trackImpressions(businessIds, ip);
    return { success: true };
  }

  @Post('track/view/:businessId')
  async trackView(
    @Param('businessId') businessId: string,
    @Req() req: Request
  ) {
    const ip = req.ip || req.headers['x-forwarded-for'] as string;
    await this.analyticsService.trackEvent(businessId, AnalyticsEventType.VIEW, ip);
    return { success: true };
  }

  @Post('track/contact/:businessId')
  async trackContact(
    @Param('businessId') businessId: string,
    @Body('type') type: string,
    @Req() req: Request
  ) {
    const ip = req.ip || req.headers['x-forwarded-for'] as string;
    
    let eventType = AnalyticsEventType.CONTACT_WEBSITE;
    if (type === 'call') eventType = AnalyticsEventType.CONTACT_CALL;
    if (type === 'sms') eventType = AnalyticsEventType.CONTACT_SMS;
    if (type === 'whatsapp') eventType = AnalyticsEventType.CONTACT_WHATSAPP;

    await this.analyticsService.trackEvent(businessId, eventType, ip);
    return { success: true };
  }

  @UseGuards(JwtAuthGuard)
  @Get('vendor/stats')
  async getVendorStats(@Req() req: any, @Query('days') days?: string) {
    const vendorId = req.user.id;
    const timeRangeDays = days ? parseInt(days, 10) : 30;
    return this.analyticsService.getVendorStats(vendorId, timeRangeDays);
  }
}
