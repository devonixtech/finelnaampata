import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Brackets } from 'typeorm';
import { SearchLog, NotificationLog, Listing, City, Vendor, Category, User } from '../../entities';
import { CategoryStatus } from '../../entities/category.entity';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { ConfigService } from '@nestjs/config';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationsGateway } from '../notifications/notifications.gateway';

export interface DemandInsight {
    keyword: string;
    normalizedKeyword: string;
    score: number;
    count1h?: number;
    count6h?: number;
    count24h?: number;
    count7d?: number;
    topCity?: string;
    growth: number;
    isTrending: boolean;
    type: 'keyword' | 'category';
}

@Injectable()
export class DemandService {
    private readonly logger = new Logger(DemandService.name);
    private genAI: GoogleGenerativeAI;

    constructor(
        @InjectRepository(SearchLog)
        private searchLogRepository: Repository<SearchLog>,
        @InjectRepository(NotificationLog)
        private notificationLogRepository: Repository<NotificationLog>,
        @InjectRepository(Listing)
        private listingRepository: Repository<Listing>,
        @InjectRepository(City)
        private cityRepository: Repository<City>,
        @InjectRepository(Category)
        private categoryRepository: Repository<Category>,
        @InjectRepository(Vendor)
        private vendorRepository: Repository<Vendor>,
        @InjectRepository(User)
        private userRepository: Repository<User>,
        private configService: ConfigService,
        private notificationsService: NotificationsService,
        private notificationsGateway: NotificationsGateway,
    ) {
        const apiKey = this.configService.get<string>('GEMINI_API_KEY');
        if (apiKey) {
            this.genAI = new GoogleGenerativeAI(apiKey);
        }
    }

    async logSearch(data: {
        keyword: string;
        city?: string;
        categorySlug?: string;
        latitude?: number;
        longitude?: number;
        userId?: string;
        resultsCount?: number;
        ipAddress?: string;
        userAgent?: string;
    }) {
        let { latitude, longitude } = data;

        if ((!latitude || !longitude) && data.city) {
            try {
                const city = await this.cityRepository.createQueryBuilder('city')
                    .where('LOWER(city.name) = LOWER(:name)', { name: data.city })
                    .getOne();
                if (city) {
                    latitude = city.latitude;
                    longitude = city.longitude;
                }
            } catch (e) {
                this.logger.warn(`Failed to fetch coordinates for city: ${data.city}`);
            }
        }

        let displayKeyword = data.keyword?.trim() || '';
        
        // If no keyword but has category, fetch category name for display
        if (!displayKeyword && data.categorySlug) {
            try {
                const category = await this.categoryRepository.findOne({ 
                    where: { slug: data.categorySlug } 
                });
                if (category) {
                    displayKeyword = category.name;
                } else {
                    displayKeyword = data.categorySlug;
                }
            } catch (e) {
                displayKeyword = data.categorySlug;
            }
        }

        const normalizedKeyword = data.keyword?.trim() 
            ? data.keyword.toLowerCase().trim() 
            : (data.categorySlug ? `category:${data.categorySlug}` : 'all');

        const log = this.searchLogRepository.create({
            keyword: displayKeyword,
            city: data.city,
            categorySlug: data.categorySlug,
            latitude,
            longitude,
            userId: data.userId,
            resultsCount: data.resultsCount || 0,
            ipAddress: data.ipAddress,
            userAgent: data.userAgent,
            searchedAt: new Date(),
            normalizedKeyword,
        });
        const savedLog = await this.searchLogRepository.save(log);

        setImmediate(async () => {
            try {
                const qb = this.listingRepository.createQueryBuilder('listing')
                    .leftJoinAndSelect('listing.vendor', 'vendor')
                    .where('listing.status = :status', { status: 'approved' })
                    .andWhere(new Brackets(q => {
                        const kw = displayKeyword.toLowerCase();
                        q.where('LOWER(listing.title) LIKE :kw', { kw: `%${kw}%` })
                    .orWhere('LOWER(listing.searchKeywords::text) LIKE :kw', { kw: `%${kw}%` });
                    }));

                const relevantListings = await qb.getMany();
                const vendorIds = [...new Set(relevantListings.map(l => l.vendor?.id).filter(id => !!id))];

                for (const vendorId of vendorIds) {
                    const vendor = await this.vendorRepository.findOne({ where: { id: vendorId } });
                    if (!vendor) continue;

                    const nLog = this.notificationLogRepository.create({
                        vendorId,
                        searchLogId: savedLog.id,
                        keyword: data.keyword,
                        sentAt: new Date(),
                    });
                    await this.notificationLogRepository.save(nLog);

                    this.notificationsGateway.sendToUser(vendor.userId, 'demand_alert', {
                        title: 'New Search in Your Category',
                        message: `Someone just searched for "${data.keyword}" in ${data.city || 'your area'}.`,
                        keyword: data.keyword,
                        city: data.city
                    });
                }
            } catch (err) {
                this.logger.error('Background demand notification error:', err.stack);
            }
        });

        return savedLog;
    }

