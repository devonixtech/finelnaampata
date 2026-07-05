import {
    Injectable,
    NotFoundException,
    ForbiddenException,
    BadRequestException,
    Inject,
    forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, MoreThan, Brackets } from 'typeorm';
import { Event, EventStatus } from '../../entities/event.entity';
import { Listing } from '../../entities/business.entity';
import { Vendor } from '../../entities/vendor.entity';
import { User, UserRole } from '../../entities/user.entity';
import { Subscription, SubscriptionStatus } from '../../entities/subscription.entity';
import { SubscriptionPlan, SubscriptionPlanType } from '../../entities/subscription-plan.entity';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { BookingStatus } from '../../entities/promotion-booking.entity';
import { SearchEventDto } from './dto/search-event.dto';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { ActivePlan, ActivePlanStatus } from '../../entities/active-plan.entity';
import { PricingPlanType } from '../../entities/pricing-plan.entity';

@Injectable()
export class EventsService {
    constructor(
        @InjectRepository(Event)
        private eventRepository: Repository<Event>,
        @InjectRepository(Listing)
        private listingRepository: Repository<Listing>,
        @InjectRepository(Vendor)
        private vendorRepository: Repository<Vendor>,
        @InjectRepository(User)
        private userRepository: Repository<User>,
        @InjectRepository(Subscription)
        private subscriptionRepository: Repository<Subscription>,
        @InjectRepository(SubscriptionPlan)
        private subscriptionPlanRepository: Repository<SubscriptionPlan>,
        @InjectRepository(ActivePlan)
        private activePlanRepository: Repository<ActivePlan>,
        @Inject(forwardRef(() => SubscriptionsService))
        private subscriptionsService: any,
    ) { }

    /** Helper: recompute status from dates (same logic as entity hook, but for query results) */
    private computeStatus(event: Event): Event {
        const now = new Date();
        if (event.featuredUntil && now > new Date(event.featuredUntil)) {
            event.isFeatured = false;
        }

        const start = event.startDate ? new Date(event.startDate) : null;
        const end = event.endDate ? new Date(event.endDate) : null;

        if (start && now < start) {
            event.status = EventStatus.SCHEDULED;
        } else if (end && now > end) {
            event.status = EventStatus.EXPIRED;
        } else {
            event.status = EventStatus.ACTIVE;
        }
        return event;
    }

    private async assignFreePlanToVendor(vendorId: string): Promise<void> {
        const freePlan = await this.subscriptionPlanRepository.findOne({
            where: { planType: SubscriptionPlanType.FREE, isActive: true },
        });
        if (!freePlan) return;

        const existing = await this.subscriptionRepository.findOne({
            where: { vendorId, planId: freePlan.id, status: SubscriptionStatus.ACTIVE },
        });
        if (existing) return;

        const now = new Date();
        const endDate = new Date(now);
        endDate.setFullYear(now.getFullYear() + 10);
        await this.subscriptionRepository.save(
            this.subscriptionRepository.create({
                vendorId,
                planId: freePlan.id,
                status: SubscriptionStatus.ACTIVE,
                startDate: now,
                endDate,
                amount: 0,
                autoRenew: false,
            }),
        );
    }

    /** Resolve the vendor record for a given userId (auto-provision for unified accounts) */
    private async getVendorByUserId(userId: string): Promise<Vendor> {
        let vendor = await this.vendorRepository.findOne({ where: { userId } });
        if (vendor) return vendor;

        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (!user) throw new NotFoundException('User not found');

        vendor = await this.vendorRepository.save(
            this.vendorRepository.create({
                userId: user.id,
                businessName: `${user.fullName}'s Business`,
                businessPhone: user.phone,
                isVerified: false,
            }),
        );
        await this.assignFreePlanToVendor(vendor.id);
        if (user.role === UserRole.USER) {
            await this.userRepository.update(user.id, { role: UserRole.VENDOR });
        }
        return vendor;
    }

    /** Verify that a business belongs to the authenticated vendor */
    private async verifyBusinessOwnership(businessId: string, vendorId: string): Promise<Listing> {
        const listing = await this.listingRepository.findOne({ where: { id: businessId } });
        if (!listing) throw new NotFoundException('Business not found');
        if (listing.vendorId !== vendorId) {
            throw new ForbiddenException('You do not own this business listing');
        }
        return listing;
    }

