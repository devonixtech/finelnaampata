import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { BusinessAnalytics, AnalyticsEventType } from '../../entities/business-analytics.entity';
import { Business } from '../../entities/business.entity';

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(
    @InjectRepository(BusinessAnalytics)
    private readonly analyticsRepository: Repository<BusinessAnalytics>,
    @InjectRepository(Business)
    private readonly businessRepository: Repository<Business>,
  ) {}

  async trackEvent(
    businessId: string,
    eventType: AnalyticsEventType,
    ipAddress?: string,
    deviceId?: string
  ): Promise<void> {
    try {
      // 24-hour rate limit check for the same event and IP
      if (ipAddress) {
        const twentyFourHoursAgo = new Date();
        twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

        const recentEvent = await this.analyticsRepository.findOne({
          where: {
            businessId,
            eventType,
            ipAddress,
            createdAt: MoreThan(twentyFourHoursAgo),
          },
        });

        // If this IP has already triggered this exact event on this business in the last 24 hours, skip it
        if (recentEvent) {
          return;
        }
      }

      const business = await this.businessRepository.findOne({ where: { id: businessId } });
      if (!business) return;

      const event = this.analyticsRepository.create({
        businessId,
        eventType,
        ipAddress,
        deviceId,
      });

      await this.analyticsRepository.save(event);
    } catch (error) {
      this.logger.error(`Failed to track event ${eventType} for business ${businessId}`, error.stack);
    }
  }

  async trackImpressions(
    businessIds: string[],
    ipAddress?: string,
    deviceId?: string
  ): Promise<void> {
    try {
      const twentyFourHoursAgo = new Date();
      twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

      // Simple bulk insert, relying on logic to skip duplicate tracking if needed
      // To keep it performant for search results, we might skip the strict 24h DB check per business here,
      // or we can load recent impressions for this IP and filter.
      let idsToTrack = businessIds;

      if (ipAddress) {
        const recentImpressions = await this.analyticsRepository.find({
          where: {
            eventType: AnalyticsEventType.IMPRESSION,
            ipAddress,
            createdAt: MoreThan(twentyFourHoursAgo),
          },
          select: ['businessId'],
        });
        const recentlySeenIds = new Set(recentImpressions.map((i) => i.businessId));
        idsToTrack = businessIds.filter((id) => !recentlySeenIds.has(id));
      }

      if (idsToTrack.length === 0) return;

      const events = idsToTrack.map((id) =>
        this.analyticsRepository.create({
          businessId: id,
          eventType: AnalyticsEventType.IMPRESSION,
          ipAddress,
          deviceId,
        })
      );

      await this.analyticsRepository.save(events);
    } catch (error) {
      this.logger.error(`Failed to track impressions`, error.stack);
    }
  }

  async getVendorStats(vendorId: string, timeRangeDays: number = 30) {
    // This will calculate stats for the dashboard
    // Impression -> View -> Contact -> Conversion
    
    // In a real scenario, we'd query by business.vendorId, but for simplicity here we query by businessId 
    // assuming we get the business associated with the vendor.
    const businesses = await this.businessRepository.find({ where: { vendor: { id: vendorId } } });
    if (!businesses.length) return { impressions: 0, views: 0, contacts: 0, conversions: 0 };
    
    const businessIds = businesses.map(b => b.id);
    
    const dateLimit = new Date();
    dateLimit.setDate(dateLimit.getDate() - timeRangeDays);

    const stats = await this.analyticsRepository
      .createQueryBuilder('analytics')
      .select('analytics.eventType', 'eventType')
      .addSelect('COUNT(analytics.id)', 'count')
      .where('analytics.businessId IN (:...businessIds)', { businessIds })
      .andWhere('analytics.createdAt >= :dateLimit', { dateLimit })
      .groupBy('analytics.eventType')
      .getRawMany();

    const summary = {
      impressions: 0,
      views: 0,
      contacts: 0,
      conversions: 0,
    };

    for (const stat of stats) {
      const type = stat.eventType as AnalyticsEventType;
      const count = parseInt(stat.count, 10);
      
      if (type === AnalyticsEventType.IMPRESSION) summary.impressions += count;
      if (type === AnalyticsEventType.VIEW) summary.views += count;
      if (
        [
          AnalyticsEventType.CONTACT_CALL, 
          AnalyticsEventType.CONTACT_SMS, 
          AnalyticsEventType.CONTACT_WHATSAPP, 
          AnalyticsEventType.CONTACT_WEBSITE
        ].includes(type)
      ) {
        summary.contacts += count;
      }
      if (
        [
          AnalyticsEventType.CONVERSION_CHAT, 
          AnalyticsEventType.CONVERSION_ENQUIRY
        ].includes(type)
      ) {
        summary.conversions += count;
      }
    }

    return summary;
  }
}