    async getInsights(city?: string): Promise<DemandInsight[]> {
        const now = new Date();
        const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
        const sixHoursAgo = new Date(now.getTime() - 6 * 60 * 60 * 1000);
        const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const prevWindowStart = new Date(now.getTime() - 2 * 60 * 60 * 1000);
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

        const query = this.searchLogRepository.createQueryBuilder('log')
            .select('LOWER(log.normalizedKeyword)', 'normalizedKeyword')
            .addSelect('MAX(log.keyword)', 'keyword')
            .addSelect('MAX(log.city)', 'topCity')
            .addSelect('COUNT(log.id)', 'count7d')
            .addSelect('COUNT(CASE WHEN log.searched_at >= :oneHour THEN 1 END)', 'count1h')
            .addSelect('COUNT(CASE WHEN log.searched_at >= :sixHours THEN 1 END)', 'count6h')
            .addSelect('COUNT(CASE WHEN log.searched_at >= :twentyFourHours THEN 1 END)', 'count24h')
            .addSelect('COUNT(CASE WHEN log.searched_at >= :prevStart AND log.searched_at < :oneHour THEN 1 END)', 'countPrevHour')
            .setParameters({
                oneHour: oneHourAgo,
                sixHours: sixHoursAgo,
                twentyFourHours: twentyFourHoursAgo,
                prevStart: prevWindowStart
            });

        if (city && city.trim()) {
            query.andWhere('LOWER(log.city) = LOWER(:city)', { city: city.trim() });
        }

        const stats = await query
            .groupBy('LOWER(log.normalizedKeyword)')
            .having('COUNT(CASE WHEN log.searched_at >= :sevenDays THEN 1 END) > 0', { sevenDays: sevenDaysAgo })
            .getRawMany();

        if (stats.length === 0) {
            return [
                { keyword: 'Web Development', normalizedKeyword: 'web development', score: 95, count1h: 5, count6h: 12, count24h: 30, count7d: 150, topCity: 'Global', isTrending: true, growth: 25, type: 'keyword' },
                { keyword: 'Plumbing Services', normalizedKeyword: 'plumbing services', score: 85, count1h: 3, count6h: 8, count24h: 22, count7d: 120, topCity: 'Global', isTrending: true, growth: 15, type: 'keyword' },
                { keyword: 'Digital Marketing', normalizedKeyword: 'digital marketing', score: 75, count1h: 2, count6h: 5, count24h: 18, count7d: 90, topCity: 'Global', isTrending: false, growth: 5, type: 'keyword' },
                { keyword: 'Electrician', normalizedKeyword: 'electrician', score: 65, count1h: 1, count6h: 4, count24h: 12, count7d: 60, topCity: 'Global', isTrending: false, growth: -2, type: 'keyword' }
            ] as DemandInsight[];
        }

        return stats.map(res => {
            const c7d = parseInt(res.count7d) || 0;
            const c1h = parseInt(res.count1h) || 0;
            const c6h = parseInt(res.count6h) || 0;
            const c24h = parseInt(res.count24h) || 0;
            const cPrev = parseInt(res.countPrevHour) || 0;

            const recentScore = (c1h * 10) + (c6h * 5) + (c24h * 2);
            const score = recentScore > 0 ? recentScore : (c7d * 0.5);
            const growth = cPrev === 0 ? (c1h > 0 ? 100 : 0) : Math.round(((c1h - cPrev) / cPrev) * 100);

            return {
                keyword: res.keyword || res.normalizedKeyword,
                normalizedKeyword: res.normalizedKeyword,
                score,
                count1h: c1h,
                count6h: c6h,
                count24h: c24h,
                count7d: c7d,
                topCity: res.topCity || 'N/A',
                isTrending: growth >= 20 && c1h >= 1,
                growth,
                type: res.normalizedKeyword.startsWith('category:') ? 'category' : 'keyword'
            } as DemandInsight;
        }).sort((a, b) => b.score - a.score).slice(0, 50);
    }