    /** Helper: Validate that the requested duration does not exceed plan limits */
    private validateEventDuration(dto: CreateEventDto | UpdateEventDto, activeSub: any) {
        const features = activeSub.plan?.dashboardFeatures || activeSub.plan?.features || {};
        const maxDays = features.maxEventDurationDays || 7;

        const startDateStr = dto.startDate;
        const endDateStr = dto.endDate;

        if (startDateStr && endDateStr) {
            const start = new Date(startDateStr);
            const end = new Date(endDateStr);

            const diffMs = end.getTime() - start.getTime();
            const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

            if (diffDays > maxDays) {
                throw new BadRequestException(
                    `The selected duration (${diffDays} days) exceeds your ${activeSub.plan.name} plan limit of ${maxDays} days for Events.`
                );
            }
        }
    }

    /** Resolve limits for events */
    private resolveEventLimit(activeSub: any): number {
        const mergedFeatures = {
            ...(activeSub?.plan?.dashboardFeatures || {}),
            ...(activeSub?.plan?.features || {}),
        };

        const rawLimit = mergedFeatures.maxEvents;
        const numericLimit =
            rawLimit === undefined || rawLimit === null ? null : Number(rawLimit);

        if (numericLimit !== null && !Number.isNaN(numericLimit) && numericLimit > 0) {
            return numericLimit;
        }

        const isFree = activeSub?.plan?.planType === SubscriptionPlanType.FREE || activeSub?.plan?.name?.toLowerCase() === 'free';
        
        if (!isFree) {
            return 999;
        }

        return 1;
    }

    /** Create a new event */
    async create(userId: string, dto: CreateEventDto): Promise<Event> {
        const vendor = await this.getVendorByUserId(userId);
        await this.verifyBusinessOwnership(dto.businessId, vendor.id);

        const activeSub = await this.subscriptionsService.getActiveSubscription(userId);
        if (!activeSub || !activeSub.plan) {
            throw new BadRequestException('No active subscription found. Please purchase a plan to create events.');
        }

        const limit = this.resolveEventLimit(activeSub);

        if (limit <= 0 && !dto.pricingId) {
            throw new ForbiddenException(`Your current plan (${activeSub.plan.name}) does not allow creating events. Please upgrade your plan.`);
        }

        const currentCount = await this.eventRepository.count({
            where: {
                vendorId: vendor.id,
                status: Not(EventStatus.EXPIRED)
            }
        });

        if (currentCount >= limit && !dto.pricingId) {
            throw new BadRequestException(
                `You have reached the limit of ${limit} events for your ${activeSub.plan.name} plan. Please upgrade or delete an existing event.`
            );
        }

        this.validateEventDuration(dto, activeSub);

        const event = this.eventRepository.create({
            ...dto,
            vendorId: vendor.id,
            startDate: dto.startDate ? new Date(dto.startDate) : null,
            endDate: dto.endDate ? new Date(dto.endDate) : null,
            pricingId: dto.pricingId || null,
            isActive: false,
        });

        return this.eventRepository.save(event);
    }

    /** Get all events for the authenticated vendor */
    async findByVendor(userId: string, page = 1, limit = 10) {
        const vendor = await this.getVendorByUserId(userId);
        const skip = (Number(page) - 1) * Number(limit);

        const [events, total] = await this.eventRepository.findAndCount({
            where: { vendorId: vendor.id },
            relations: ['business'],
            order: { createdAt: 'DESC' },
            skip,
            take: Number(limit),
        });

        const withStatus = events.map(e => this.computeStatus(e));

        return {
            data: withStatus,
            meta: {
                total,
                page: Number(page),
                limit: Number(limit),
                totalPages: Math.ceil(total / Number(limit)),
            },
        };
    }

