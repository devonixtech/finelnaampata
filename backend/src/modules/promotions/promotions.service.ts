import {
    Injectable,
    NotFoundException,
    BadRequestException,
    Logger,
    OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan, LessThan, In } from 'typeorm';
import { PromotionPricingRule, PromotionPlacement } from '../../entities/promotion-pricing-rule.entity';
import { PromotionBooking, BookingStatus } from '../../entities/promotion-booking.entity';
import { OfferEvent, OfferType } from '../../entities/offer-event.entity';
import { Deal } from '../../entities/deal.entity';
import { Event } from '../../entities/event.entity';
import { Vendor } from '../../entities/vendor.entity';
import { PricingPlan } from '../../entities/pricing-plan.entity';
import { Transaction, PaymentStatus } from '../../entities/transaction.entity';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { CalculatePriceDto, CreateBookingDto } from './dto/create-booking.dto';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { forwardRef, Inject } from '@nestjs/common';
import { SubscriptionPlanType } from '../../entities/subscription-plan.entity';

@Injectable()
export class PromotionsService implements OnModuleInit {
    private readonly logger = new Logger(PromotionsService.name);
    private stripe: Stripe;
    private isPromotionDisabled(): boolean {
        // Visibility payments (per-day deals/events) are enabled by default.
        // Set PROMOTIONS_DISABLED=true to block paid visibility checkout.
        const raw = this.configService.get<string>('PROMOTIONS_DISABLED');
        if (raw === undefined || raw === null || String(raw).trim() === '') return false;
        const value = String(raw).toLowerCase();
        return value === '1' || value === 'true' || value === 'yes' || value === 'on';
    }

    async getVisibilityRate(type: 'deal' | 'event' = 'deal') {
        const placement = type === 'event' ? PromotionPlacement.EVENT : PromotionPlacement.OFFER;
        const rule = await this.pricingRuleRepo.findOne({ where: { placement, isActive: true } });
        return {
            type,
            dayRate: Number(rule?.pricePerDay ?? 150),
            placement,
        };
    }