    async getOverview(city?: string) {
        const insights = await this.getInsights(city);
        const cities = await this.getTopCities();
        const trends = await this.getSearchTrends(city);
        const aiSummary = await this.getAIInsightsSummary(city);

        const totalListingsQuery = this.listingRepository.createQueryBuilder('listing')
            .where('listing.status = :status', { status: 'approved' });

        const searches7dQuery = this.searchLogRepository.createQueryBuilder('log')
            .where('log.searched_at >= NOW() - INTERVAL \'7 days\'');

        if (city && city.trim()) {
            totalListingsQuery.andWhere('LOWER(listing.city) = LOWER(:city)', { city: city.trim() });
            searches7dQuery.andWhere('LOWER(log.city) = LOWER(:city)', { city: city.trim() });
        }

        const totalListings = await totalListingsQuery.getCount();
        const totalVendors = await this.vendorRepository.count();
        const totalUsers = await this.userRepository.count();
        const totalSearches7d = await searches7dQuery.getCount();

        return {
            insights,
            topCities: cities,
            trends,
            aiSummary,
            totalSearches7d,
            stats: {
                totalListings,
                totalVendors,
                totalUsers
            }
        };
    }

    async getTopCities() {
        return this.searchLogRepository.createQueryBuilder('log')
            .select('log.city', 'city')
            .addSelect('COUNT(*)', 'count')
            .where('log.city IS NOT NULL AND log.city != :empty', { empty: '' })
            .groupBy('log.city')
            .orderBy('count', 'DESC')
            .limit(50)
            .getRawMany();
    }

