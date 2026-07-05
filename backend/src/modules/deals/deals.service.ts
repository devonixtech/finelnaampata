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
import { Deal, DealStatus } from '../../entities/deal.entity';
import { Listing } from '../../entities/business.entity';
import { Vendor } from '../../entities/vendor.entity';
import { User, UserRole } from '../../entities/user.entity';
import { Subscription, SubscriptionStatus } from '../../entities/subscription.entity';
import { SubscriptionPlan, SubscriptionPlanType } from '../../entities/subscription-plan.entity';
import { CreateDealDto } from './dto/create-deal.dto';
import { UpdateDealDto } from './dto/update-deal.dto';
import { BookingStatus } from '../../entities/promotion-booking.entity';
import { SearchDealDto } from './dto/search-deal.dto';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { ActivePlan, ActivePlanStatus } from '../../entities/active-plan.entity';
import { PricingPlanType } from '../../entities/pricing-plan.entity';

@Injectable()
export class DealsService {
    constructor(
        @InjectRepository(Deal)
        private dealRepository: Repository<Deal>,
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
    private computeStatus(deal: Deal): Deal {
        const now = new Date();
        if (deal.featuredUntil && now > new Date(deal.featuredUntil)) {
            deal.isFeatured = false;
        }

        const start = deal.startDate ? new Date(deal.startDate) : null;
        const expiry = deal.expiryDate ? new Date(deal.expiryDate) : null;
        const end = deal.endDate ? new Date(deal.endDate) : null;

        if (start && now < start) {
            deal.status = DealStatus.SCHEDULED;
        } else if ((expiry && now > expiry) || (end && now > end)) {
            deal.status = DealStatus.EXPIRED;
        } else {
            deal.status = DealStatus.ACTIVE;
        }
        return deal;
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
    private validateDealDuration(dto: CreateDealDto | UpdateDealDto, activeSub: any) {
        const features = activeSub.plan?.dashboardFeatures || activeSub.plan?.features || {};
        const maxDays = features.maxOfferDurationDays || 15;

        const startDateStr = dto.startDate;
        const endDateStr = dto.endDate || dto.expiryDate;

        if (startDateStr && endDateStr) {
            const start = new Date(startDateStr);
            const end = new Date(endDateStr);

            const diffMs = end.getTime() - start.getTime();
            const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

            if (diffDays > maxDays) {
                throw new BadRequestException(
                    `The selected duration (${diffDays} days) exceeds your ${activeSub.plan.name} plan limit of ${maxDays} days for Deals.`
                );
            }
        }
    }

    /** Resolve limits for deals */
    private resolveDealLimit(activeSub: any): number {
        const mergedFeatures = {
            ...(activeSub?.plan?.dashboardFeatures || {}),
            ...(activeSub?.plan?.features || {}),
        };

        const rawLimit = mergedFeatures.maxOffers;
        const numericLimit =
            rawLimit === undefined || rawLimit === null ? null : Number(rawLimit);

        if (numericLimit !== null && !Number.isNaN(numericLimit) && numericLimit > 0) {
            return numericLimit;
        }

        const isFree = activeSub?.plan?.planType === SubscriptionPlanType.FREE || activeSub?.plan?.name?.toLowerCase() === 'free';
        
        // Paid plan fallback: if maxOffers was 0 or undefined, give them unlimited deals (or a high limit)
        if (!isFree) {
            return 999;
        }

        return 1; // Free plans get 1
    }

    /** Create a new deal */
    async create(userId: string, dto: CreateDealDto): Promise<Deal> {
        const vendor = await this.getVendorByUserId(userId);
        await this.verifyBusinessOwnership(dto.businessId, vendor.id);

        const activeSub = await this.subscriptionsService.getActiveSubscription(userId);
        if (!activeSub || !activeSub.plan) {
            throw new BadRequestException('No active subscription found. Please purchase a plan to create deals.');
        }

        const limit = this.resolveDealLimit(activeSub);

        if (limit <= 0 && !dto.pricingId) {
            throw new ForbiddenException(`Your current plan (${activeSub.plan.name}) does not allow creating deals. Please upgrade your plan.`);
        }

        const currentCount = await this.dealRepository.count({
            where: {
                vendorId: vendor.id,
                status: Not(DealStatus.EXPIRED)
            }
        });

        if (currentCount >= limit && !dto.pricingId) {
            throw new BadRequestException(
                `You have reached the limit of ${limit} deals for your ${activeSub.plan.name} plan. Please upgrade or delete an existing deal.`
            );
        }

        this.validateDealDuration(dto, activeSub);

        const deal = this.dealRepository.create({
            ...dto,
            vendorId: vendor.id,
            startDate: dto.startDate ? new Date(dto.startDate) : null,
            endDate: dto.endDate ? new Date(dto.endDate) : null,
            expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : null,
            pricingId: dto.pricingId || null,
            isActive: false,
        });

        return this.dealRepository.save(deal);
    }

    /** Get all deals for the authenticated vendor */
    async findByVendor(userId: string, page = 1, limit = 10) {
        const vendor = await this.getVendorByUserId(userId);
        const skip = (Number(page) - 1) * Number(limit);

        const [deals, total] = await this.dealRepository.findAndCount({
            where: { vendorId: vendor.id },
            relations: ['business'],
            order: { createdAt: 'DESC' },
            skip,
            take: Number(limit),
        });

        const withStatus = deals.map(d => this.computeStatus(d));

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
    async findAllPublic(dto: SearchDealDto) {
        try {
            const { query, city, latitude, longitude, radius, categoryId, isFeatured, placement, limit = 10, page = 1 } = dto;
            const skip = (Number(page) - 1) * Number(limit);
            const now = new Date();

            const qb = this.dealRepository.createQueryBuilder('o')
                .leftJoinAndSelect('o.business', 'b')
                .leftJoinAndSelect('b.category', 'cat')
                .leftJoin('promotion_bookings', 'pb', 'pb.deal_id = o.id AND pb.status = :activeStatus AND pb.start_time <= :now AND pb.end_time > :now', {
                    activeStatus: BookingStatus.ACTIVE,
                    now
                })
                .where('o.isActive = :isActive', { isActive: true })
                .andWhere('b.hiddenByDeletion = false')
                .andWhere('o.status != :expired', { expired: DealStatus.EXPIRED })
                .andWhere('(o.expiryDate IS NULL OR o.expiryDate > :now)', { now })
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

            const [deals, total] = await qb
                .skip(skip)
                .take(Number(limit))
                .getManyAndCount();

            const withStatus = deals.map(d => this.computeStatus(d));

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
            console.error('Error in findAllPublic (deals):', error);
            throw error;
        }
    }

    /** Update a deal */
    async update(id: string, userId: string, dto: UpdateDealDto): Promise<Deal> {
        const vendor = await this.getVendorByUserId(userId);
        const deal = await this.dealRepository.findOne({ where: { id } });
        if (!deal) throw new NotFoundException('Deal not found');
        if (deal.vendorId !== vendor.id) throw new ForbiddenException('You do not own this deal');

        if (dto.businessId && dto.businessId !== deal.businessId) {
            await this.verifyBusinessOwnership(dto.businessId, vendor.id);
        }

        const activeSub = await this.subscriptionsService.getActiveSubscription(userId);
        if (activeSub && activeSub.plan) {
            const validationDto = {
                ...dto,
                startDate: dto.startDate || deal.startDate?.toISOString(),
                endDate: dto.endDate || deal.endDate?.toISOString() || deal.expiryDate?.toISOString(),
            };
            this.validateDealDuration(validationDto as any, activeSub);
        }

        Object.assign(deal, {
            ...dto,
            startDate: dto.startDate ? new Date(dto.startDate) : deal.startDate,
            endDate: dto.endDate ? new Date(dto.endDate) : deal.endDate,
            expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : deal.expiryDate,
        });

        return this.dealRepository.save(deal);
    }

    /** Delete a deal */
    async remove(id: string, userId: string): Promise<void> {
        const user = await this.userRepository.findOne({ where: { id: userId } });
        const isAdmin = user && (user.role === UserRole.ADMIN || user.role === UserRole.SUPERADMIN);

        const deal = await this.dealRepository.findOne({ where: { id } });
        if (!deal) throw new NotFoundException('Deal not found');
        
        if (!isAdmin) {
            const vendor = await this.getVendorByUserId(userId);
            if (deal.vendorId !== vendor.id) throw new ForbiddenException('You do not own this deal');
        }
        
        await this.dealRepository.remove(deal);
    }

    /** Publish a deal */
    async publish(id: string, userId: string): Promise<Deal> {
        const vendor = await this.getVendorByUserId(userId);
        const deal = await this.dealRepository.findOne({ where: { id } });
        if (!deal) throw new NotFoundException('Deal not found');
        if (deal.vendorId !== vendor.id) throw new ForbiddenException('You do not own this deal');

        const now = new Date();
        const activeAddon = await this.activePlanRepository.findOne({
            where: {
                vendorId: vendor.id,
                targetId: deal.id,
                status: ActivePlanStatus.ACTIVE,
                endDate: MoreThan(now),
            },
            relations: ['plan'],
            order: { endDate: 'DESC' },
        });

        if (!activeAddon || !activeAddon.plan || activeAddon.plan.type === PricingPlanType.SUBSCRIPTION) {
            const hasWindow = deal.startDate && deal.endDate;
            if (hasWindow) {
                deal.isActive = true;
                deal.status = this.computeStatus(deal).status;
                return this.dealRepository.save(deal);
            }
            throw new BadRequestException('Deal publish requires a successful visibility payment or valid dates.');
        }

        deal.isActive = true;
        deal.status = this.computeStatus(deal).status;
        return this.dealRepository.save(deal);
    }

    /** Public: get active/scheduled deals for a business */
    async findPublicByBusiness(businessId: string): Promise<Deal[]> {
        const now = new Date();
        const deals = await this.dealRepository.createQueryBuilder('o')
            .where('o.businessId = :businessId', { businessId })
            .andWhere('o.isActive = :isActive', { isActive: true })
            .innerJoin('o.business', 'b')
            .andWhere('b.hiddenByDeletion = false')
            .andWhere('o.status != :expired', { expired: DealStatus.EXPIRED })
            .andWhere('(o.expiryDate IS NULL OR o.expiryDate > :now)', { now })
            .andWhere('(o.endDate IS NULL OR o.endDate > :now)', { now })
            .orderBy('o.isFeatured', 'DESC')
            .addOrderBy('o.createdAt', 'DESC')
            .take(20)
            .getMany();

        return deals.map(d => this.computeStatus(d));
    }

    /** Public: get a single deal by ID */
    async findOnePublic(id: string): Promise<Deal> {
        const deal = await this.dealRepository.findOne({
            where: { id, isActive: true },
            relations: ['business', 'business.category', 'business.vendor'],
        });

        if (!deal) {
            throw new NotFoundException('Deal not found');
        }

        if ((deal.business as any)?.hiddenByDeletion) {
            throw new NotFoundException('Deal not found');
        }

        const withStatus = this.computeStatus(deal);
        if (withStatus.status === DealStatus.EXPIRED) {
            throw new NotFoundException('Deal has expired');
        }

        return withStatus;
    }

    /** Cron: expire stale deals */
    async expireStaleDeals(): Promise<number> {
        const now = new Date();
        let affected = 0;

        const result = await this.dealRepository
            .createQueryBuilder()
            .delete()
            .from(Deal)
            .where('(expiry_date IS NOT NULL AND expiry_date < :now) OR (end_date IS NOT NULL AND end_date < :now)', { now })
            .execute();

        affected += result.affected || 0;

        const featureResult = await this.dealRepository
            .createQueryBuilder()
            .update(Deal)
            .set({ isFeatured: false })
            .where('featured_until < :now', { now })
            .andWhere('is_featured = :trueVal', { trueVal: true })
            .execute();

        affected += featureResult.affected || 0;
        return affected;
    }

    /** Admin: Toggle featured status */
    async toggleFeatured(id: string, isFeatured: boolean): Promise<Deal> {
        const deal = await this.dealRepository.findOne({ where: { id } });
        if (!deal) throw new NotFoundException('Deal not found');
        deal.isFeatured = isFeatured;
        return this.dealRepository.save(deal);
    }

    /** Admin: Get all deals for management */
    async findAllForAdmin(page = 1, limit = 20) {
        const skip = (Number(page) - 1) * Number(limit);
        const [deals, total] = await this.dealRepository.findAndCount({
            relations: ['business', 'vendor', 'vendor.user'],
            order: { createdAt: 'DESC' },
            skip,
            take: Number(limit),
        });

        return {
            data: deals.map(d => this.computeStatus(d)),
            meta: {
                total,
                page: Number(page),
                limit: Number(limit),
                totalPages: Math.ceil(total / Number(limit)),
            },
        };
    }
}