    /** Public search with filters */
    async findAllPublic(dto: SearchEventDto) {
        try {
            const { query, city, latitude, longitude, radius, categoryId, isFeatured, placement, limit = 10, page = 1 } = dto;
            const skip = (Number(page) - 1) * Number(limit);
            const now = new Date();

            const qb = this.eventRepository.createQueryBuilder('o')
                .leftJoinAndSelect('o.business', 'b')
                .leftJoinAndSelect('b.category', 'cat')
                .leftJoin('promotion_bookings', 'pb', 'pb.event_id = o.id AND pb.status = :activeStatus AND pb.start_time <= :now AND pb.end_time > :now', {
                    activeStatus: BookingStatus.ACTIVE,
                    now
                })
                .where('o.isActive = :isActive', { isActive: true })
                .andWhere('b.hiddenByDeletion = false')
                .andWhere('o.status != :expired', { expired: EventStatus.EXPIRED })
                .andWhere('(o.endDate IS NULL OR o.endDate > :now)', { now });

            if (query) {
                qb.andWhere(new Brackets(inner => {
                    inner.where('LOWER(o.title) LIKE :query', { query: `%${query.toLowerCase()}%` })
                        .orWhere('LOWER(o.description) LIKE :query', { query: `%${query.toLowerCase()}%` })
                        .orWhere('LOWER(b.title) LIKE :query', { query: `%${query.toLowerCase()}%` });
                }));
            }

            if (city) {
                qb.andWhere('LOWER(b.city) = :city', { city: city.toLowerCase() });
            }

            if (categoryId) {
                qb.andWhere('b.categoryId = :categoryId', { categoryId });
            }

            if (placement) {
                qb.andWhere('o.isFeatured = :trueVal', { trueVal: true });
            } else if (isFeatured === true) {
                qb.andWhere('o.isFeatured = :trueVal', { trueVal: true });
            }

            if (latitude && longitude) {
                const formula = `earth_distance(ll_to_earth(b.latitude, b.longitude), ll_to_earth(:lat, :lng))`;
                qb.addSelect(`${formula} / 1000`, 'distance');
                qb.setParameters({ lat: latitude, lng: longitude });

                if (radius) {
                    const radiusInMeters = radius * 1000;
                    qb.andWhere(`${formula} <= :radiusInMeters`, { radiusInMeters });
                }
                qb.orderBy('o.isFeatured', 'DESC');
                qb.addOrderBy('distance', 'ASC');
            } else {
                qb.orderBy('o.isFeatured', 'DESC');
                qb.addOrderBy('o.createdAt', 'DESC');
            }

            const [events, total] = await qb
                .skip(skip)
                .take(Number(limit))
                .getManyAndCount();

            const withStatus = events.map(e => this.computeStatus(e));

            return {
                data: withStatus,
                meta: {
                    total,
                    page: Number(page),
                    limit: Number(limit),
                    totalPages: Math.ceil(total / Number(limit)),
                },
            };
        } catch (error) {
            console.error('Error in findAllPublic (events):', error);
            throw error;
        }
    }

    /** Update an event */
    async update(id: string, userId: string, dto: UpdateEventDto): Promise<Event> {
        const vendor = await this.getVendorByUserId(userId);
        const event = await this.eventRepository.findOne({ where: { id } });
        if (!event) throw new NotFoundException('Event not found');
        if (event.vendorId !== vendor.id) throw new ForbiddenException('You do not own this event');

        if (dto.businessId && dto.businessId !== event.businessId) {
            await this.verifyBusinessOwnership(dto.businessId, vendor.id);
        }

        const activeSub = await this.subscriptionsService.getActiveSubscription(userId);
        if (activeSub && activeSub.plan) {
            const validationDto = {
                ...dto,
                startDate: dto.startDate || event.startDate?.toISOString(),
                endDate: dto.endDate || event.endDate?.toISOString(),
            };
            this.validateEventDuration(validationDto as any, activeSub);
        }

        Object.assign(event, {
            ...dto,
            startDate: dto.startDate ? new Date(dto.startDate) : event.startDate,
            endDate: dto.endDate ? new Date(dto.endDate) : event.endDate,
        });

        return this.eventRepository.save(event);
    }

    /** Delete an event */
    async remove(id: string, userId: string): Promise<void> {
        const user = await this.userRepository.findOne({ where: { id: userId } });
        const isAdmin = user && (user.role === UserRole.ADMIN || user.role === UserRole.SUPERADMIN);

        const event = await this.eventRepository.findOne({ where: { id } });
        if (!event) throw new NotFoundException('Event not found');
        
        if (!isAdmin) {
            const vendor = await this.getVendorByUserId(userId);
            if (event.vendorId !== vendor.id) throw new ForbiddenException('You do not own this event');
        }
        
        await this.eventRepository.remove(event);
    }