    async getAIInsightsSummary(city?: string): Promise<any> {
        const insights = await this.getInsights(city);
        
        if (insights.length === 0) {
            return {
                top_categories: [],
                hot_demand: [],
                insights: ["Insufficient data for analysis"],
                recommendations: ["Collect more user activity data"],
                confidence: 0
            };
        }

        if (!this.genAI) {
            return {
                top_categories: [],
                hot_demand: [],
                insights: ["AI Analysis unavailable (Missing API Key). Manual review recommended."],
                recommendations: ["Configure GEMINI_API_KEY to enable predictive intelligence."],
                confidence: 0
            };
        }

        try {
            const model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
            const prompt = `
You are an AI Demand Intelligence Engine for a hyperlocal business discovery platform.

Your role is to analyze structured analytics data and generate accurate, data-driven demand insights for a super admin dashboard.

INPUT DATA:
You will receive structured JSON data including:

* top_categories (with search counts)
* previous_period_data (for comparison)
* city (optional filter)
* time_range (e.g., last 24h, 7d)

YOUR TASKS:

1. Identify top performing categories based on search volume.
2. Calculate demand growth using current vs previous period:
   growth % = ((current - previous) / previous) * 100
3. Assign status:

   * "Momentum High" if growth > 30%
   * "Stable" if growth between 0% and 30%
   * "Declining" if growth < 0%
4. Generate "hot demand" categories (highest growth).
5. Generate short, factual insights based ONLY on input data.
6. Generate actionable recommendations for admin.

STRICT OUTPUT FORMAT (RETURN ONLY VALID JSON):

{
  "top_categories": [
    {
      "category": "string",
      "trend_index": 0,
      "growth": "+0%",
      "status": "Momentum High | Stable | Declining"
    }
  ],
  "hot_demand": [
    {
      "category": "string",
      "growth": "+0%",
      "insight": "string"
    }
  ],
  "insights": [
    "string"
  ],
  "recommendations": [
    "string"
  ],
  "confidence": 0.0
}

STRICT RULES:

* Do NOT return anything outside JSON
* Do NOT include markdown or explanations
* If data is missing, return empty arrays instead of invalid structure
* All numbers must be numeric except growth which must be a string with %
* Do NOT hallucinate or assume data not provided
* Keep insights short, factual, and specific to city/time_range if provided
* confidence must be between 0 and 1 based on data reliability

FAILSAFE:
If input data is insufficient, return:

{
  "top_categories": [],
  "hot_demand": [],
  "insights": ["Insufficient data for analysis"],
  "recommendations": ["Collect more user activity data"],
  "confidence": 0
}

Data to analyze for ${city || 'the whole system'}:
${JSON.stringify(insights.slice(0, 10))}
            `;

            const result = await model.generateContent(prompt);
            const text = result.response.text();
            
            try {
                const jsonMatch = text.match(/```(?:json)?\n([\s\S]*?)\n```/) || text.match(/{[\s\S]*}/);
                if (jsonMatch) {
                    return JSON.parse(jsonMatch[1] || jsonMatch[0]);
                }
                return JSON.parse(text);
            } catch (e) {
                return {
                    top_categories: [],
                    hot_demand: [],
                    insights: [text],
                    recommendations: ["Raw textual response generated."],
                    confidence: 0.5
                };
            }
        } catch (error) {
            return {
                top_categories: [],
                hot_demand: [],
                insights: ["Strategic analysis temporarily offline. Search volume remains stable."],
                recommendations: ["Monitor system health logs."],
                confidence: 0
            };
        }
    }

    async getSearchTrends(city?: string) {
        const now = new Date();
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

        const query = this.searchLogRepository.createQueryBuilder('log')
            .select("TO_CHAR(log.searched_at, 'YYYY-MM-DD')", 'date')
            .addSelect('COUNT(*)', 'count')
            .where('log.searched_at >= :startDate', { startDate: sevenDaysAgo });

        if (city && city.trim()) {
            query.andWhere('LOWER(log.city) = LOWER(:city)', { city: city.trim() });
        }

        return query
            .groupBy("TO_CHAR(log.searched_at, 'YYYY-MM-DD')")
            .orderBy('date', 'ASC')
            .getRawMany();
    }

