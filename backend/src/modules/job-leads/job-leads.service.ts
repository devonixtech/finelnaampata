import {
    Injectable,
    NotFoundException,
    ForbiddenException,
    BadRequestException,
    Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { JobLead, JobLeadStatus } from '../../entities/job-lead.entity';
import { JobLeadResponse, JobResponseStatus } from '../../entities/job-lead-response.entity';
import { Listing, BusinessStatus } from '../../entities/business.entity';
import { Vendor } from '../../entities/vendor.entity';
import { Category } from '../../entities/category.entity';
import { SystemSetting } from '../../entities/system-setting.entity';
import { CreateJobLeadDto } from './dto/create-job-lead.dto';
import { CreateJobResponseDto } from './dto/create-job-response.dto';
import { NotificationsGateway } from '../notifications/notifications.gateway';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { NotificationsService, NotificationType } from '../notifications/notifications.service';
import { MailService } from '../auth/mail.service';
import { User } from '../../entities/user.entity';
import { ConfigService } from '@nestjs/config';


@Injectable()
export class JobLeadsService {
    private readonly logger = new Logger(JobLeadsService.name);
    constructor(
        @InjectRepository(JobLead)
        private jobLeadRepository: Repository<JobLead>,
        @InjectRepository(JobLeadResponse)
        private responseRepository: Repository<JobLeadResponse>,
        @InjectRepository(Listing)
        private listingRepository: Repository<Listing>,
        @InjectRepository(Vendor)
        private vendorRepository: Repository<Vendor>,
        @InjectRepository(Category)
        private categoryRepository: Repository<Category>,
        @InjectRepository(User)
        private userRepository: Repository<User>,
        private mailService: MailService,
        private configService: ConfigService,
        @InjectRepository(SystemSetting)
        private settingsRepository: Repository<SystemSetting>,
        private notificationsGateway: NotificationsGateway,
        private subscriptionsService: SubscriptionsService,
        private notificationsService: NotificationsService,
    ) { }

    async createLead(userId: string, dto: CreateJobLeadDto): Promise<JobLead> {
        const category = await this.categoryRepository.findOne({ where: { id: dto.categoryId } });
        if (!category) throw new NotFoundException('Category not found');

        // Check auto_approve_broadcasts setting (defaults to TRUE so leads always broadcast)
        const autoApproveSetting = await this.settingsRepository.findOne({ where: { key: 'auto_approve_broadcasts' } });
        const autoApprove = autoApproveSetting ? autoApproveSetting.value === 'true' : true;

        const lead = this.jobLeadRepository.create({
            ...dto,
            userId,
            status: autoApprove ? JobLeadStatus.OPEN : JobLeadStatus.PENDING,
        });

        const savedLead = await this.jobLeadRepository.save(lead);

        // Broadcast if auto-approve is ON
        if (autoApprove) {
            try {
                await this.broadcastLead(savedLead);
                savedLead.status = JobLeadStatus.BROADCASTED;
                await this.jobLeadRepository.save(savedLead);
            } catch (err) {
                this.logger.error(`Broadcast failed for lead ${savedLead.id}:`, err);
            }
        }

        return savedLead;
    }

    private async broadcastLead(lead: JobLead) {
        // Resolve the lead's category plus its subcategories (children) so we match
        // businesses filed under the parent category OR any of its subcategories.
        const leadCategory = await this.categoryRepository.findOne({ where: { id: lead.categoryId } });
        const childCategories = leadCategory
            ? await this.categoryRepository.find({ where: { parentId: leadCategory.id } })
            : [];
        const categoryIds = [
            lead.categoryId,
            ...childCategories.map(c => c.id),
        ];
        this.logger.log(`Broadcasting lead ${lead.id} for categories: ${categoryIds.join(', ')}`);

        const query = this.listingRepository
            .createQueryBuilder('listing')
            .innerJoinAndSelect('listing.vendor', 'vendor')
            .leftJoinAndSelect('listing.subcategories', 'listingSub')
            .where('listing.status = :status', { status: BusinessStatus.APPROVED })
            .andWhere(
                '(listing.categoryId IN (:...categoryIds) OR listingSub.id IN (:...categoryIds))',
                { categoryIds }
            );

        if (lead.latitude != null && lead.longitude != null) {
            this.logger.log(`Broadcasting lead ${lead.id} using geo-proximity: ${lead.latitude}, ${lead.longitude}`);
            const listings = await query.getMany();

            const radius = 20;
            const matchedListings = listings.filter(l => {
                // Match by city name first (covers businesses without coordinates)
                if (lead.city && l.city && l.city.toLowerCase().includes(lead.city.toLowerCase())) {
                    return true;
                }
                if (l.latitude == null || l.longitude == null) return false;
                const dist = this.calculateDistance(
                    Number(lead.latitude),
                    Number(lead.longitude),
                    Number(l.latitude),
                    Number(l.longitude)
                );
                return dist <= radius;
            });

            const vendorUserIds = [...new Set(matchedListings.map(l => l.vendor.userId).filter(id => id != null))]
                .filter(id => id !== lead.userId);
            await this.notifyVendors(lead, vendorUserIds);
        } else {
            if (lead.city) {
                query.andWhere('listing.city ILIKE :city', { city: `%${lead.city}%` });
            }
            const listings = await query.getMany();
            const vendorUserIds = [...new Set(listings.map(l => l.vendor.userId).filter(id => id != null))]
                .filter(id => id !== lead.userId);
            await this.notifyVendors(lead, vendorUserIds);
        }
    }

    private async notifyVendors(lead: JobLead, vendorUserIds: string[]) {
        this.logger.log(`Notifying up to ${vendorUserIds.length} vendors for lead ${lead.id}`);
        
        let notifiedCount = 0;
        for (const vendorUserId of vendorUserIds) {
            // All vendors matching category+city receive the notification. Viewing the
            // broadcast feed is free; responding requires a paid plan (checked at submit).
            this.notificationsGateway.sendToUser(vendorUserId, 'new_job_lead', {
                leadId: lead.id,
                title: lead.title,
                category: lead.categoryId,
                city: lead.city,
                createdAt: lead.createdAt,
            });
            notifiedCount++;
        }

        if (notifiedCount > 0) {
            lead.status = JobLeadStatus.BROADCASTED;
            await this.jobLeadRepository.save(lead);
        }
    }

    private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
        const R = 6371; // Radius of the earth in km
        const dLat = this.deg2rad(lat2 - lat1);
        const dLon = this.deg2rad(lon2 - lon1);
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const d = R * c; // Distance in km
        return d;
    }

    private deg2rad(deg: number): number {
        return deg * (Math.PI / 180);
    }

    async getLeadsForVendor(userId: string): Promise<JobLead[]> {
        this.logger.log(`Fetching leads for vendor user ID: ${userId}`);
        try {
            const vendor = await this.vendorRepository.findOne({ 
                where: { userId }, 
                relations: ['businesses', 'businesses.subcategories'] 
            });
            
            if (!vendor) {
                this.logger.warn(`User ${userId} is not a vendor`);
                throw new ForbiddenException('Not a vendor');
            }

            if (!vendor.businesses || vendor.businesses.length === 0) {
                this.logger.log(`Vendor ${vendor.id} has no businesses`);
                return [];
            }

            // Build the full category tree for the vendor: business.categoryId plus
            // every subcategory assigned to each business.
            const categoryIds = new Set<string>();
            for (const b of vendor.businesses) {
                if (b.categoryId) categoryIds.add(b.categoryId);
                (b.subcategories || []).forEach((sc: any) => {
                    if (sc?.id) categoryIds.add(sc.id);
                });
            }
            const categoryIdList = [...categoryIds].filter(id => !!id);

            const cities = vendor.businesses
                .map(b => b.city)
                .filter(c => !!c);

            this.logger.log(`Vendor ${vendor.id} has categories: ${categoryIdList.join(', ')} and cities: ${cities.join(', ')}`);

            if (categoryIdList.length === 0) {
                this.logger.warn(`Vendor ${vendor.id} has businesses but no categories assigned`);
                return [];
            }

            const query = this.jobLeadRepository
                .createQueryBuilder('lead')
                .leftJoinAndSelect('lead.category', 'category')
                .leftJoinAndSelect('lead.user', 'user')
                .leftJoinAndSelect('lead.responses', 'responses', 'responses.vendorId = :vendorId', { vendorId: vendor.id })
                .where('lead.categoryId IN (:...categoryIds)', { categoryIds: categoryIdList })
                .andWhere('lead.userId != :userId', { userId })
                .andWhere('lead.status IN (:...statuses)', { 
                    statuses: [JobLeadStatus.OPEN, JobLeadStatus.BROADCASTED, JobLeadStatus.RESPONDED] 
                });

            if (cities.length > 0) {
                // Flexible city matching: lead city matches ANY of the vendor's cities
                // by partial match (ILIKE) or is unspecified.
                const cityClauses = cities.map((_, i) => `LOWER(lead.city) LIKE LOWER(:city${i})`);
                const cityParams: Record<string, string> = {};
                cities.forEach((c, i) => { cityParams[`city${i}`] = `%${c.toLowerCase()}%`; });
                query.andWhere(`(lead.city IS NULL OR ${cityClauses.join(' OR ')})`, cityParams);
            }

            const leads = await query.orderBy('lead.createdAt', 'DESC').getMany();
            
            // Map to include hasResponded virtual flag and the vendor's response
            const leadsWithFlag = leads.map(lead => {
                const myResponse = lead.responses && lead.responses.length > 0 ? lead.responses[0] : null;
                // Delete responses to keep payload light
                delete lead.responses;
                return {
                    ...lead,
                    hasResponded: !!myResponse,
                    myResponse
                };
            });

            this.logger.log(`Found ${leads.length} relevant leads for vendor ${vendor.id}`);
            return leadsWithFlag as any;
        } catch (error) {
            this.logger.error(`Error in getLeadsForVendor for user ${userId}: ${error.message}`, error.stack);
            throw error;
        }
    }

    async submitResponse(vendorUserId: string, leadId: string, dto: CreateJobResponseDto): Promise<JobLeadResponse> {
        this.logger.log(`Vendor ${vendorUserId} responding to lead ${leadId} with price ${dto.price}`);
        const vendor = await this.vendorRepository.findOne({ where: { userId: vendorUserId } });
        if (!vendor) {
            this.logger.warn(`User ${vendorUserId} is not a vendor`);
            throw new ForbiddenException('Not a vendor');
        }

        const canRespond = await this.subscriptionsService.canPerformAction(vendorUserId, 'canRespondBroadcast');
        if (!canRespond) {
            throw new ForbiddenException('Responding to broadcast leads requires a paid plan. Upgrade to send proposals.');
        }

        const lead = await this.jobLeadRepository.findOne({ where: { id: leadId }, relations: ['user'] });
        if (!lead) throw new NotFoundException('Lead not found');

        if (lead.status === JobLeadStatus.CLOSED) {
            throw new BadRequestException('This lead is closed and no longer accepting responses');
        }

        if (lead.userId === vendorUserId) {
            throw new BadRequestException('You cannot respond to your own lead');
        }

        // Check if already responded - If so, update it
        const existing = await this.responseRepository.findOne({ where: { jobLeadId: leadId, vendorId: vendor.id } });
        if (existing) {
            this.logger.log(`Vendor ${vendor.id} updating response to lead ${leadId}`);
            existing.message = dto.message;
            existing.price = dto.price;
            existing.status = JobResponseStatus.PENDING;
            const updatedResponse = await this.responseRepository.save(existing);

            // Notify user about the update
            this.notificationsGateway.sendToUser(lead.userId, 'lead_response_updated', {
                leadId: lead.id,
                responseId: updatedResponse.id,
                vendorName: vendor.businessName,
                price: updatedResponse.price,
            });
            await this.notificationsService.create({
                userId: lead.userId,
                title: 'Proposal Updated',
                message: `${vendor.businessName} updated their proposal for your broadcast request.`,
                type: NotificationType.BROADCAST_RESPONSE,
                link: '/saved',
                data: { leadId: lead.id, responseId: updatedResponse.id }
            });

            return updatedResponse;
        }

        const response = this.responseRepository.create({
            jobLeadId: leadId,
            vendorId: vendor.id,
            message: dto.message,
            price: dto.price,
            status: JobResponseStatus.PENDING,
        });

        const savedResponse = await this.responseRepository.save(response);

        // Update lead status
        if (lead.status !== JobLeadStatus.RESPONDED) {
            lead.status = JobLeadStatus.RESPONDED;
            await this.jobLeadRepository.save(lead);
        }

        // Notify user
        this.notificationsGateway.sendToUser(lead.userId, 'new_lead_response', {
            leadId: lead.id,
            responseId: savedResponse.id,
            vendorName: vendor.businessName,
            price: savedResponse.price,
        });
        await this.notificationsService.create({
            userId: lead.userId,
            title: 'New Proposal Received',
            message: `${vendor.businessName} sent a new proposal for your broadcast request.`,
            type: NotificationType.BROADCAST_RESPONSE,
            link: '/saved',
            data: { leadId: lead.id, responseId: savedResponse.id }
        });

        return savedResponse;
    }

    async getResponsesForLead(userId: string, leadId: string): Promise<JobLeadResponse[]> {
        const lead = await this.jobLeadRepository.findOne({ where: { id: leadId, userId } });
        if (!lead) throw new NotFoundException('Lead not found or unauthorized');

        return this.responseRepository.find({
            where: { jobLeadId: leadId },
            relations: ['vendor', 'vendor.user'],
            order: { createdAt: 'DESC' },
        });
    }

    async getMyLeads(userId: string): Promise<JobLead[]> {
        return this.jobLeadRepository.find({
            where: { userId },
            relations: ['category', 'user', 'responses', 'responses.vendor', 'responses.vendor.user'],
            order: { createdAt: 'DESC' },
        });
    }

    async getVendorInboxStats(userId: string): Promise<{ newCount: number }> {
        const vendor = await this.vendorRepository.findOne({ 
            where: { userId }, 
            relations: ['businesses', 'businesses.subcategories'] 
        });
        
        if (!vendor || !vendor.businesses?.length) return { newCount: 0 };

        const categoryIds = new Set<string>();
        for (const b of vendor.businesses) {
            if (b.categoryId) categoryIds.add(b.categoryId);
            (b.subcategories || []).forEach((sc: any) => {
                if (sc?.id) categoryIds.add(sc.id);
            });
        }
        const categoryIdList = [...categoryIds].filter(id => !!id);
        const cities = vendor.businesses.map(b => b.city).filter(c => !!c);

        if (categoryIdList.length === 0) return { newCount: 0 };

        const query = this.jobLeadRepository
            .createQueryBuilder('lead')
            .where('lead.categoryId IN (:...categoryIds)', { categoryIds: categoryIdList })
            .andWhere('lead.userId != :userId', { userId })
            .andWhere('lead.status IN (:...statuses)', { 
                statuses: [JobLeadStatus.OPEN, JobLeadStatus.BROADCASTED, JobLeadStatus.RESPONDED] 
            });

        if (cities.length > 0) {
            const cityClauses = cities.map((_, i) => `LOWER(lead.city) LIKE LOWER(:city${i})`);
            const cityParams: Record<string, string> = {};
            cities.forEach((c, i) => { cityParams[`city${i}`] = `%${c.toLowerCase()}%`; });
            query.andWhere(`(lead.city IS NULL OR ${cityClauses.join(' OR ')})`, cityParams);
        }

        // Optimized check: "New" means NOT responded yet
        query.andWhere(qb => {
            const subQuery = qb.subQuery()
                .select('1')
                .from(JobLeadResponse, 'response')
                .where('response.jobLeadId = lead.id')
                .andWhere('response.vendorId = :vendorId', { vendorId: vendor.id })
                .getQuery();
            return 'NOT EXISTS ' + subQuery;
        });

        const newCount = await query.getCount();
        return { newCount };
    }

    async approveLead(leadId: string): Promise<JobLead> {
        const lead = await this.jobLeadRepository.findOne({ where: { id: leadId } });
        if (!lead) throw new NotFoundException('Lead not found');
        if (lead.status !== JobLeadStatus.PENDING) {
            throw new BadRequestException('Only pending leads can be approved');
        }

        lead.status = JobLeadStatus.OPEN;
        const saved = await this.jobLeadRepository.save(lead);

        // Now broadcast to relevant vendors
        try {
            await this.broadcastLead(saved);
        } catch (err) {
            this.logger.error(`Broadcast failed for lead ${saved.id}:`, err);
        }

        return saved;
    }

    async getPendingLeads(): Promise<JobLead[]> {
        return this.jobLeadRepository.find({
            where: { status: JobLeadStatus.PENDING },
            relations: ['category', 'user'],
            order: { createdAt: 'ASC' },
        });
    }

    async getBroadcastAnalytics(): Promise<any> {
        const totalBroadcasts = await this.jobLeadRepository.count();

        const statusCounts = await this.jobLeadRepository
            .createQueryBuilder('lead')
            .select('lead.status', 'status')
            .addSelect('COUNT(*)', 'count')
            .groupBy('lead.status')
            .getRawMany();

        const totalResponses = await this.responseRepository.count();

        const uniqueVendorsResponded = await this.responseRepository
            .createQueryBuilder('resp')
            .select('COUNT(DISTINCT resp.vendorId)', 'count')
            .getRawOne();

        // Average response time (lead created → first response)
        const avgResponseTime = await this.responseRepository
            .createQueryBuilder('resp')
            .innerJoin('resp.jobLead', 'lead')
            .select('AVG(EXTRACT(EPOCH FROM (resp.createdAt - lead.createdAt)))', 'avgSeconds')
            .getRawOne();

        // Category-wise breakdown
        const categoryBreakdown = await this.jobLeadRepository
            .createQueryBuilder('lead')
            .leftJoin('lead.category', 'category')
            .select('category.name', 'categoryName')
            .addSelect('COUNT(*)', 'total')
            .addSelect("COUNT(CASE WHEN lead.status = 'responded' THEN 1 END)", 'responded')
            .groupBy('category.name')
            .orderBy('total', 'DESC')
            .limit(10)
            .getRawMany();

        // City-wise breakdown (top 10)
        const cityBreakdown = await this.jobLeadRepository
            .createQueryBuilder('lead')
            .select('lead.city', 'city')
            .addSelect('COUNT(*)', 'total')
            .where('lead.city IS NOT NULL')
            .groupBy('lead.city')
            .orderBy('total', 'DESC')
            .limit(10)
            .getRawMany();

        // Last 7 days trend
        const weeklyTrend = await this.jobLeadRepository
            .createQueryBuilder('lead')
            .select("DATE(lead.createdAt)", 'date')
            .addSelect('COUNT(*)', 'total')
            .where("lead.createdAt >= NOW() - INTERVAL '7 days'")
            .groupBy("DATE(lead.createdAt)")
            .orderBy('date', 'ASC')
            .getRawMany();

        const statusMap: Record<string, number> = {};
        statusCounts.forEach((s: any) => { statusMap[s.status] = parseInt(s.count); });

        const responseRate = totalBroadcasts > 0
            ? Math.round(((uniqueVendorsResponded?.count || 0) / totalBroadcasts) * 100)
            : 0;

        return {
            totalBroadcasts,
            totalPending: statusMap['pending'] || 0,
            totalOpen: statusMap['open'] || 0,
            totalBroadcasted: statusMap['broadcasted'] || 0,
            totalResponded: statusMap['responded'] || 0,
            totalClosed: statusMap['closed'] || 0,
            totalResponses,
            uniqueVendorsResponded: parseInt(uniqueVendorsResponded?.count || '0'),
            avgResponseTimeSeconds: avgResponseTime?.avgSeconds ? Math.round(parseFloat(avgResponseTime.avgSeconds)) : null,
            responseRate,
            categoryBreakdown,
            cityBreakdown,
            weeklyTrend,
        };
    }
}
