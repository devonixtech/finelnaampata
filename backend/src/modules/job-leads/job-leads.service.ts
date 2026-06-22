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
import { CreateJobLeadDto } from './dto/create-job-lead.dto';
import { CreateJobResponseDto } from './dto/create-job-response.dto';
import { NotificationsGateway } from '../notifications/notifications.gateway';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';

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
        private notificationsGateway: NotificationsGateway,
        private subscriptionsService: SubscriptionsService,
    ) { }

    async createLead(userId: string, dto: CreateJobLeadDto): Promise<JobLead> {
        const category = await this.categoryRepository.findOne({ where: { id: dto.categoryId } });
        if (!category) throw new NotFoundException('Category not found');

        const lead = this.jobLeadRepository.create({
            ...dto,
            userId,
            status: JobLeadStatus.OPEN,
        });

        const savedLead = await this.jobLeadRepository.save(lead);

        // Broadcast to relevant vendors
        this.broadcastLead(savedLead);

        return savedLead;
    }

    private async broadcastLead(lead: JobLead) {
        // Find vendors who have a business in this category
        const query = this.listingRepository
            .createQueryBuilder('listing')
            .innerJoinAndSelect('listing.vendor', 'vendor')
            .where('listing.categoryId = :categoryId', { categoryId: lead.categoryId })
            .andWhere('listing.status = :status', { status: 'approved' });

        // If lead has coordinates, we can do proximity matching
        // Otherwise fallback to city matching
        if (lead.latitude && lead.longitude) {
            this.logger.log(`Broadcasting lead ${lead.id} using geo-proximity: ${lead.latitude}, ${lead.longitude}`);
            // Use Haversine formula in SQL if possible, or filter in memory if listings are few
            // For now, let's filter in memory for better cross-DB compatibility unless there are thousands of vendors
            const listings = await query.getMany();
            
            const radius = 20; // 20km radius for "nearest"
            const matchedListings = listings.filter(l => {
                if (!l.latitude || !l.longitude) return false;
                const dist = this.calculateDistance(
                    Number(lead.latitude), 
                    Number(lead.longitude), 
                    Number(l.latitude), 
                    Number(l.longitude)
                );
                return dist <= radius;
            });

            const vendorUserIds = [...new Set(matchedListings.map(l => l.vendor.userId))].filter(id => id !== lead.userId);
            await this.notifyVendors(lead, vendorUserIds);
        } else {
            if (lead.city) {
                query.andWhere('listing.city ILIKE :city', { city: `%${lead.city}%` });
            }
            const listings = await query.getMany();
            const vendorUserIds = [...new Set(listings.map(l => l.vendor.userId))].filter(id => id !== lead.userId);
            await this.notifyVendors(lead, vendorUserIds);
        }
    }

    private async notifyVendors(lead: JobLead, vendorUserIds: string[]) {
        this.logger.log(`Notifying ${vendorUserIds.length} vendors for lead ${lead.id}`);
        for (const vendorUserId of vendorUserIds) {
            this.notificationsGateway.sendToUser(vendorUserId, 'new_job_lead', {
                leadId: lead.id,
                title: lead.title,
                category: lead.categoryId,
                city: lead.city,
                createdAt: lead.createdAt,
            });
        }

        if (vendorUserIds.length > 0) {
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
                relations: ['businesses'] 
            });
            
            if (!vendor) {
                this.logger.warn(`User ${userId} is not a vendor`);
                throw new ForbiddenException('Not a vendor');
            }

            if (!vendor.businesses || vendor.businesses.length === 0) {
                this.logger.log(`Vendor ${vendor.id} has no businesses`);
                return [];
            }

            const categoryIds = vendor.businesses
                .map(b => b.categoryId)
                .filter(id => !!id);
            
            const cities = vendor.businesses
                .map(b => b.city)
                .filter(c => !!c);

            this.logger.log(`Vendor ${vendor.id} has categories: ${categoryIds.join(', ')} and cities: ${cities.join(', ')}`);

            if (categoryIds.length === 0) {
                this.logger.warn(`Vendor ${vendor.id} has businesses but no categories assigned`);
                return [];
            }

            const query = this.jobLeadRepository
                .createQueryBuilder('lead')
                .leftJoinAndSelect('lead.category', 'category')
                .leftJoinAndSelect('lead.user', 'user')
                .leftJoinAndSelect('lead.responses', 'responses', 'responses.vendorId = :vendorId', { vendorId: vendor.id })
                .where('lead.categoryId IN (:...categoryIds)', { categoryIds })
                .andWhere('lead.userId != :userId', { userId })
                .andWhere('lead.status IN (:...statuses)', { 
                    statuses: [JobLeadStatus.OPEN, JobLeadStatus.BROADCASTED, JobLeadStatus.RESPONDED] 
                });

            if (cities.length > 0) {
                query.andWhere('(lead.city IS NULL OR lead.city IN (:...cities))', { cities });
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
            relations: ['businesses'] 
        });
        
        if (!vendor || !vendor.businesses?.length) return { newCount: 0 };

        const categoryIds = vendor.businesses.map(b => b.categoryId).filter(id => !!id);
        const cities = vendor.businesses.map(b => b.city).filter(c => !!c);

        if (categoryIds.length === 0) return { newCount: 0 };

        const query = this.jobLeadRepository
            .createQueryBuilder('lead')
            .where('lead.categoryId IN (:...categoryIds)', { categoryIds })
            .andWhere('lead.userId != :userId', { userId })
            .andWhere('lead.status IN (:...statuses)', { 
                statuses: [JobLeadStatus.OPEN, JobLeadStatus.BROADCASTED, JobLeadStatus.RESPONDED] 
            });

        if (cities.length > 0) {
            query.andWhere('(lead.city IS NULL OR lead.city IN (:...cities))', { cities });
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
}
