import {
    Injectable,
    NotFoundException,
    Inject,
    forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OfferEvent, OfferType } from '../../entities/offer-event.entity';
import { CreateOfferDto } from './dto/create-offer.dto';
import { UpdateOfferDto } from './dto/update-offer.dto';
import { SearchOfferDto } from './dto/search-offer.dto';
import { DealsService } from '../deals/deals.service';
import { EventsService } from '../events/events.service';

@Injectable()
export class OffersService {
    constructor(
        @InjectRepository(OfferEvent)
        private offerRepository: Repository<OfferEvent>,
        private readonly dealsService: DealsService,
        private readonly eventsService: EventsService,
    ) { }

    /** Create a new offer/event */
    async create(userId: string, dto: CreateOfferDto): Promise<any> {
        const type = dto.type || OfferType.OFFER;
        if (type === OfferType.EVENT) {
            const res = await this.eventsService.create(userId, dto as any);
            return { ...res, type: 'event' };
        } else {
            const res = await this.dealsService.create(userId, dto as any);
            return { ...res, type: 'offer' };
        }
    }

    /** Get all offers for the authenticated vendor (paginated) */
    async findByVendor(userId: string, page = 1, limit = 10, type?: OfferType) {
        if (type === OfferType.EVENT) {
            const res = await this.eventsService.findByVendor(userId, page, limit);
            return {
                data: res.data.map(d => ({ ...d, type: 'event' })),
                meta: res.meta
            };
        } else if (type === OfferType.OFFER) {
            const res = await this.dealsService.findByVendor(userId, page, limit);
            return {
                data: res.data.map(d => ({ ...d, type: 'offer' })),
                meta: res.meta
            };
        } else {
            // Fetch both and merge
            const [dealsRes, eventsRes] = await Promise.all([
                this.dealsService.findByVendor(userId, 1, 100),
                this.eventsService.findByVendor(userId, 1, 100)
            ]);
            const combined = [
                ...dealsRes.data.map(d => ({ ...d, type: 'offer' })),
                ...eventsRes.data.map(e => ({ ...e, type: 'event' }))
            ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            
            const skip = (Number(page) - 1) * Number(limit);
            const sliced = combined.slice(skip, skip + Number(limit));
            return {
                data: sliced,
                meta: {
                    total: combined.length,
                    page: Number(page),
                    limit: Number(limit),
                    totalPages: Math.ceil(combined.length / Number(limit))
                }
            };
        }
    }

    /** Public search for offers and events with filters */
    async findAllPublic(dto: SearchOfferDto) {
        if (dto.type === OfferType.EVENT) {
            const res = await this.eventsService.findAllPublic(dto);
            return {
                data: res.data.map(d => ({ ...d, type: 'event' })),
                meta: res.meta
            };
        } else if (dto.type === OfferType.OFFER) {
            const res = await this.dealsService.findAllPublic(dto);
            return {
                data: res.data.map(d => ({ ...d, type: 'offer' })),
                meta: res.meta
            };
        } else {
            // Query both
            const [dealsRes, eventsRes] = await Promise.all([
                this.dealsService.findAllPublic({ ...dto, limit: 100, page: 1 }),
                this.eventsService.findAllPublic({ ...dto, limit: 100, page: 1 })
            ]);
            const combined = [
                ...dealsRes.data.map(d => ({ ...d, type: 'offer' })),
                ...eventsRes.data.map(e => ({ ...e, type: 'event' }))
            ];
            
            combined.sort((a: any, b: any) => {
                const featA = a.isFeatured ? 1 : 0;
                const featB = b.isFeatured ? 1 : 0;
                if (featA !== featB) return featB - featA;
                return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            });
            
            const skip = (Number(dto.page || 1) - 1) * Number(dto.limit || 10);
            const sliced = combined.slice(skip, skip + Number(dto.limit || 10));
            return {
                data: sliced,
                meta: {
                    total: combined.length,
                    page: Number(dto.page || 1),
                    limit: Number(dto.limit || 10),
                    totalPages: Math.ceil(combined.length / Number(dto.limit || 10))
                }
            };
        }
    }

    /** Update an existing offer (vendor-scoped) */
    async update(id: string, userId: string, dto: UpdateOfferDto): Promise<any> {
        // Try deal first
        try {
            const res = await this.dealsService.update(id, userId, dto as any);
            return { ...res, type: 'offer' };
        } catch (error) {
            if (error instanceof NotFoundException) {
                // Try event
                const res = await this.eventsService.update(id, userId, dto as any);
                return { ...res, type: 'event' };
            }
            throw error;
        }
    }

    /** Delete an offer (vendor-scoped) */
    async remove(id: string, userId: string): Promise<void> {
        try {
            await this.dealsService.remove(id, userId);
        } catch (error) {
            if (error instanceof NotFoundException) {
                await this.eventsService.remove(id, userId);
                return;
            }
            throw error;
        }
    }

    async publish(id: string, userId: string): Promise<any> {
        try {
            const res = await this.dealsService.publish(id, userId);
            return { ...res, type: 'offer' };
        } catch (error) {
            if (error instanceof NotFoundException) {
                const res = await this.eventsService.publish(id, userId);
                return { ...res, type: 'event' };
            }
            throw error;
        }
    }

    /** Public: get active/scheduled offers for a business (max 6) */
    async findPublicByBusiness(businessId: string): Promise<any[]> {
        const [deals, events] = await Promise.all([
            this.dealsService.findPublicByBusiness(businessId),
            this.eventsService.findPublicByBusiness(businessId)
        ]);
        return [
            ...deals.map(d => ({ ...d, type: 'offer' })),
            ...events.map(e => ({ ...e, type: 'event' }))
        ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 20);
    }

    /** Public: get a single offer/event by ID */
    async findOnePublic(id: string): Promise<any> {
        try {
            const deal = await this.dealsService.findOnePublic(id);
            return { ...deal, type: 'offer' };
        } catch (error) {
            if (error instanceof NotFoundException) {
                const event = await this.eventsService.findOnePublic(id);
                return { ...event, type: 'event' };
            }
            throw error;
        }
    }

    /** Cron / scheduled task: mark expired offers AND clear expired featured status */
    async expireStaleOffers(): Promise<number> {
        const affectedDeals = await this.dealsService.expireStaleDeals();
        const affectedEvents = await this.eventsService.expireStaleEvents();
        return affectedDeals + affectedEvents;
    }

    /** Admin: Toggle featured status */
    async toggleFeatured(id: string, isFeatured: boolean): Promise<any> {
        try {
            const deal = await this.dealsService.toggleFeatured(id, isFeatured);
            return { ...deal, type: 'offer' };
        } catch (error) {
            if (error instanceof NotFoundException) {
                const event = await this.eventsService.toggleFeatured(id, isFeatured);
                return { ...event, type: 'event' };
            }
            throw error;
        }
    }

    /** Admin: Get all offers for management */
    async findAllForAdmin(page = 1, limit = 20) {
        const [dealsRes, eventsRes] = await Promise.all([
            this.dealsService.findAllForAdmin(1, 100),
            this.eventsService.findAllForAdmin(1, 100)
        ]);
        const combined = [
            ...dealsRes.data.map(d => ({ ...d, type: 'offer' })),
            ...eventsRes.data.map(e => ({ ...e, type: 'event' }))
        ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        
        const skip = (Number(page) - 1) * Number(limit);
        const sliced = combined.slice(skip, skip + Number(limit));
        return {
            data: sliced,
            meta: {
                total: combined.length,
                page: Number(page),
                limit: Number(limit),
                totalPages: Math.ceil(combined.length / Number(limit))
            }
        };
    }
}
