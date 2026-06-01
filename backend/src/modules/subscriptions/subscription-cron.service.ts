import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository, InjectEntityManager } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual, MoreThan, EntityManager } from 'typeorm';
import { Subscription, SubscriptionStatus } from '../../entities/subscription.entity';
import { ActivePlan, ActivePlanStatus } from '../../entities/active-plan.entity';
import { Vendor } from '../../entities/vendor.entity';
import { User } from '../../entities/user.entity';
import { NotificationsService, NotificationType } from '../notifications/notifications.service';
import { PushService } from '../notifications/push.service';
import { Listing } from '../../entities/business.entity';
import { PricingPlanType } from '../../entities/pricing-plan.entity';
import { OfferEvent, OfferStatus } from '../../entities/offer-event.entity';
import { OffersService } from '../offers/offers.service';
import { DealsService } from '../deals/deals.service';
import { EventsService } from '../events/events.service';
import { PromotionsService } from '../promotions/promotions.service';

@Injectable()
export class SubscriptionCronService {
    private readonly logger = new Logger(SubscriptionCronService.name);

    constructor(
        @InjectRepository(Subscription)
        private subscriptionRepo: Repository<Subscription>,
        @InjectRepository(ActivePlan)
        private activePlanRepo: Repository<ActivePlan>,
        @InjectRepository(Vendor)
        private vendorRepo: Repository<Vendor>,
        @InjectRepository(User)
        private userRepo: Repository<User>,
        @InjectRepository(Listing)
        private listingRepo: Repository<Listing>,
        @InjectRepository(OfferEvent)
        private offerEventRepo: Repository<OfferEvent>,
        private offersService: OffersService,
        private dealsService: DealsService,
        private eventsService: EventsService,
        private promotionsService: PromotionsService,
        private notificationsService: NotificationsService,
        private pushService: PushService,
        @InjectEntityManager()
        private readonly entityManager: EntityManager,
    ) { }

    /**
     * Runs every day at 8 AM - checks for subscriptions expiring in 1-4 days
     * Sends in-app notification + push notification to each vendor
     */
    @Cron(CronExpression.EVERY_DAY_AT_8AM)
    async handleExpiryReminders() {
        try {
            this.logger.log('[Cron] Running subscription expiry check...');
            await this.sendExpiryReminders();
        } catch (error) {
            this.logger.error(`[Cron] Failed to send expiry reminders: ${error.message}`);
        }
    }

    /**
     * Runs every hour - deactivates expired plans and clears listing flags
     */
    /**
     * Runs every hour - deactivates expired plans and handles auto-upgrade/downgrade to Free plan
     */
    @Cron(CronExpression.EVERY_HOUR)
    async handlePlanExpirations() {
        try {
            this.logger.log('[Cron] Checking for expired plans (New system)...');
            const now = new Date();

            // 1. Handle New System (ActivePlan) Expirations
            const allExpiredNew = await this.activePlanRepo.find({
                where: {
                    status: ActivePlanStatus.ACTIVE,
                    endDate: LessThanOrEqual(now),
                },
                relations: ['plan', 'vendor'],
            });

            // Filter out Free plans (they shouldn't expire, but double safety)
            const expiredNewPaid = allExpiredNew.filter(p => Number(p.plan?.price || 0) > 0);

            for (const plan of expiredNewPaid) {
                try {
                    plan.status = ActivePlanStatus.EXPIRED;
                    await this.activePlanRepo.save(plan);

                    // Clear listing flags if it was a boost
                    if (plan.targetId) {
                        const planType = (plan.plan as any)?.type;
                        if (planType === PricingPlanType.HOMEPAGE_FEATURED || planType === PricingPlanType.CATEGORY_FEATURED) {
                            await this.listingRepo.update(plan.targetId, { isFeatured: false });
                        } else if (planType === PricingPlanType.LISTING_BOOST) {
                            await this.listingRepo.update(plan.targetId, { isSponsored: false });
                        }
                    }

                    this.logger.log(`[Cron] Deactivated expired ActivePlan ${plan.id} for vendor ${plan.vendorId}`);
                    
                    // Trigger auto-move to Free plan if no other plan is coming up
                    await this.ensureVendorHasPlan(plan.vendorId);
                } catch (err: any) {
                    this.logger.error(`[Cron] Error handling ActivePlan ${plan.id} expiry: ${err.message}`);
                }
            }

            // 2. Handle Legacy System (Subscription) Expirations
            this.logger.log('[Cron] Checking for expired legacy subscriptions...');
            const allExpiredOld = await this.subscriptionRepo.find({
                where: {
                    status: SubscriptionStatus.ACTIVE,
                    endDate: LessThanOrEqual(now),
                },
                relations: ['plan', 'vendor'],
            });

            for (const sub of allExpiredOld) {
                try {
                    sub.status = SubscriptionStatus.EXPIRED;
                    await this.subscriptionRepo.save(sub);
                    this.logger.log(`[Cron] Deactivated expired Legacy Subscription ${sub.id} for vendor ${sub.vendorId}`);
                    
                    // Trigger auto-move to Free plan
                    await this.ensureVendorHasPlan(sub.vendorId);
                } catch (err: any) {
                    this.logger.error(`[Cron] Error handling Legacy Subscription ${sub.id} expiry: ${err.message}`);
                }
            }

            // 3. General cleanup for stale offers/promotions
            try {
                const staleAffected = await this.offersService.expireStaleOffers();
                if (staleAffected > 0) this.logger.log(`[Cron] Cleaned up ${staleAffected} stale legacy items`);

                const staleDeals = await this.dealsService.expireStaleDeals();
                if (staleDeals > 0) this.logger.log(`[Cron] Cleaned up ${staleDeals} stale deals`);

                const staleEvents = await this.eventsService.expireStaleEvents();
                if (staleEvents > 0) this.logger.log(`[Cron] Cleaned up ${staleEvents} stale events`);
                
                const promoAffected = await this.promotionsService.handleExpirations();
                if (promoAffected > 0) this.logger.log(`[Cron] Expired ${promoAffected} custom promotion bookings`);
            } catch (err: any) {
                this.logger.error(`[Cron] Error in cleanup tasks: ${err.message}`);
            }

        } catch (error) {
            this.logger.error(`[Cron] Failed to process plan expirations: ${error.message}`);
        }
    }