    /** Per-day visibility pricing for deals (offer) and events — no ad placements. */
    async calculateVisibilityPrice(
        startTime: string,
        endTime: string,
        kind: 'deal' | 'event',
    ): Promise<{ days: number; dayRate: number; totalPrice: number; placement: PromotionPlacement }> {
        const placement = kind === 'deal' ? PromotionPlacement.OFFER : PromotionPlacement.EVENT;
        const rule = await this.pricingRuleRepo.findOne({ where: { placement, isActive: true } });
        const dayRate = Number(rule?.pricePerDay ?? 150);
        const start = new Date(startTime);
        const end = new Date(endTime);
        if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start >= end) {
            throw new BadRequestException('End time must be after start time');
        }
        const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        return { days, dayRate, totalPrice: days * dayRate, placement };
    }

    private assertPromotionEnabled() {
        if (this.isPromotionDisabled()) {
            throw new BadRequestException('Promotions are currently disabled by platform policy.');
        }
    }

    constructor(
        @InjectRepository(PromotionPricingRule)
        private pricingRuleRepo: Repository<PromotionPricingRule>,
        @InjectRepository(PromotionBooking)
        private bookingRepo: Repository<PromotionBooking>,
        @InjectRepository(OfferEvent)
        private offerRepository: Repository<OfferEvent>,
        @InjectRepository(Deal)
        private dealRepository: Repository<Deal>,
        @InjectRepository(Event)
        private eventRepository: Repository<Event>,
        @InjectRepository(Vendor)
        private vendorRepository: Repository<Vendor>,
        @InjectRepository(PricingPlan)
        private pricingPlanRepo: Repository<PricingPlan>,
        @InjectRepository(Transaction)
        private transactionRepository: Repository<Transaction>,
        private configService: ConfigService,
        @Inject(forwardRef(() => SubscriptionsService))
        private subscriptionsService: SubscriptionsService,
    ) {}

    onModuleInit() {
        const apiKey = this.configService.get<string>('STRIPE_SECRET_KEY');
        this.stripe = new Stripe(apiKey || 'sk_test_not_configured', {
            apiVersion: '2026-02-25.clover' as any,
        });

        if (this.isPromotionDisabled()) {
            this.logger.warn('Promotion system is disabled by policy. Skipping pricing-rule bootstrap.');
            return;
        }

        // Initialize default pricing rules if none exist
        this.seedDefaultRules();
    }

    private async seedDefaultRules() {
        const defaults = [
            { placement: PromotionPlacement.HOMEPAGE, pricePerHour: 100, pricePerDay: 2400 },
            { placement: PromotionPlacement.CATEGORY, pricePerHour: 70, pricePerDay: 1680 },
            { placement: PromotionPlacement.LISTING, pricePerHour: 50, pricePerDay: 1200 },
            { placement: PromotionPlacement.OFFER, pricePerHour: 40, pricePerDay: 960 },
            { placement: PromotionPlacement.EVENT, pricePerHour: 60, pricePerDay: 1440 },
            { placement: PromotionPlacement.PAGE, pricePerHour: 80, pricePerDay: 1920 },
        ];

        for (const ruleData of defaults) {
            const exists = await this.pricingRuleRepo.findOne({ where: { placement: ruleData.placement } });
            if (!exists) {
                this.logger.log(`Seeding missing default pricing rule: ${ruleData.placement}`);
                await this.pricingRuleRepo.save(ruleData);
            }
        }
    }

    /**
     * Get pricing rules for the frontend
     */
    async getPricingRules() {
        if (this.isPromotionDisabled()) return [];
        return this.pricingRuleRepo.find({ where: { isActive: true } });
    }

    async calculatePrice(dto: CalculatePriceDto, userId?: string, offerType: string = 'offer'): Promise<{ totalPrice: number; durationHours: number; breakup: any[]; isMinimumApplied?: boolean }> {
        this.assertPromotionEnabled();
        let totalPrice = 0;
        const breakup = [];
        // const MIN_STRIPE_AMOUNT_PKR = 150;

        // 1. Check if a fixed-price booster plan is selected
        let activePricingId = dto.pricingId;
        
        // If pricingId is missing but dealId/eventId/offerEventId is present, try to fetch it from the entity
        if (!activePricingId) {
            if (dto.dealId) {
                const deal = await this.dealRepository.findOne({ where: { id: dto.dealId } });
                if (deal?.pricingId) {
                    activePricingId = deal.pricingId;
                }
            } else if (dto.eventId) {
                const event = await this.eventRepository.findOne({ where: { id: dto.eventId } });
                if (event?.pricingId) {
                    activePricingId = event.pricingId;
                }
            } else if (dto.offerEventId) {
                const offer = await this.offerRepository.findOne({ where: { id: dto.offerEventId } });
                if (offer?.pricingId) {
                    activePricingId = offer.pricingId;
                }
            }
        }

        if (activePricingId) {
            const plan = await this.pricingPlanRepo.findOne({ where: { id: activePricingId, isActive: true } });
            if (plan) {
                const planPrice = Number(plan.price);
                totalPrice += planPrice;
                breakup.push({
                    placement: plan.type,
                    label: plan.name,
                    subtotal: planPrice,
                    price: planPrice,
                    isBaseFee: true,
                    isFixedPlan: true
                });
            }
        }

        // 2. Per-day visibility (deals/events) or legacy placement boosts
        let durationHours = 0;
        if (dto.placements?.length > 0 && dto.startTime && dto.endTime) {
            const isVisibilityOnly = dto.placements.every(
                (p) => p === PromotionPlacement.OFFER || p === PromotionPlacement.EVENT,
            );

            if (isVisibilityOnly) {
                const kind: 'deal' | 'event' = dto.placements.includes(PromotionPlacement.EVENT) &&
                    !dto.placements.includes(PromotionPlacement.OFFER)
                    ? 'event'
                    : 'deal';
                const vis = await this.calculateVisibilityPrice(dto.startTime, dto.endTime, kind);
                durationHours = vis.days * 24;
                totalPrice += vis.totalPrice;
                breakup.push({
                    placement: vis.placement,
                    label: 'Per-day visibility',
                    subtotal: vis.totalPrice,
                    price: vis.totalPrice,
                    dayRate: vis.dayRate,
                    days: vis.days,
                    isBaseFee: false,
                });
            } else {
                const start = new Date(dto.startTime);
                const end = new Date(dto.endTime);
                if (start >= end) throw new BadRequestException('Start time must be before end time for boosts');

                const diffMs = end.getTime() - start.getTime();
                durationHours = Math.ceil(diffMs / (1000 * 60 * 60));
                const durationDays = Math.floor(durationHours / 24);
                const remainingHours = durationHours % 24;

                const rules = await this.pricingRuleRepo.find({ where: { placement: In(dto.placements) } });
                for (const rule of rules) {
                    const hourRate = Number(rule.pricePerHour);
                    const dayRate = Number(rule.pricePerDay);
                    const placementTotal = (durationDays * dayRate) + (remainingHours * hourRate);

                    totalPrice += placementTotal;
                    breakup.push({
                        placement: rule.placement,
                        subtotal: placementTotal,
                        price: placementTotal,
                        rate: hourRate,
                        days: durationDays,
                        hours: remainingHours,
                        isBaseFee: false,
                    });
                }
            }
        }

        // let isMinimumApplied = false;
        // If there's a cost but it's below the Stripe minimum of roughly ₨ 140, we round up to ₨ 150
        // if (totalPrice > 0 && totalPrice < MIN_STRIPE_AMOUNT_PKR) {
        //     totalPrice = MIN_STRIPE_AMOUNT_PKR;
        //     isMinimumApplied = true;
        // }

        return { totalPrice, durationHours, breakup, isMinimumApplied: false };
    }

    /**
     * Create a pending booking and a Stripe Checkout session
     */
    async createBooking(userId: string, dto: CreateBookingDto, origin?: string) {
        this.assertPromotionEnabled();
        const vendor = await this.vendorRepository.findOne({ where: { userId } });
        if (!vendor) throw new NotFoundException('Vendor profile not found');

        if (!dto.placements?.length) {
            if (dto.dealId) dto.placements = [PromotionPlacement.OFFER];
            else if (dto.eventId) dto.placements = [PromotionPlacement.EVENT];
        }

        let targetType: OfferType = OfferType.OFFER;
        let idField: 'offerEventId' | 'dealId' | 'eventId' = 'offerEventId';
        let targetEntity: any = null;

        if (dto.dealId) {
            targetEntity = await this.dealRepository.findOne({ where: { id: dto.dealId, vendorId: vendor.id } });
            targetType = OfferType.OFFER;
            idField = 'dealId';
        } else if (dto.eventId) {
            targetEntity = await this.eventRepository.findOne({ where: { id: dto.eventId, vendorId: vendor.id } });
            targetType = OfferType.EVENT;
            idField = 'eventId';
        } else if (dto.offerEventId) {
            targetEntity = await this.offerRepository.findOne({ where: { id: dto.offerEventId, vendorId: vendor.id } });
            if (targetEntity) {
                targetType = targetEntity.type;
                idField = 'offerEventId';
            }
        }

        if (!targetEntity) throw new NotFoundException('Promotional item (Deal/Event/Offer) not found');

        // Check if vendor has a valid plan for promotions
        const activeSub = await this.subscriptionsService.getActiveSubscription(userId);
        
        // Log plan info for debugging
        this.logger.debug(`Vendor ${userId} is creating a booking. Active Sub: ${activeSub?.id || 'None'}, Plan Type: ${activeSub?.plan?.planType || 'None'}`);

        // RELAXED CHECK: Allow promotions even on Free plan for local development/testing.
        if (activeSub?.plan?.planType === SubscriptionPlanType.FREE) {
            this.logger.warn(`DEBUG: RELAXED CHECK - Vendor ${userId} is booking a promotion on a FREE plan.`);
        } else if (!activeSub) {
            this.logger.warn(`Vendor ${userId} has no active subscription but is attempting to book a promotion.`);
        }

        const pricing = await this.calculatePrice(dto, userId, targetType);
        if (pricing.totalPrice === 0) {
            // Free promotion (if configured)
            return this.activateFreeBooking(vendor.id, targetEntity, dto, pricing, idField);
        }

        // 1. Save Pending Booking
        const booking = this.bookingRepo.create({
            vendorId: vendor.id,
            [idField]: targetEntity.id,
            type: targetType,
            placements: dto.placements,
            startTime: new Date(dto.startTime),
            endTime: new Date(dto.endTime),
            durationHours: pricing.durationHours,
            totalPrice: pricing.totalPrice,
            status: BookingStatus.PENDING,
        });
        await this.bookingRepo.save(booking);

        // 2. Stripe Session
        const frontendUrl = this.configService.get<string>('FRONTEND_URL') || '';
        const allowedUrls = frontendUrl ? frontendUrl.split(',').map(url => url.trim()) : [];
        const baseUrl = origin || allowedUrls[0] || 'http://localhost:3000';

        const successPath = dto.dealId
            ? '/deals/success'
            : dto.eventId
                ? '/events/success'
                : '/offer-plans/success';
        const cancelPath = dto.dealId ? '/deals' : dto.eventId ? '/events' : '/offer-plans';

        const info = pricing.breakup.map(b => b.label || b.placement).join(', ');
        const session = await this.stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            customer_email: vendor.businessEmail || undefined,
            client_reference_id: vendor.id,
            line_items: [{
                price_data: {
                    currency: 'pkr',
                    product_data: {
                        name: `${targetType === OfferType.OFFER ? 'Offer/Deal' : 'Event'} Listing - ${pricing.breakup[0]?.label || 'Standard'}`,
                        description: `Visibility: ${info}`,
                    },
                    unit_amount: Math.round(pricing.totalPrice * 100),
                },
                quantity: 1,
            }],
            mode: 'payment',
            metadata: {
                bookingId: booking.id,
                type: 'promotion_booking'
            },
            success_url: `${baseUrl}${successPath}?session_id={CHECKOUT_SESSION_ID}&booking_id=${booking.id}`,
            cancel_url:  `${baseUrl}${cancelPath}?canceled=true`,
        });

        booking.stripeSessionId = session.id;
        await this.bookingRepo.save(booking);

        return {
            sessionId: session.id,
            checkoutUrl: session.url,
            bookingId: booking.id
        };
    }

    private async activateFreeBooking(
        vendorId: string,
        item: any,
        dto: CreateBookingDto,
        pricing: any,
        idField: 'offerEventId' | 'dealId' | 'eventId'
    ) {
        const booking = this.bookingRepo.create({
            vendorId,
            [idField]: item.id,
            type: item.type || (idField === 'dealId' ? OfferType.OFFER : OfferType.EVENT),
            placements: dto.placements,
            startTime: new Date(dto.startTime),
            endTime: new Date(dto.endTime),
            durationHours: pricing.durationHours,
            totalPrice: 0,
            status: BookingStatus.ACTIVE,
        });
        await this.bookingRepo.save(booking);

        // Ensure the offer/deal/event itself is active (if it was pending payment)
        if (!item.isActive) {
            item.isActive = true;
            if (idField === 'dealId') {
                await this.dealRepository.save(item);
            } else if (idField === 'eventId') {
                await this.eventRepository.save(item);
            } else {
                await this.offerRepository.save(item);
            }
        }

        return { success: true, bookingId: booking.id };
    }

    /**
     * Verify and Activate Booking
     */
    async verifySession(sessionId: string, userId: string) {
        this.assertPromotionEnabled();
        try {
            const session = await this.stripe.checkout.sessions.retrieve(sessionId);
            if (session.payment_status === 'paid') {
                const bookingId = session.metadata.bookingId;
                const paymentIntentId = session.payment_intent as string;
                
                const result = await this.activateBooking(bookingId, paymentIntentId);
                return { success: true, ...result };
            }
            return { success: false, status: session.payment_status };
        } catch (error) {
            this.logger.error(`Failed to verify checkout session ${sessionId}:`, error);
            throw new BadRequestException(`Verification failed: ${error.message}`);
        }
    }

    /**
     * Activate a booking and sync with OfferEvent (called by Webhook or Manual Verification)
     */
    async activateBooking(bookingId: string, gatewayTransactionId: string) {
        this.assertPromotionEnabled();
        const booking = await this.bookingRepo.findOne({ where: { id: bookingId } });
        if (!booking) throw new NotFoundException('Booking not found');

        if (booking.status === BookingStatus.ACTIVE) {
            return { alreadyProcessed: true, booking };
        }

        // 1. Activate Booking
        booking.status = BookingStatus.ACTIVE;
        booking.paymentIntentId = gatewayTransactionId;
        await this.bookingRepo.save(booking);

        // 1.5. Record Transaction for Billing History
        try {
            const existingTrans = await this.transactionRepository.findOne({
                where: { gatewayTransactionId }
            });

            if (!existingTrans) {
                const transaction = this.transactionRepository.create({
                    vendorId: booking.vendorId,
                    amount: booking.totalPrice,
                    currency: 'PKR',
                    status: PaymentStatus.COMPLETED,
                    paidAt: new Date(),
                    gatewayTransactionId,
                    paymentGateway: 'Stripe',
                    stripeSessionId: booking.stripeSessionId,
                    invoiceNumber: `INV-BST-${Date.now()}`,
                    metadata: {
                        bookingId: booking.id,
                        type: 'promotion_boost',
                        offerEventId: booking.offerEventId,
                        dealId: booking.dealId,
                        eventId: booking.eventId,
                        offerType: booking.type,
                        placements: booking.placements
                    }
                });
                await this.transactionRepository.save(transaction);
                this.logger.log(`Invoice recorded for boost booking ${booking.id}`);
            }
        } catch (error) {
            this.logger.error(`Failed to record transaction for booking ${booking.id}: ${error.message}`);
            // Don't fail the whole activation if transaction recording fails
        }

        // 2. Sync with Deal/Event/OfferEvent (Apply the Boost)
        let item: any = null;
        if (booking.dealId) {
            item = await this.dealRepository.findOne({ where: { id: booking.dealId } });
        } else if (booking.eventId) {
            item = await this.eventRepository.findOne({ where: { id: booking.eventId } });
        } else if (booking.offerEventId) {
            item = await this.offerRepository.findOne({ where: { id: booking.offerEventId } });
        }

        if (item) {
            // All boosts make the item active and featured
            item.isActive = true;
            item.isFeatured = true;
            
            // Sync placements
            const currentPlacements = item.placements || [];
            const newPlacements = [...new Set([...currentPlacements, ...booking.placements])];
            item.placements = newPlacements;
            
            // Set featuredUntil to the end of the booking duration
            if (!item.featuredUntil || item.featuredUntil < booking.endTime) {
                item.featuredUntil = booking.endTime;
            }
            
            if (booking.dealId) {
                await this.dealRepository.save(item);
            } else if (booking.eventId) {
                await this.eventRepository.save(item);
            } else {
                await this.offerRepository.save(item);
            }
            this.logger.log(`🚀 Boost activated for ${booking.dealId ? 'Deal' : booking.eventId ? 'Event' : 'Offer'}: ${item.title} until ${item.featuredUntil} with placements: ${newPlacements.join(', ')}`);
        }

        return { success: true, booking, item };
    }

    /**
     * Admin: Update pricing rules
     */
    async updatePricingRule(id: string, dto: { pricePerHour?: number, isActive?: boolean }) {
        this.assertPromotionEnabled();
        const rule = await this.pricingRuleRepo.findOne({ where: { id } });
        if (!rule) throw new NotFoundException('Pricing rule not found');

        if (dto.pricePerHour !== undefined) {
            rule.pricePerHour = dto.pricePerHour;
            rule.pricePerDay = dto.pricePerHour * 24; // Sync day rate (24x hourly)
        }
        if (dto.isActive !== undefined) rule.isActive = dto.isActive;

        return this.pricingRuleRepo.save(rule);
    }

    /**
     * Expiration logic to be called by a cron job
     */
    async handleExpirations() {
        const now = new Date();
        
        // 1. Find bookings that just expired
        const expiredBookings = await this.bookingRepo.find({
            where: {
                status: BookingStatus.ACTIVE,
                endTime: LessThan(now),
            }
        });

        if (expiredBookings.length === 0) return 0;

        this.logger.log(`Cleaning up ${expiredBookings.length} expired promotions...`);

        // 2. Identify unique offers/deals/events affected
        const offerIds = [...new Set(expiredBookings.filter(b => b.offerEventId).map(b => b.offerEventId))];
        const dealIds = [...new Set(expiredBookings.filter(b => b.dealId).map(b => b.dealId))];
        const eventIds = [...new Set(expiredBookings.filter(b => b.eventId).map(b => b.eventId))];

        for (const offerId of offerIds) {
            const offer = await this.offerRepository.findOne({ where: { id: offerId } });
            if (!offer) continue;

            // Find remaining active bookings for this offer
            const activeBookings = await this.bookingRepo.find({
                where: {
                    offerEventId: offerId,
                    status: BookingStatus.ACTIVE,
                    endTime: MoreThan(now),
                }
            });

            // Recalculate placements
            const remainingPlacements = [];
            activeBookings.forEach(b => {
                remainingPlacements.push(...b.placements);
            });
            offer.placements = [...new Set(remainingPlacements)];

            // If no active bookings left, we might want to toggle featured? 
            if (offer.placements.length === 0 && offer.featuredUntil && now > offer.featuredUntil) {
                offer.isFeatured = false;
            }

            await this.offerRepository.save(offer);
        }

        for (const dealId of dealIds) {
            const deal = await this.dealRepository.findOne({ where: { id: dealId } });
            if (!deal) continue;

            const activeBookings = await this.bookingRepo.find({
                where: {
                    dealId,
                    status: BookingStatus.ACTIVE,
                    endTime: MoreThan(now),
                }
            });

            const remainingPlacements = [];
            activeBookings.forEach(b => {
                remainingPlacements.push(...b.placements);
            });
            deal.placements = [...new Set(remainingPlacements)];

            if (deal.placements.length === 0 && deal.featuredUntil && now > deal.featuredUntil) {
                deal.isFeatured = false;
            }

            await this.dealRepository.save(deal);
        }

        for (const eventId of eventIds) {
            const event = await this.eventRepository.findOne({ where: { id: eventId } });
            if (!event) continue;

            const activeBookings = await this.bookingRepo.find({
                where: {
                    eventId,
                    status: BookingStatus.ACTIVE,
                    endTime: MoreThan(now),
                }
            });

            const remainingPlacements = [];
            activeBookings.forEach(b => {
                remainingPlacements.push(...b.placements);
            });
            event.placements = [...new Set(remainingPlacements)];

            if (event.placements.length === 0 && event.featuredUntil && now > event.featuredUntil) {
                event.isFeatured = false;
            }

            await this.eventRepository.save(event);
        }

        // 3. Mark bookings as expired
        const result = await this.bookingRepo
            .createQueryBuilder()
            .update(PromotionBooking)
            .set({ status: BookingStatus.EXPIRED })
            .where('status = :active', { active: BookingStatus.ACTIVE })
            .andWhere('endTime < :now', { now })
            .execute();
        
        return result.affected || 0;
    }

    /**
     * Get active bookings for a vendor
     */
    async getActiveBookingsByVendor(vendorId: string) {
        const now = new Date();
        return this.bookingRepo.find({
            where: {
                vendorId,
                status: BookingStatus.ACTIVE,
                endTime: MoreThan(now),
            },
            relations: ['offerEvent', 'offerEvent.business', 'deal', 'deal.business', 'event', 'event.business'],
            order: { endTime: 'ASC' },
        });
    }
}