    async getNearbyDemand(lat: number, lng: number) {
        if (!lat || !lng) {
            return this.getInsights();
        }

        try {
            const now = new Date();
            const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
            const sixHoursAgo = new Date(now.getTime() - 6 * 60 * 60 * 1000);
            const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
            const prevWindowStart = new Date(now.getTime() - 2 * 60 * 60 * 1000);
            const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

            const latDelta = 50 / 111; 
            const lngDelta = 50 / (111 * Math.cos(lat * (Math.PI / 180)));
            
            const query = this.searchLogRepository.createQueryBuilder('log')
                .select('LOWER(log.normalizedKeyword)', 'normalizedKeyword')
                .addSelect('MAX(log.keyword)', 'keyword')
                .addSelect('MAX(log.city)', 'topCity')
                .addSelect('COUNT(log.id)', 'count7d')
                .addSelect('COUNT(CASE WHEN log.searched_at >= :oneHour THEN 1 END)', 'count1h')
                .addSelect('COUNT(CASE WHEN log.searched_at >= :sixHours THEN 1 END)', 'count6h')
                .addSelect('COUNT(CASE WHEN log.searched_at >= :twentyFourHours THEN 1 END)', 'count24h')
                .addSelect('COUNT(CASE WHEN log.searched_at >= :prevStart AND log.searched_at < :oneHour THEN 1 END)', 'countPrevHour')
                .setParameters({
                    oneHour: oneHourAgo,
                    sixHours: sixHoursAgo,
                    twentyFourHours: twentyFourHoursAgo,
                    prevStart: prevWindowStart
                })
                .where('log.latitude BETWEEN :minLat AND :maxLat', { minLat: lat - latDelta, maxLat: lat + latDelta })
                .andWhere('log.longitude BETWEEN :minLng AND :maxLng', { minLng: lng - lngDelta, maxLng: lng + lngDelta });

            const stats = await query
                .groupBy('LOWER(log.normalizedKeyword)')
                .having('COUNT(CASE WHEN log.searched_at >= :sevenDays THEN 1 END) > 0', { sevenDays: sevenDaysAgo })
                .getRawMany();

            if (!stats || stats.length === 0) {
                // Fallback: try city-based matching by finding the nearest city from recent logs
                const nearestCity = await this.searchLogRepository.createQueryBuilder('log')
                    .select('log.city', 'city')
                    .where('log.city IS NOT NULL')
                    .andWhere('log.latitude IS NOT NULL')
                    .orderBy(`ABS(log.latitude - :lat) + ABS(log.longitude - :lng)`, 'ASC')
                    .setParameters({ lat, lng })
                    .getRawOne();

                if (nearestCity?.city) {
                    this.logger.log(`[Demand] No nearby lat/lng data, falling back to city: ${nearestCity.city}`);
                    return this.getInsights(nearestCity.city);
                }

                return this.getInsights();
            }

            return stats.map(res => {
                const c7d = parseInt(res.count7d) || 0;
                const c1h = parseInt(res.count1h) || 0;
                const c6h = parseInt(res.count6h) || 0;
                const c24h = parseInt(res.count24h) || 0;
                const cPrev = parseInt(res.countPrevHour) || 0;

                const recentScore = (c1h * 10) + (c6h * 5) + (c24h * 2);
                const score = recentScore > 0 ? recentScore : (c7d * 0.5);
                const growth = cPrev === 0 ? (c1h > 0 ? 100 : 0) : Math.round(((c1h - cPrev) / cPrev) * 100);

                return {
                    keyword: res.keyword || res.normalizedKeyword,
                    normalizedKeyword: res.normalizedKeyword,
                    score,
                    count1h: c1h,
                    count6h: c6h,
                    count24h: c24h,
                    count7d: c7d,
                    topCity: res.topCity || 'Nearby',
                    isTrending: growth >= 20 && c1h >= 1,
                    growth,
                    type: res.normalizedKeyword.startsWith('category:') ? 'category' : 'keyword'
                } as DemandInsight;

            }).sort((a, b) => b.score - a.score).slice(0, 50);
        } catch (error) {
            this.logger.error('getNearbyDemand failed, falling back to insights:', error.message);
            return this.getInsights();
        }
    }

    async getHeatmap(keyword?: string, startDate?: string, endDate?: string) {
        const query = this.searchLogRepository.createQueryBuilder('log')
            .select('log.latitude', 'latitude')
            .addSelect('log.longitude', 'longitude')
            .addSelect('log.keyword', 'keyword')
            .addSelect('log.category_slug', 'categorySlug')
            .addSelect('COUNT(*)', 'weight')
            .where('log.latitude IS NOT NULL')
            .groupBy('log.latitude, log.longitude, log.keyword, log.category_slug');

        if (startDate) {
            query.andWhere('log.searched_at >= :startDate', { startDate: new Date(startDate) });
        } else {
            query.andWhere('log.searched_at >= NOW() - INTERVAL \'90 days\'');
        }

        if (endDate) {
            const end = new Date(endDate);
            end.setUTCHours(23, 59, 59, 999);
            query.andWhere('log.searched_at <= :endDate', { endDate: end });
        }

        if (keyword) {
            query.andWhere('LOWER(log.keyword) LIKE :kw', { kw: `%${keyword.toLowerCase()}%` });
        }

        return query.getRawMany();
    }
    async processDemandAlerts() {
        this.logger.log('Processing demand alerts tasks...');
    }
}