    /**
     * Ensures a vendor always has an active plan (Auto-upgrade/transition to Free)
     */
    private async ensureVendorHasPlan(vendorId: string) {
        try {
            const now = new Date();
            
            // Check if they already have a "future" or "next" plan that is ACTIVE
            const nextPlan = await this.activePlanRepo.findOne({
                where: {
                    vendorId,
                    status: ActivePlanStatus.ACTIVE,
                    endDate: MoreThan(now)
                }
            });

            if (nextPlan) {
                this.logger.log(`[Cron] Vendor ${vendorId} already has a subsequent plan ${nextPlan.id}.`);
                return;
            }

            // Fallback to Free Plan if found
            const freePlan = await this.entityManager.getRepository('pricing_plans').findOne({
                where: { name: 'Free', type: PricingPlanType.SUBSCRIPTION }
            });

            if (freePlan) {
                const infiniteDate = new Date();
                infiniteDate.setFullYear(infiniteDate.getFullYear() + 10); // 10 years for Free plan

                const newActiveFree = this.activePlanRepo.create({
                    vendorId,
                    planId: (freePlan as any).id,
                    status: ActivePlanStatus.ACTIVE,
                    startDate: now,
                    endDate: infiniteDate,
                    amountPaid: 0,
                });
                await this.activePlanRepo.save(newActiveFree);
                this.logger.log(`[Cron] Auto-upgraded/moved vendor ${vendorId} to Free plan after expiration.`);
            }
        } catch (err: any) {
            this.logger.error(`[Cron] Failed to ensure plan for vendor ${vendorId}: ${err.message}`);
        }
    }

    /**
     * Core logic - callable from cron or manually via admin trigger endpoint
     */
    async sendExpiryReminders(): Promise<{ notified: number; errors: number }> {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const in4Days = new Date(today);
        in4Days.setDate(in4Days.getDate() + 4);

        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        // Find active old-style subscriptions ending within the next 1-4 days
        const expiringOld = await this.subscriptionRepo.find({
            where: {
                status: SubscriptionStatus.ACTIVE,
                endDate: LessThanOrEqual(in4Days),
            },
            relations: ['plan', 'vendor', 'vendor.user'],
        });

        // Find active new-style plans ending within the next 1-4 days
        const expiringNew = await this.activePlanRepo.find({
            where: {
                status: ActivePlanStatus.ACTIVE,
                endDate: LessThanOrEqual(in4Days),
            },
            relations: ['plan', 'vendor', 'vendor.user'],
        });

        const allExpiring = [...expiringOld, ...expiringNew];

        let notified = 0;
        let errors = 0;

        for (const sub of allExpiring) {
            try {
                if (!sub.vendor?.user) continue;

                const user = sub.vendor.user;
                const endDate = new Date(sub.endDate);
                const daysLeft = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

                if (daysLeft < 0) continue; // Already expired, skip

                const planName = sub.plan?.name || 'your plan';
                const title = `⚠️ Subscription Expiring ${daysLeft <= 1 ? 'Tomorrow' : `in ${daysLeft} Days`}`;
                const message = `Your ${planName} subscription expires on ${endDate.toLocaleDateString('en-PK', { day: 'numeric', month: 'long', year: 'numeric' })}. Renew now to keep your listings active.`;

                // 1. In-app notification
                await this.notificationsService.create({
                    userId: user.id,
                    title,
                    message,
                    type: NotificationType.SUBSCRIPTION_ALERT,
                    link: '/subscription',
                    data: {
                        subscriptionId: sub.id,
                        daysLeft,
                        planName,
                        endDate: endDate.toISOString(),
                    },
                });

                // 2. Push notification (via PushService directly for OS-level)
                await this.pushService.sendToUser(user.id, {
                    title,
                    message,
                    type: NotificationType.SUBSCRIPTION_ALERT,
                    url: '/subscription',
                });

                this.logger.log(`[Cron] Expiry reminder sent to user ${user.id} (${user.email}) - ${daysLeft} day(s) left`);
                notified++;
            } catch (err: any) {
                this.logger.error(`[Cron] Failed to notify vendor ${sub.vendorId}: ${err.message}`);
                errors++;
            }
        }

        this.logger.log(`[Cron] Expiry check complete. Notified: ${notified}, Errors: ${errors}`);
        return { notified, errors };
    }
}