    /** Publish an event */
    async publish(id: string, userId: string): Promise<Event> {
        const vendor = await this.getVendorByUserId(userId);
        const event = await this.eventRepository.findOne({ where: { id } });
        if (!event) throw new NotFoundException('Event not found');
        if (event.vendorId !== vendor.id) throw new ForbiddenException('You do not own this event');

        const now = new Date();
        const activeAddon = await this.activePlanRepository.findOne({
            where: {
                vendorId: vendor.id,
                targetId: event.id,
                status: ActivePlanStatus.ACTIVE,
                endDate: MoreThan(now),
            },
            relations: ['plan'],
            order: { endDate: 'DESC' },
        });

        if (!activeAddon || !activeAddon.plan || activeAddon.plan.type === PricingPlanType.SUBSCRIPTION) {
            const hasWindow = event.startDate && event.endDate;
            if (hasWindow) {
                event.isActive = true;
                event.status = this.computeStatus(event).status;
                return this.eventRepository.save(event);
            }
            throw new BadRequestException('Event publish requires a successful visibility payment or valid dates.');
        }

        event.isActive = true;
        event.status = this.computeStatus(event).status;
        return this.eventRepository.save(event);
    }

    /** Public: get active/scheduled events for a business */
    async findPublicByBusiness(businessId: string): Promise<Event[]> {
        const now = new Date();
        const events = await this.eventRepository.createQueryBuilder('o')
            .where('o.businessId = :businessId', { businessId })
            .andWhere('o.isActive = :isActive', { isActive: true })
            .innerJoin('o.business', 'b')
            .andWhere('b.hiddenByDeletion = false')
            .andWhere('o.status != :expired', { expired: EventStatus.EXPIRED })
            .andWhere('(o.endDate IS NULL OR o.endDate > :now)', { now })
            .orderBy('o.isFeatured', 'DESC')
            .addOrderBy('o.createdAt', 'DESC')
            .take(20)
            .getMany();

        return events.map(e => this.computeStatus(e));
    }

    /** Public: get a single event by ID */
    async findOnePublic(id: string): Promise<Event> {
        const event = await this.eventRepository.findOne({
            where: { id, isActive: true },
            relations: ['business', 'business.category', 'business.vendor'],
        });

        if (!event) {
            throw new NotFoundException('Event not found');
        }

        if ((event.business as any)?.hiddenByDeletion) {
            throw new NotFoundException('Event not found');
        }

        const withStatus = this.computeStatus(event);
        if (withStatus.status === EventStatus.EXPIRED) {
            throw new NotFoundException('Event has expired');
        }

        return withStatus;
    }

    /** Cron: expire stale events */
    async expireStaleEvents(): Promise<number> {
        const now = new Date();
        let affected = 0;

        const result = await this.eventRepository
            .createQueryBuilder()
            .delete()
            .from(Event)
            .where('end_date IS NOT NULL AND end_date < :now', { now })
            .execute();

        affected += result.affected || 0;

        const featureResult = await this.eventRepository
            .createQueryBuilder()
            .update(Event)
            .set({ isFeatured: false })
            .where('featured_until < :now', { now })
            .andWhere('is_featured = :trueVal', { trueVal: true })
            .execute();

        affected += featureResult.affected || 0;
        return affected;
    }

    /** Admin: Toggle featured status */
    async toggleFeatured(id: string, isFeatured: boolean): Promise<Event> {
        const event = await this.eventRepository.findOne({ where: { id } });
        if (!event) throw new NotFoundException('Event not found');
        event.isFeatured = isFeatured;
        return this.eventRepository.save(event);
    }

    /** Admin: Get all events for management */
    async findAllForAdmin(page = 1, limit = 20) {
        const skip = (Number(page) - 1) * Number(limit);
        const [events, total] = await this.eventRepository.findAndCount({
            relations: ['business', 'vendor', 'vendor.user'],
            order: { createdAt: 'DESC' },
            skip,
            take: Number(limit),
        });

        return {
            data: events.map(e => this.computeStatus(e)),
            meta: {
                total,
                page: Number(page),
                limit: Number(limit),
                totalPages: Math.ceil(total / Number(limit)),
            },
        };
    }
}
