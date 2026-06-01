import {
    Injectable,
    NotFoundException,
    BadRequestException,
    ForbiddenException,
    Logger,
    OnModuleInit,
    Inject,
    forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan, LessThanOrEqual, IsNull } from 'typeorm';
import { Subscription, SubscriptionStatus } from '../../entities/subscription.entity';
import { SubscriptionPlan } from '../../entities/subscription-plan.entity';
import { PricingPlan, PricingPlanType, PricingPlanUnit } from '../../entities/pricing-plan.entity';
import { ActivePlan, ActivePlanStatus } from '../../entities/active-plan.entity';
import { Transaction, PaymentStatus } from '../../entities/transaction.entity';
import { Vendor } from '../../entities/vendor.entity';
import { User, UserRole } from '../../entities/user.entity';
import { Listing } from '../../entities/business.entity';
import { AffiliateReferral, ReferralStatus, ReferralType } from '../../entities/referral.entity';
import { Affiliate } from '../../entities/affiliate.entity';
import { CreatePlanDto, UpdatePlanDto, CheckoutDto, AssignPlanDto, CreatePricingPlanDto, UpdatePricingPlanDto } from './dto/subscription.dto';
import { OfferEvent } from '../../entities/offer-event.entity';
import { Deal } from '../../entities/deal.entity';
import { Event } from '../../entities/event.entity';


import { ConfigService } from '@nestjs/config';
import { AffiliateService } from '../affiliate/affiliate.service';
import { PromotionsService } from '../promotions/promotions.service';
import { NotificationsGateway } from '../notifications/notifications.gateway';
import Stripe from 'stripe';

@Injectable()
export class SubscriptionsService implements OnModuleInit {
    private readonly logger = new Logger(SubscriptionsService.name);
    private stripe: Stripe;
    constructor(
        @InjectRepository(Subscription)
        private subscriptionRepository: Repository<Subscription>,
        @InjectRepository(SubscriptionPlan)
        private planRepository: Repository<SubscriptionPlan>,
        @InjectRepository(PricingPlan)
        private pricingPlanRepository: Repository<PricingPlan>,
        @InjectRepository(ActivePlan)
        private activePlanRepository: Repository<ActivePlan>,
        @InjectRepository(Listing)
        private listingRepo: Repository<Listing>,
        @InjectRepository(Transaction)
        private transactionRepository: Repository<Transaction>,
        @InjectRepository(Vendor)
        private vendorRepository: Repository<Vendor>,
        @InjectRepository(User)
        private userRepository: Repository<User>,
        @InjectRepository(AffiliateReferral)
        private referralRepository: Repository<AffiliateReferral>,
        @InjectRepository(Affiliate)
        private affiliateRepository: Repository<Affiliate>,
        @InjectRepository(OfferEvent)
        private offerEventRepository: Repository<OfferEvent>,
        @InjectRepository(Deal)
        private dealRepository: Repository<Deal>,
        @InjectRepository(Event)
        private eventRepository: Repository<Event>,
        private configService: ConfigService,
        private affiliateService: AffiliateService,
        @Inject(forwardRef(() => PromotionsService))
        private promotionsService: PromotionsService,
        private notificationsGateway: NotificationsGateway,
    ) { }


    onModuleInit() {
        const apiKey = this.configService.get<string>('STRIPE_SECRET_KEY');
        if (!apiKey || apiKey === 'sk_test_your_secret_key_here') {
            this.logger.error('❌ STRIPE_SECRET_KEY is missing or invalid! Stripe features will be disabled. Please set this in your .env or Railway dashboard.');
        }

        // We use a dummy key if the real one is missing to prevent the Stripe constructor from throwing an error.
        // This allows the NestJS application to start successfully even without Stripe configured.
        this.stripe = new Stripe(apiKey || 'sk_test_not_configured', {
            apiVersion: '2026-02-25.clover' as any,
        });
    }

    /**
     * Get all available subscription plans (Client)
     */
    private normalizePlanResponse(plan: SubscriptionPlan): any {
        const dashboardFeatures = (plan.dashboardFeatures || (plan as any).features || {}) as Record<string, any>;
        return {
            ...plan,
            billingCycle: (plan.billingCycle || 'monthly').toLowerCase(),
            dashboardFeatures,
        };
    }

    async getPlans(): Promise<any[]> {
        const plans = await this.planRepository.find({ where: { isActive: true }, order: { price: 'ASC' } });
        return plans.map((plan) => this.normalizePlanResponse(plan));
    }

    /**
     * ADMIN: Get all plans including inactive ones
     */
    async getPlansForAdmin(): Promise<any[]> {
        const plans = await this.planRepository.find({ order: { price: 'ASC' } });
        return plans.map((plan) => this.normalizePlanResponse(plan));
    }

    /**
     * ADMIN: Get plan by ID
     */
    async getPlanById(id: string): Promise<SubscriptionPlan> {
        const plan = await this.planRepository.findOne({ where: { id } });
        if (!plan) throw new NotFoundException('Plan not found');
        return plan;
    }

    /**
     * ADMIN: Create a new plan
     */
    async createPlan(createPlanDto: CreatePlanDto): Promise<SubscriptionPlan> {
        const plan = this.planRepository.create(createPlanDto);
        return this.planRepository.save(plan);
    }

    /**
     * ADMIN: Update a plan
     */
    async updatePlan(id: string, updatePlanDto: UpdatePlanDto): Promise<SubscriptionPlan> {
        const plan = await this.getPlanById(id);
        Object.assign(plan, updatePlanDto);
        return this.planRepository.save(plan);
    }

    /**
     * ADMIN: Delete a plan
     */
    async deletePlan(id: string): Promise<void> {
        const plan = await this.getPlanById(id);
        await this.planRepository.remove(plan);
    }

    /**
     * ADMIN: Get all PricingPlans (Boost/Monetization)
     */
    async getPricingPlansForAdmin(): Promise<PricingPlan[]> {
        return this.pricingPlanRepository.find({ order: { type: 'ASC', price: 'ASC' } });
    }

    /**
     * ADMIN: Create a new PricingPlan
     */
    async createPricingPlan(dto: CreatePricingPlanDto): Promise<PricingPlan> {
        const plan = this.pricingPlanRepository.create(dto as any);
        return this.pricingPlanRepository.save(plan) as unknown as Promise<PricingPlan>;
    }

    /**
     * ADMIN: Update a PricingPlan
     */
    async updatePricingPlan(id: string, dto: UpdatePricingPlanDto): Promise<PricingPlan> {
        const plan = await this.pricingPlanRepository.findOne({ where: { id } });
        if (!plan) throw new NotFoundException('Pricing plan not found');
        Object.assign(plan, dto);
        return this.pricingPlanRepository.save(plan);
    }

    /**
     * ADMIN: Delete a PricingPlan
     */
    async deletePricingPlan(id: string): Promise<void> {
        const plan = await this.pricingPlanRepository.findOne({ where: { id } });
        if (!plan) throw new NotFoundException('Pricing plan not found');
        await this.pricingPlanRepository.remove(plan);
    }

    /**
     * ADMIN: Get all subscriptions (paginated)
     */
    async getAllSubscriptionsForAdmin(page = 1, limit = 20): Promise<{ data: any[]; total: number }> {
        const [oldData, oldTotal] = await this.subscriptionRepository.findAndCount({
            relations: ['plan', 'vendor', 'vendor.user'],
            order: { createdAt: 'DESC' },
            skip: (page - 1) * limit,
            take: limit,
        });

        const [newData, newTotal] = await this.activePlanRepository.findAndCount({
            relations: ['plan', 'vendor', 'vendor.user'],
            order: { createdAt: 'DESC' },
            skip: (page - 1) * limit,
            take: limit,
        });

        const mappedNewData = newData.map(np => ({
            id: np.id,
            status: np.status,
            startDate: np.startDate,
            endDate: np.endDate,
            amount: np.amountPaid,
            createdAt: np.createdAt,
            vendor: np.vendor,
            plan: { name: np.plan?.name || String(np.plan?.type || 'Plan'), planType: np.plan?.type },
            isNewSystem: true
        }));

        const combined = [...oldData, ...mappedNewData]
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, limit);

        return { data: combined, total: oldTotal + newTotal };
    }

    /**
     * ADMIN: Get all transactions (paginated)
     */
    async getAllTransactionsForAdmin(page = 1, limit = 20): Promise<{ data: Transaction[]; total: number }> {
        const [data, total] = await this.transactionRepository.findAndCount({
            relations: ['vendor', 'vendor.user', 'subscription', 'subscription.plan'],
            order: { createdAt: 'DESC' },
            skip: (page - 1) * limit,
            take: limit,
        });
        return { data, total };
    }

    /**
     * ADMIN: Assign a plan to a vendor manually
     */
    async assignPlanToVendor(dto: AssignPlanDto): Promise<Subscription> {
        const plan = await this.planRepository.findOne({ where: { id: dto.planId } });
        if (!plan) throw new NotFoundException('Plan not found');

        const vendor = await this.vendorRepository.findOne({ where: { id: dto.vendorId } });
        if (!vendor) throw new NotFoundException('Vendor not found');

        // Cancel existing active subscription
        await this.subscriptionRepository.update(
            { vendorId: dto.vendorId, status: SubscriptionStatus.ACTIVE },
            {
                status: SubscriptionStatus.CANCELLED,
                cancelledAt: new Date(),
                cancellationReason: 'Cancelled to assign new plan'
            }
        );

        const now = new Date();
        const endDate = new Date(now);

        // If specific duration is provided, use it (backward compatibility for admin tool)
        if (dto.durationDays) {
            endDate.setTime(now.getTime() + dto.durationDays * 24 * 60 * 60 * 1000);
        } else {
            // Otherwise use the plan's defined billing cycle for a "perfect" calendar date
            if (plan.billingCycle?.toLowerCase() === 'yearly') {
                endDate.setFullYear(endDate.getFullYear() + 1);
            } else {
                // Default to monthly (1 month from now)
                endDate.setMonth(endDate.getMonth() + 1);
            }
        }

        const subscription = this.subscriptionRepository.create({
            vendorId: dto.vendorId,
            planId: dto.planId,
            status: SubscriptionStatus.ACTIVE,
            startDate: now,
            endDate,
            amount: plan.price,
            autoRenew: false,
        });

        const savedSub = await this.subscriptionRepository.save(subscription);

        // Generate invoice number
        const invoiceNumber = `INV-ADMIN-${Date.now()}`;

        // Record transaction
        const transaction = this.transactionRepository.create({
            subscriptionId: savedSub.id,
            vendorId: dto.vendorId,
            amount: plan.price,
            status: PaymentStatus.COMPLETED,
            paidAt: now,
            gatewayTransactionId: `ADMIN-ASSIGN-${Date.now()}`,
            paymentGateway: 'Admin',
            invoiceNumber,
        });

        await this.transactionRepository.save(transaction);

        // Featured Listing Integration
        if (plan.isFeatured) {
            this.logger.log(`🌟 Admin Assigned Featured Plan. Marking all listings of vendor ${dto.vendorId} as featured.`);
            await this.listingRepo.update({ vendorId: dto.vendorId }, { isFeatured: true });
        }

        return savedSub;
    }

    /**
     * ADMIN: Cancel a subscription
     */
    async cancelSubscriptionAdmin(subscriptionId: string): Promise<Subscription> {
        const sub = await this.subscriptionRepository.findOne({ where: { id: subscriptionId } });
        if (!sub) throw new NotFoundException('Subscription not found');

        await this.subscriptionRepository.update(subscriptionId, {
            status: SubscriptionStatus.CANCELLED,
            cancelledAt: new Date(),
            cancellationReason: 'Cancelled by admin',
            autoRenew: false,
        });

        // Fetch back updated subscription with relations if needed
        const updatedSub = await this.subscriptionRepository.findOne({
            where: { id: subscriptionId },
            relations: ['plan', 'vendor']
        });

        return updatedSub;
    }

    private getCleanBaseUrl(origin?: string): string {
        const frontendUrl = this.configService.get<string>('FRONTEND_URL') || '';
        const allowedUrls = frontendUrl ? frontendUrl.split(',').map(url => url.trim()) : [];
        const rawUrl = origin || allowedUrls[0] || 'http://localhost:3000';
        
        try {
            const url = new URL(rawUrl);
            const cleanUrl = `${url.protocol}//${url.host}`;
            this.logger.log(`[getCleanBaseUrl] Raw: ${rawUrl}, Clean: ${cleanUrl}`);
            return cleanUrl;
        } catch (e) {
            this.logger.error(`[getCleanBaseUrl] Failed to parse URL: ${rawUrl}`);
            return 'http://localhost:3000';
        }
    }

    /**
     * Create a Stripe Checkout session for a vendor subscription.
     * Handles stale customer IDs gracefully by auto-recreating the Stripe customer.
     */
    async createCheckoutSession(userId: string, checkoutDto: CheckoutDto, origin?: string) {
        const vendor = await this.vendorRepository.findOne({
            where: { userId },
            relations: ['user']
        });
        if (!vendor) throw new ForbiddenException('Only vendors can subscribe');

        const plan = await this.planRepository.findOne({ where: { id: checkoutDto.planId } });
        if (!plan) throw new NotFoundException('Plan not found');

        // Free plan — no Stripe involved
        if (plan.price === 0) {
            const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
            const mockId = `MOCK-FREE-${Date.now()}`;
            // Auto-activate free plan inline
            await this.handleMockSubscriptionSuccess(vendor.id, plan.id, mockId);
            return {
                sessionId: mockId,
                checkoutUrl: null,   // null = frontend stays on page and shows success message
            };
        }

        const baseUrl = this.getCleanBaseUrl(origin);

        const apiKey = this.configService.get<string>('STRIPE_SECRET_KEY');
        if (!apiKey || apiKey === 'sk_test_your_secret_key_here') {
            throw new BadRequestException('Stripe payment gateway is not configured. Please add a valid STRIPE_SECRET_KEY.');
        }

        // ── Ensure plan has a valid Stripe Price ID (matching the current price) ────────────────
        let needsNewPrice = !plan.stripePriceId;

        if (plan.stripePriceId) {
            try {
                // Check if the price exists on Stripe and matches our current plan price
                const stripePrice = await this.stripe.prices.retrieve(plan.stripePriceId);
                const currentAmount = Math.round(Number(plan.price) * 100);

                if (stripePrice.unit_amount !== currentAmount || !stripePrice.active) {
                    this.logger.warn(`Stripe price ${plan.stripePriceId} mismatch (Active: ${stripePrice.active}, Amount: ${stripePrice.unit_amount} vs Expected: ${currentAmount}). Regenerating...`);
                    needsNewPrice = true;
                }
            } catch (err: any) {
                this.logger.error(`Failed to verify Stripe price ${plan.stripePriceId}: ${err.message}. Regenerating...`);
                needsNewPrice = true;
            }
        }

        if (needsNewPrice) {
            this.logger.log(`Syncing plan "${plan.name}" price with Stripe...`);
            const product = await this.stripe.products.create({ name: plan.name });
            const price = await this.stripe.prices.create({
                product: product.id,
                unit_amount: Math.round(Number(plan.price) * 100),
                currency: 'pkr',
                recurring: { interval: plan.billingCycle.toLowerCase() === 'yearly' ? 'year' : 'month' },
            });
            plan.stripePriceId = price.id;
            await this.planRepository.save(plan);
            this.logger.log(`Created fresh Stripe price ${price.id} for plan "${plan.name}" at PKR ${plan.price}`);
        }

        // ── Resolve Stripe Customer ID ─────────────────────────────────────
        // The stored ID may be stale (e.g., from a different Stripe account/environment).
        // Try to retrieve it first; if Stripe says it doesn't exist, create a fresh one.
        let customerId = vendor.stripeCustomerId;

        if (customerId) {
            try {
                // Synchronize customer details with Stripe
                await this.stripe.customers.update(customerId, {
                    email: vendor.businessEmail || vendor.user?.email,
                    name: vendor.businessName || vendor.user?.fullName,
                    phone: vendor.businessPhone || vendor.user?.phone || undefined,
                    address: { country: 'PK' },
                });
                this.logger.log(`Synchronized Stripe customer ${customerId} for vendor ${vendor.id}`);
            } catch (err: any) {
                if (err?.code === 'resource_missing' || err?.message?.includes('No such customer')) {
                    this.logger.warn(
                        `Stale Stripe customer ID "${customerId}" for vendor ${vendor.id} — clearing and recreating.`
                    );
                    customerId = null;
                    vendor.stripeCustomerId = null;
                    await this.vendorRepository.save(vendor);
                } else {
                    // Log but don't crash if update fails (e.g. rate limit)
                    this.logger.error(`Failed to update Stripe customer ${customerId}: ${err.message}`);
                }
            }
        }

        if (!customerId) {
            const customer = await this.stripe.customers.create({
                email: vendor.businessEmail || vendor.user?.email,
                name: vendor.businessName || vendor.user?.fullName,
                phone: vendor.businessPhone || vendor.user?.phone,
                address: {
                    country: 'PK', // Default to Pakistan
                },
                metadata: { vendorId: vendor.id },
            });
            customerId = customer.id;
            vendor.stripeCustomerId = customerId;
            await this.vendorRepository.save(vendor);
            this.logger.log(`Created new Stripe customer ${customerId} for vendor ${vendor.id}`);
        }

        // ── Create Checkout Session ────────────────────────────────────────
        const session = await this.stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            customer: customerId,
            customer_update: {
                address: 'auto',
                name: 'auto',
            },
            client_reference_id: vendor.id,
            billing_address_collection: 'required',
            phone_number_collection: { enabled: true },
            locale: 'en',
            line_items: [{ price: plan.stripePriceId, quantity: 1 }],
            mode: 'subscription',
            success_url: `${baseUrl}/subscription/success/?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${baseUrl}/subscription/?canceled=true`,
        });

        this.logger.log(`Stripe checkout session created: ${session.id} for vendor ${vendor.id}`);

        return {
            sessionId: session.id,
            checkoutUrl: session.url,
        };
    }

    /**
     * Manually verify a checkout session to handle cases where the webhook is missed
     */
    async verifyCheckoutSession(sessionId: string, userId: string) {
        try {
            if (sessionId.startsWith('MOCK-')) {
                const existingTransaction = await this.transactionRepository.findOne({
                    where: { gatewayTransactionId: sessionId },
                    relations: ['subscription', 'subscription.plan']
                });

                if (existingTransaction) {
                    return {
                        success: true,
                        alreadyProcessed: true,
                        planName: existingTransaction.subscription?.plan?.name || 'Premium Plan',
                        planType: existingTransaction.subscription?.plan?.planType,
                        amount: existingTransaction.amount,
                        endDate: existingTransaction.subscription?.endDate,
                        transactionId: existingTransaction.id
                    };
                }

                const existingActivePlan = await this.activePlanRepository.findOne({
                    where: { transactionId: sessionId },
                    relations: ['plan']
                });

                if (existingActivePlan) {
                    const transaction = await this.transactionRepository.findOne({
                        where: { gatewayTransactionId: sessionId }
                    });
                    
                    return {
                        success: true,
                        alreadyProcessed: true,
                        planName: existingActivePlan.plan?.name || 'Premium Plan',
                        type: existingActivePlan.plan?.type || 'plan',
                        amount: existingActivePlan.amountPaid,
                        endDate: existingActivePlan.endDate,
                        transactionId: transaction?.id
                    };
                }
                
                throw new NotFoundException('Mock transaction not found');
            }

            const session = await this.stripe.checkout.sessions.retrieve(sessionId);

            if (session.payment_status === 'paid') {
                // Check if we already processed it as a Subscription
                const existingTransaction = await this.transactionRepository.findOne({
                    where: { gatewayTransactionId: session.id },
                    relations: ['subscription', 'subscription.plan']
                });

                if (existingTransaction) {
                    return {
                        success: true,
                        alreadyProcessed: true,
                        planName: existingTransaction.subscription?.plan?.name || 'Premium Plan',
                        planType: existingTransaction.subscription?.plan?.planType,
                        amount: existingTransaction.amount,
                        endDate: existingTransaction.subscription?.endDate,
                        transactionId: existingTransaction.id
                    };
                }

                // Check if we already processed it as an ActivePlan (New System)
                const existingActivePlan = await this.activePlanRepository.findOne({
                    where: { transactionId: session.id },
                    relations: ['plan']
                });

                if (existingActivePlan) {
                    // Find the transaction record
                    const transaction = await this.transactionRepository.findOne({
                        where: { gatewayTransactionId: session.id }
                    });
                    
                    return {
                        success: true,
                        alreadyProcessed: true,
                        planName: existingActivePlan.plan?.name || 'Premium Plan',
                        type: existingActivePlan.plan?.type || 'plan',
                        amount: existingActivePlan.amountPaid,
                        endDate: existingActivePlan.endDate,
                        transactionId: transaction?.id
                    };
                }

                if (session.mode === 'subscription') {
                    const vendorId = session.client_reference_id;
                    if (session.subscription && vendorId) {
                        const subscription = await this.stripe.subscriptions.retrieve(session.subscription as string);
                        const priceId = subscription.items.data[0].price.id;

                        const plan = await this.planRepository.findOne({ where: { stripePriceId: priceId } });
                        if (plan) {
                            const sub = await this.processSubscriptionSuccess(vendorId, plan.id, session.id, 'Stripe');
                            // Find the newly created transaction
                            const transaction = await this.transactionRepository.findOne({
                                where: { gatewayTransactionId: session.id }
                            });
                            
                            return {
                                success: true,
                                planName: plan.name,
                                planType: plan.planType,
                                amount: plan.price,
                                endDate: sub.endDate,
                                transactionId: transaction?.id
                            };
                        }
                    }
                }

                if (session.metadata?.planId) {
                    const vendorId = session.client_reference_id;
                    const { planId, targetId } = session.metadata;
                    if (vendorId && planId) {
                        const activePlan = await this.processActivePlanSuccess(vendorId, planId, session.id, 'Stripe', targetId);
                        // Find the newly created transaction
                        const transaction = await this.transactionRepository.findOne({
                            where: { gatewayTransactionId: session.id }
                        });
                        
                        return {
                            success: true,
                            type: activePlan.plan?.type || 'plan',
                            planName: activePlan.plan?.name || 'Active Plan',
                            endDate: activePlan.endDate,
                            amount: activePlan.amountPaid,
                            transactionId: transaction?.id
                        };
                    }
                }
            }
            return { success: false, status: session.payment_status };
        } catch (error) {
            this.logger.error(`Failed to verify checkout session ${sessionId}: ${error.message}`);
            throw new BadRequestException(`Verification failed: ${error.message}`);
        }
    }

    /**
     * Core logic to activate a subscription and record a transaction (invoice).
     * Used by mock success, admin assignment, and Stripe webhooks.
     */
    async processSubscriptionSuccess(
        vendorId: string,
        planId: string,
        gatewayTransactionId: string,
        gateway: 'Stripe' | 'Mock' | 'Admin',
        amount?: number
    ): Promise<Subscription> {
        // Idempotency check: Don't process the same transaction twice
        const existingTrans = await this.transactionRepository.findOne({
            where: { gatewayTransactionId },
            relations: ['subscription', 'subscription.plan']
        });

        if (existingTrans && existingTrans.subscription) {
            this.logger.log(`[processSubscriptionSuccess] Transaction ${gatewayTransactionId} already processed. Returning existing sub.`);
            return existingTrans.subscription;
        }

        const plan = await this.planRepository.findOne({ where: { id: planId } });
        if (!plan) throw new NotFoundException('Plan not found');

        const vendor = await this.vendorRepository.findOne({ where: { id: vendorId } });
        if (!vendor) throw new NotFoundException('Vendor not found');

        // Check for an existing ACTIVE subscription of the SAME plan to extend it (RECHARGE)
        const activeSub = await this.subscriptionRepository.findOne({
            where: { vendorId: vendor.id, status: SubscriptionStatus.ACTIVE, planId: planId },
            relations: ['plan']
        });

        const now = new Date();
        let savedSub: Subscription;

        if (activeSub) {
            this.logger.log(`🔄 Extending existing active "${activeSub.plan.name}" plan for vendor ${vendor.id}`);

            // "Perfectly" extend the existing plan (recharge)
            const currentEndDate = new Date(activeSub.endDate);
            // If the plan is still active and valid, start adding from the current end date.
            // If current end date is in the past, start from "now".
            const baseDate = currentEndDate > now ? currentEndDate : now;
            const newEndDate = new Date(baseDate);

            if (plan.billingCycle?.toLowerCase() === 'yearly') {
                newEndDate.setFullYear(newEndDate.getFullYear() + 1);
            } else {
                // Default to monthly - adds exactly one calendar month from expiration
                newEndDate.setMonth(newEndDate.getMonth() + 1);
            }

            activeSub.endDate = newEndDate;
            activeSub.amount = amount ?? plan.price;
            activeSub.autoRenew = gateway === 'Stripe';
            savedSub = await this.subscriptionRepository.save(activeSub);
        } else {
            // New subscription or switching plans - cancel ALL previous active ones (both systems)
            await Promise.all([
                this.subscriptionRepository.update(
                    { vendorId: vendor.id, status: SubscriptionStatus.ACTIVE },
                    { status: SubscriptionStatus.CANCELLED, cancelledAt: now }
                ),
                this.activePlanRepository.update(
                    { vendorId: vendor.id, status: ActivePlanStatus.ACTIVE },
                    { status: ActivePlanStatus.CANCELLED }
                )
            ]);

            // Calculate "perfect" end date for new plan
            const endDate = new Date(now);
            if (plan.billingCycle?.toLowerCase() === 'yearly') {
                endDate.setFullYear(endDate.getFullYear() + 1);
            } else {
                endDate.setMonth(endDate.getMonth() + 1);
            }

            // Create new Subscription record
            const subscription = this.subscriptionRepository.create({
                vendorId: vendor.id,
                planId,
                status: SubscriptionStatus.ACTIVE,
                startDate: now,
                endDate,
                amount: amount ?? plan.price,
                autoRenew: gateway === 'Stripe', // Auto-renew only for Stripe
            });

            savedSub = await this.subscriptionRepository.save(subscription);
        }

        // 3. Generate Invoice Number
        const prefix = gateway === 'Stripe' ? 'ST' : gateway === 'Admin' ? 'AD' : 'MC';
        const invoiceNumber = gateway === 'Stripe'
            ? `INV-${prefix}-${gatewayTransactionId.slice(-30)}`
            : `INV-${prefix}-${Date.now().toString().slice(-8)}`;

        // 4. Record Transaction (Invoice)
        try {
            const transaction = this.transactionRepository.create({
                subscriptionId: savedSub.id,
                vendorId: vendor.id,
                amount: amount ?? plan.price,
                status: PaymentStatus.COMPLETED,
                paidAt: now,
                gatewayTransactionId,
                paymentGateway: gateway,
                invoiceNumber,
            });

            await this.transactionRepository.save(transaction);
        } catch (err) {
            if (err.message.includes('unique constraint') || err.code === '23505') {
                this.logger.log(`[processSubscriptionSuccess] Concurrency: Transaction ${gatewayTransactionId} already created by another process.`);
                // sub is already saved in this case because it's non-unique, but transaction failed.
                // we return the existing sub
                return savedSub;
            }
            throw err;
        }

        // 5. Affiliate Integration - AUTOMATED
        try {
            await this.affiliateService.processSuccessfulReferral(vendor.userId, amount ?? plan.price);
        } catch (err) {
            this.logger.error(`Failed to process referral for user ${vendor.userId}: ${err.message}`);
        }


        // 6. Featured Listing Integration - AUTOMATED
        if (plan.isFeatured) {
            this.logger.log(`🌟 Plan is Featured. Marking all listings of vendor ${vendor.id} as featured.`);
            await this.listingRepo.update({ vendorId: vendor.id }, { isFeatured: true });
        }

        this.logger.log(`✅ Subscription [${savedSub.id}] activated/extended for vendor [${vendor.id}] via ${gateway} until ${savedSub.endDate.toDateString()}`);

        // Notify vendor via real-time socket
        try {
            this.notificationsGateway.sendToUser(vendor.userId, 'subscription_updated', {
                type: 'subscription',
                planId: planId,
                status: 'active'
            });
        } catch (err) {
            this.logger.warn(`Failed to send real-time notification to user ${vendor.userId}: ${err.message}`);
        }

        return savedSub;
    }

    /**
     * Handle Mock Subscription Success (Legacy/Testing)
     */
    async handleMockSubscriptionSuccess(vendorIdOrUserId: string, planId: string, mockSessionId: string) {
        let vendor = await this.vendorRepository.findOne({ where: { id: vendorIdOrUserId } });
        if (!vendor) {
            vendor = await this.vendorRepository.findOne({ where: { userId: vendorIdOrUserId } });
        }
        if (!vendor) throw new NotFoundException('Vendor not found');

        return this.processSubscriptionSuccess(vendor.id, planId, mockSessionId, 'Mock');
    }

    /**
     * Get active subscription for vendor (supports both old and new system)
     * Checks both the old and new system and normalizes the response.
     */
    async getActiveSubscription(userId: string): Promise<any> {
        const vendor = await this.vendorRepository.findOne({ where: { userId } });
        if (!vendor) return null;

        let result: any = null;
        let isNewSystem = false;

        const now = new Date();

        // 1. Fetch from BOTH PricingPlan system (ActivePlan) and old Subscription system
        // We look for plans that are CURRENTLY active (now is between start and end)
        const [activeNewPlan, activeOldSub] = await Promise.all([
            this.activePlanRepository.findOne({
                where: {
                    vendorId: vendor.id,
                    status: ActivePlanStatus.ACTIVE,
                    startDate: LessThanOrEqual(now),
                    endDate: MoreThan(now)
                },
                relations: ['plan'],
                order: { startDate: 'DESC' }
            }),
            this.subscriptionRepository.findOne({
                where: {
                    vendorId: vendor.id,
                    status: SubscriptionStatus.ACTIVE,
                    startDate: LessThanOrEqual(now),
                    endDate: MoreThan(now)
                },
                relations: ['plan'],
                order: { startDate: 'DESC' }
            })
        ]);

        // 2. If no currently active plan, find the "Next" upcoming plan
        // BUT, we only use this if we don't want to fallback to Free yet.
        // Actually, it's better to show 'Free' if you are currently in a gap.
        let upcomingPlan: any = null;
        if (!activeNewPlan && !activeOldSub) {
             upcomingPlan = await this.activePlanRepository.findOne({
                where: {
                    vendorId: vendor.id,
                    status: ActivePlanStatus.ACTIVE,
                    startDate: MoreThan(now)
                },
                relations: ['plan'],
                order: { startDate: 'ASC' }
            });
        }

        // 2. Decide which one is definitively the "current" active plan
        if (activeNewPlan && activeOldSub) {
            const newStart = new Date(activeNewPlan.startDate).getTime();
            const oldStart = new Date(activeOldSub.startDate).getTime();
            if (newStart >= oldStart) {
                result = activeNewPlan;
                isNewSystem = true;
            } else {
                result = activeOldSub;
                isNewSystem = false;
            }
        } else if (activeNewPlan) {
            result = activeNewPlan;
            isNewSystem = true;
        } else if (activeOldSub) {
            result = activeOldSub;
            isNewSystem = false;
        }

        // 3. FALLBACK: If no CURRENT active subscription, check for Upcoming or assign Free
        if (!result) {
            // Check upcoming first
            const upcomingPlan = await this.activePlanRepository.findOne({
                where: {
                    vendorId: vendor.id,
                    status: ActivePlanStatus.ACTIVE,
                    startDate: MoreThan(now)
                },
                relations: ['plan'],
                order: { startDate: 'ASC' }
            });

            if (upcomingPlan) {
                // If there's an upcoming plan, we STILL need a Free plan for the gap
                // But we'll return the Free plan as 'result' and maybe info about upcoming
                this.logger.log(`[getActiveSubscription] Vendor ${vendor.id} has upcoming plan ${upcomingPlan.id}. Assigning Free plan for the gap.`);
            }

            // Fallback to Free Plan (Try New System first, then Old System)
            let freePlan = await this.pricingPlanRepository.findOne({
                where: { name: 'Free', type: PricingPlanType.SUBSCRIPTION }
            });

            if (freePlan) {
                try {
                    // Create/Update absolute Free Plan in New System
                    const endDate = new Date(now.getTime() + 3650 * 24 * 60 * 60 * 1000);
                    const activePlan = this.activePlanRepository.create({
                        vendorId: vendor.id,
                        planId: freePlan.id,
                        status: ActivePlanStatus.ACTIVE,
                        startDate: now,
                        endDate: endDate,
                        amountPaid: 0,
                    });
                    result = await this.activePlanRepository.save(activePlan);
                    isNewSystem = true;
                } catch (err) {
                    this.logger.error(`Failed to auto-assign new system Free plan: ${err.message}`);
                }
            }
            
            if (!result) {
                // Fallback to Old System Free Plan
                const oldFreePlan = await this.planRepository.findOne({
                    where: { name: 'Free' }
                });
                
                if (oldFreePlan) {
                    this.logger.log(`[getActiveSubscription] New system Free plan not found. Using Old System Free plan for vendor ${vendor.id}.`);
                    // We can either return it directly or create a dummy sub. 
                    // Returning directly is safer for read-only check.
                    result = {
                        vendorId: vendor.id,
                        planId: oldFreePlan.id,
                        status: SubscriptionStatus.ACTIVE,
                        startDate: now,
                        endDate: new Date(now.getTime() + 3650 * 24 * 60 * 60 * 1000),
                        amount: 0,
                        plan: oldFreePlan
                    };
                    isNewSystem = false;
                }
            }
        }

        if (!result) return null;
        return this.normalizeSubOrActivePlan(result, isNewSystem);
    }

    /**
     * Internal helper to normalize either Subscription (old) or ActivePlan (new) 
     * into a consistent shape for the Sidebar and other frontend components.
     */
    public normalizeSubOrActivePlan(result: any, isNewSystem: boolean) {
        if (!result) return null;

        const plan = result.plan ? {
            ...result.plan,
            planType: isNewSystem
                ? (['free', 'basic', 'premium', 'enterprise'].includes(result.plan.name?.toLowerCase())
                    ? result.plan.name.toLowerCase()
                    : (result.plan.type === PricingPlanType.SUBSCRIPTION ? 'premium' : result.plan.type))
                : result.plan.planType,
            // Harmonize features into dashboardFeatures
            dashboardFeatures: isNewSystem
                ? {
                    showAnalytics: !!result.plan.features?.showAnalytics,
                    showLeads: !!result.plan.features?.showLeads,
                    showOffers: !!result.plan.features?.maxOffers || !!result.plan.features?.maxEvents || !!result.plan.features?.showOffers,
                    showDemand: !!result.plan.features?.showDemand,
                    showQueries: !!result.plan.features?.showQueries,
                    showReviews: !!result.plan.features?.showReviews,
                    showChat: !!result.plan.features?.showChat,
                    showBroadcast: !!result.plan.features?.showBroadcast,
                    canRespondBroadcast:
                        result.plan.features?.canRespondBroadcast !== undefined
                            ? !!result.plan.features.canRespondBroadcast
                            : result.plan.name?.toLowerCase() !== 'free',
                    canReplyReviews:
                        result.plan.features?.canReplyReviews !== undefined
                            ? !!result.plan.features.canReplyReviews
                            : result.plan.name?.toLowerCase() !== 'free',
                    showSaved: true,
                    showFollowing: true,
                    showListings: true,
                    canAddListing: (result.plan.features?.maxListings || 0) > 0,
                    ...result.plan.features
                }
                : {
                    showAnalytics: !!result.plan.dashboardFeatures?.showAnalytics,
                    showLeads: !!result.plan.dashboardFeatures?.showLeads,
                    showOffers: !!result.plan.dashboardFeatures?.showOffers || !!result.plan.dashboardFeatures?.maxOffers,
                    showDemand: !!result.plan.dashboardFeatures?.showDemand,
                    showQueries: !!result.plan.dashboardFeatures?.showQueries,
                    showReviews: !!result.plan.dashboardFeatures?.showReviews,
                    showChat: !!result.plan.dashboardFeatures?.showChat,
                    showBroadcast: !!result.plan.dashboardFeatures?.showBroadcast,
                    canRespondBroadcast:
                        result.plan.dashboardFeatures?.canRespondBroadcast !== undefined
                            ? !!result.plan.dashboardFeatures.canRespondBroadcast
                            : result.plan.planType !== 'free' && Number(result.plan.price) > 0,
                    canReplyReviews:
                        result.plan.dashboardFeatures?.canReplyReviews !== undefined
                            ? !!result.plan.dashboardFeatures.canReplyReviews
                            : result.plan.planType !== 'free' && Number(result.plan.price) > 0,
                    showSaved: true,
                    showFollowing: true,
                    showListings: true,
                    canAddListing: true,
                    ...(result.plan.dashboardFeatures || {})
                }
        } : null;

        return {
            ...result,
            amount: isNewSystem ? result.amountPaid : result.amount,
            endDate: result.endDate,
            isNewSystem,
            plan
        };
    }

    /**
     * Get all available pricing plans of a specific type (Client)
     */
    async getPricingPlans(type?: PricingPlanType): Promise<PricingPlan[]> {
        const where: any = { isActive: true };
        if (type) where.type = type;
        return this.pricingPlanRepository.find({ where, order: { price: 'ASC' } });
    }

    /**
     * Create a Stripe Checkout session for a new PricingPlan (Subscription or Boost)
     */
    async createPricingCheckoutSession(userId: string, planId: string, targetId?: string, origin?: string) {
        const vendor = await this.vendorRepository.findOne({
            where: { userId },
            relations: ['user']
        });
        if (!vendor) throw new ForbiddenException('Only vendors can purchase plans');

        const plan = await this.pricingPlanRepository.findOne({ where: { id: planId } });
        if (!plan) throw new NotFoundException('Plan not found');

        // Free plan - instant activation
        if (plan.price <= 0) {
            await this.processActivePlanSuccess(vendor.id, plan.id, `FREE-${Date.now()}`, 'Mock', targetId);
            return { sessionId: 'FREE', checkoutUrl: null };
        }

        const baseUrl = this.getCleanBaseUrl(origin);

        // Ensure Stripe Price exists
        if (!plan.stripePriceId) {
            const product = await this.stripe.products.create({
                name: plan.name,
                metadata: { type: plan.type }
            });
            const price = await this.stripe.prices.create({
                product: product.id,
                unit_amount: Math.round(Number(plan.price) * 100),
                currency: 'pkr',
                recurring: plan.type === PricingPlanType.SUBSCRIPTION ? {
                    interval: plan.unit === PricingPlanUnit.YEARS ? 'year' : 'month'
                } : undefined,
            });
            plan.stripePriceId = price.id;
            await this.pricingPlanRepository.save(plan);
        }

        // ── Resolve Stripe Customer ID ─────────────────────────────────────
        let customerId = vendor.stripeCustomerId;

        if (customerId) {
            try {
                // Synchronize customer details with Stripe
                await this.stripe.customers.update(customerId, {
                    email: vendor.businessEmail || vendor.user?.email,
                    name: vendor.businessName || vendor.user?.fullName,
                    phone: vendor.businessPhone || vendor.user?.phone || undefined,
                    address: { country: 'PK' },
                });
                this.logger.log(`Synchronized Stripe customer ${customerId} for vendor ${vendor.id}`);
            } catch (err: any) {
                if (err?.code === 'resource_missing' || err?.message?.includes('No such customer')) {
                    this.logger.warn(`Stale Stripe customer ID "${customerId}" — clearing and recreating.`);
                    customerId = null;
                    vendor.stripeCustomerId = null;
                    await this.vendorRepository.save(vendor);
                } else {
                    this.logger.error(`Failed to update Stripe customer ${customerId}: ${err.message}`);
                }
            }
        }

        if (!customerId) {
            const customer = await this.stripe.customers.create({
                email: vendor.businessEmail || vendor.user?.email,
                name: vendor.businessName || vendor.user?.fullName,
                phone: vendor.businessPhone || vendor.user?.phone || undefined,
                address: { country: 'PK' },
                metadata: { vendorId: vendor.id },
            });
            customerId = customer.id;
            vendor.stripeCustomerId = customerId;
            await this.vendorRepository.save(vendor);
            this.logger.log(`Created new Stripe customer ${customerId} for vendor ${vendor.id}`);
        }

        const sessionParams: Stripe.Checkout.SessionCreateParams = {
            payment_method_types: ['card'],
            customer: customerId,
            client_reference_id: vendor.id,
            metadata: {
                planId: plan.id,
                targetId: targetId || '',
                type: plan.type
            },
            line_items: [{ price: plan.stripePriceId, quantity: 1 }],
            mode: plan.type === PricingPlanType.SUBSCRIPTION ? 'subscription' : 'payment',
            success_url: `${baseUrl}/subscription/success/?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${baseUrl}/subscription?canceled=true`,
        };

        const session = await this.stripe.checkout.sessions.create(sessionParams);

        return {
            sessionId: session.id,
            checkoutUrl: session.url,
        };
    }

    /**
     * Process successful purchase of a new PricingPlan
     */
    async processActivePlanSuccess(
        vendorId: string,
        planId: string,
        gatewayTransactionId: string,
        gateway: string,
        targetId?: string
    ): Promise<ActivePlan> {
        // Idempotency check: Don't process the same transaction twice
        const existingPlan = await this.activePlanRepository.findOne({
            where: { transactionId: gatewayTransactionId },
            relations: ['plan']
        });

        if (existingPlan) {
            this.logger.log(`[processActivePlanSuccess] Transaction ${gatewayTransactionId} already processed. Returning existing plan.`);
            return existingPlan;
        }

        const plan = await this.pricingPlanRepository.findOne({ where: { id: planId } });
        if (!plan) throw new NotFoundException('Plan not found');

        const now = new Date();
        let startDate = now;

        // Check for existing ACTIVE plan of the same type to support "Extension/Stacking"
        // This handles the requirement: "if vendor purchase a plan plan will we active in next month"
        const existingActivePlan = await this.activePlanRepository.findOne({
            where: {
                vendorId,
                status: ActivePlanStatus.ACTIVE,
                targetId: targetId || IsNull()
            },
            relations: ['plan'],
            order: { endDate: 'DESC' }
        });

        // If an active plan exists of the SAME TYPE, extend it
        // CRITICAL: We only extend PAID plans. If the current plan is FREE, start the new plan NOW.
        const isFreePlan = existingActivePlan?.plan?.price <= 0 || existingActivePlan?.plan?.name?.toLowerCase() === 'free';
        
        if (existingActivePlan && existingActivePlan.plan?.type === plan.type && !isFreePlan) {
            // Only extend if it's not already expired
            if (new Date(existingActivePlan.endDate) > now) {
                startDate = new Date(existingActivePlan.endDate);
                this.logger.log(`🔄 Extending existing paid plan. New StartDate: ${startDate}`);
            }
        }

        const endDate = new Date(startDate);

        // Calculate end date from the startDate (which might be in the future)
        switch (plan.unit) {
            case PricingPlanUnit.MINUTES: endDate.setMinutes(endDate.getMinutes() + plan.duration); break;
            case PricingPlanUnit.HOURS: endDate.setHours(endDate.getHours() + plan.duration); break;
            case PricingPlanUnit.DAYS: endDate.setDate(endDate.getDate() + plan.duration); break;
            case PricingPlanUnit.MONTHS: endDate.setMonth(endDate.getMonth() + plan.duration); break;
            case PricingPlanUnit.YEARS: endDate.setFullYear(endDate.getFullYear() + plan.duration); break;
        }

        // Only deactivate if it's a DIFFERENT plan category or the user explicitly chose an upgrade
        if (plan.type === PricingPlanType.SUBSCRIPTION && (!existingActivePlan || existingActivePlan.plan?.type !== plan.type)) {
            await Promise.all([
                this.activePlanRepository.update(
                    { vendorId, status: ActivePlanStatus.ACTIVE, plan: { type: PricingPlanType.SUBSCRIPTION } as any },
                    { status: ActivePlanStatus.CANCELLED }
                ),
                this.subscriptionRepository.update(
                    { vendorId, status: SubscriptionStatus.ACTIVE },
                    { status: SubscriptionStatus.CANCELLED, cancelledAt: now }
                )
            ]);
        }

        const activePlan = this.activePlanRepository.create({
            vendorId,
            planId,
            targetId,
            status: ActivePlanStatus.ACTIVE,
            startDate,
            endDate,
            amountPaid: plan.price,
            transactionId: gatewayTransactionId,
        });

        const saved = await this.activePlanRepository.save(activePlan);

        // Sync flags if needed (featured/boosted)
        if (targetId) {
            if (plan.type === PricingPlanType.HOMEPAGE_FEATURED || plan.type === PricingPlanType.CATEGORY_FEATURED) {
                await this.listingRepo.update(targetId, { isFeatured: true });
            } else if (plan.type === PricingPlanType.LISTING_BOOST) {
                await this.listingRepo.update(targetId, { isSponsored: true });
            }
        } else if (plan.type === PricingPlanType.SUBSCRIPTION && (plan.features as any)?.isFeatured) {
            // Global featured status for all listings
            this.logger.log(`🌟 PricingPlan [${plan.name}] is Featured globally. Marking all listings of vendor ${vendorId} as featured.`);
            await this.listingRepo.update({ vendorId }, { isFeatured: true });
        }

        // 4. Record Transaction (Invoice)
        try {
            const transaction = this.transactionRepository.create({
                vendorId,
                amount: plan.price,
                status: PaymentStatus.COMPLETED,
                paidAt: now,
                gatewayTransactionId,
                paymentGateway: gateway,
                // Stripe invoice becomes deterministic to prevent double entry via standard DB unique constraint
                // We use a safe slice to ensure it fits in VARCHAR(50) if DB hasn't synced yet
                invoiceNumber: gateway === 'Stripe'
                    ? `INV-ST-${gatewayTransactionId.slice(-30)}`
                    : `INV-${plan.type.toUpperCase().slice(0, 5)}-${Date.now().toString().slice(-6)}`,
            });
            await this.transactionRepository.save(transaction);
        } catch (err) {
            if (err.message.includes('unique constraint') || err.code === '23505') {
                this.logger.log(`[processActivePlanSuccess] Concurrency: Transaction ${gatewayTransactionId} already created by another process.`);
                return saved;
            }
            throw err;
        }

        // 5. Affiliate Integration - AUTOMATED
        if (plan.type === PricingPlanType.SUBSCRIPTION) {
            try {
                const vendorUser = await this.userRepository.findOne({ where: { id: vendorId } });
                const paidAmount = plan.price;
                if (vendorUser) {
                    await this.affiliateService.processSuccessfulReferral(vendorUser.id, paidAmount);
                } else {
                    // Try to get from vendor relation
                    const vendorWithUser = await this.vendorRepository.findOne({
                        where: { id: vendorId },
                        relations: ['user']
                    });
                    if (vendorWithUser?.user) {
                        await this.affiliateService.processSuccessfulReferral(vendorWithUser.user.id, paidAmount);
                    }
                }
            } catch (err) {
                this.logger.error(`Failed to process referral for vendor ${vendorId} in active plan: ${err.message}`);
            }
        }

        // Notify vendor via real-time socket
        try {
            const vendor = await this.vendorRepository.findOne({ where: { id: vendorId } });
            if (vendor) {
                this.notificationsGateway.sendToUser(vendor.userId, 'subscription_updated', {
                    type: plan.type,
                    planId: planId,
                    status: 'active'
                });
            }
        } catch (err) {
            this.logger.warn(`Failed to send real-time notification to user ${vendorId}: ${err.message}`);
        }

        return saved;
    }

    /**
     * Check if a vendor can perform an action based on their current plan limits
     */
    async canPerformAction(userId: string, feature: string): Promise<boolean> {
        const activeSub = await this.getActiveSubscription(userId);
        if (!activeSub) return false;

        const features = (activeSub as any).plan?.features || (activeSub as any).plan?.dashboardFeatures || {};
        const limit = features[feature];

        if (limit === true) return true;

        // Add other numeric limit checks (maxOffers, etc.) as needed as they arise 
        // For now, we are removing the maxListings capacity limit as per the requirement

        return false;

        return false;
    }

    /**
     * Get transaction history for vendor (invoices)
     */
    async getTransactions(userId: string) {
        const vendor = await this.vendorRepository.findOne({ where: { userId } });
        if (!vendor) throw new ForbiddenException('Vendor not found');

        return this.transactionRepository.find({
            where: { vendorId: vendor.id },
            relations: ['subscription', 'subscription.plan'],
            order: { createdAt: 'DESC' },
        });
    }

    /**
     * Get all active promotions for a vendor (Business Plans, Offer/Event Boosts)
     */
    async getActivePromotions(userId: string) {
        const vendor = await this.vendorRepository.findOne({ where: { userId } });
        if (!vendor) throw new ForbiddenException('Vendor not found');
        const now = new Date();

        // 1. Get active feature plans (Featured Listing, Homepage, etc.)
        const activePlans = await this.activePlanRepository.find({
            where: {
                vendorId: vendor.id,
                status: ActivePlanStatus.ACTIVE,
                endDate: MoreThan(now),
            },
            relations: ['plan'],
            order: { endDate: 'ASC' },
        });

        // 2. Get active featured deals
        const featuredDeals = await this.dealRepository.find({
            where: {
                vendorId: vendor.id,
                isFeatured: true,
                featuredUntil: MoreThan(now),
            },
            relations: ['business'],
            order: { featuredUntil: 'ASC' },
        });

        // 2b. Get active featured events
        const featuredEvents = await this.eventRepository.find({
            where: {
                vendorId: vendor.id,
                isFeatured: true,
                featuredUntil: MoreThan(now),
            },
            relations: ['business'],
            order: { featuredUntil: 'ASC' },
        });

        // 3. Get dynamic promotion bookings
        const dynamicBookings = await this.promotionsService.getActiveBookingsByVendor(vendor.id);

        return {
            plans: activePlans.map(p => ({
                id: p.id,
                name: p.plan?.name || 'Boost Plan',
                type: p.plan?.type || 'UNKNOWN',
                startDate: p.startDate,
                endDate: p.endDate,
                status: p.status,
                target: p.targetId ? 'Boosted Item' : 'Listing Feature',
            })),
            boosts: [
                ...featuredDeals.map(d => ({
                    id: d.id,
                    name: 'Feature DEAL',
                    title: d.title || 'Untitled Deal',
                    business: d.business?.title || 'Unknown Business',
                    startDate: d.startDate,
                    endDate: d.featuredUntil,
                    type: 'offer',
                    target: d.title || 'Untitled Deal',
                })),
                ...featuredEvents.map(e => ({
                    id: e.id,
                    name: 'Feature EVENT',
                    title: e.title || 'Untitled Event',
                    business: e.business?.title || 'Unknown Business',
                    startDate: e.startDate,
                    endDate: e.featuredUntil,
                    type: 'event',
                    target: e.title || 'Untitled Event',
                })),
            ],
            dynamicBookings: dynamicBookings.map(b => {
                const title = b.deal?.title || b.event?.title || b.offerEvent?.title || 'Untitled Item';
                const businessTitle = b.deal?.business?.title || b.event?.business?.title || b.offerEvent?.business?.title || 'Unknown Business';
                return {
                    id: b.id,
                    name: `Promotion for ${title}`,
                    title: title,
                    business: businessTitle,
                    placements: b.placements || [],
                    startDate: b.startTime,
                    endDate: b.endTime,
                    status: b.status,
                    totalPrice: b.totalPrice || 0,
                };
            }),
        };
    }

    /**
     * Get single invoice/transaction detail (Vendor sees own, Admin sees all)
     */
    async getInvoiceDetail(transactionId: string, user: User) {
        let transaction: Transaction;
        let vendor: Vendor;

        if (user.role === UserRole.ADMIN || user.role === UserRole.SUPERADMIN) {
            // Admin can see any transaction
            transaction = await this.transactionRepository.findOne({
                where: { id: transactionId },
                relations: ['subscription', 'subscription.plan', 'vendor', 'vendor.user'],
            });
            if (!transaction) throw new NotFoundException('Invoice not found');
            vendor = transaction.vendor;
        } else {
            // Vendor can only see their own
            vendor = await this.vendorRepository.findOne({
                where: { userId: user.id },
                relations: ['user'],
            });
            if (!vendor) throw new ForbiddenException('Vendor not found');

            transaction = await this.transactionRepository.findOne({
                where: { id: transactionId, vendorId: vendor.id },
                relations: ['subscription', 'subscription.plan'],
            });
            if (!transaction) throw new NotFoundException('Invoice not found');
        }

        const vendorUser = vendor?.user || transaction?.vendor?.user;

        return {
            transaction,
            vendor: {
                businessName: vendor?.businessName,
                businessEmail: vendor?.businessEmail,
                businessPhone: vendor?.businessPhone,
                ntnNumber: vendor?.ntnNumber,
                gstNumber: vendor?.gstNumber,
            },
            user: {
                fullName: vendorUser?.fullName,
                email: vendorUser?.email,
                phone: vendorUser?.phone,
            },
        };
    }

    /**
     * Vendor: Change (Upgrade/Downgrade) Subscription Plan
     */
    async changeSubscription(userId: string, planId: string, origin?: string) {
        // For a production-ready flow, we simply initiate a new checkout session.
        // The webhook will handle cancelling the previous one upon successful payment.
        return this.createCheckoutSession(userId, { planId }, origin);
    }

    /**
     * Handle Stripe Webhooks
     */
    async handleStripeWebhook(signature: string, payload: Buffer) {
        let event: Stripe.Event;
        const webhookSecret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET');

        if (!webhookSecret || webhookSecret === 'whsec_your_webhook_secret_here') {
            this.logger.error('❌ STRIPE_WEBHOOK_SECRET is not configured or is using placeholder. Webhook verification will fail.');
        }

        try {
            event = this.stripe.webhooks.constructEvent(
                payload,
                signature,
                webhookSecret || ''
            );
            this.logger.log(`✅ Webhook verified successfully. Event type: ${event.type}`);
        } catch (err: any) {
            this.logger.error(`❌ Webhook signature verification failed: ${err.message}`);
            // In development, you might want to log the payload or signature for debugging
            // but NEVER in production for security reasons.
            throw new BadRequestException(`Webhook Error: ${err.message}`);
        }

        this.logger.log(`📦 Processing Stripe event: ${event.id} [${event.type}]`);

        switch (event.type) {
            case 'checkout.session.completed': {
                const session = event.data.object as Stripe.Checkout.Session;
                this.logger.log(`💳 Checkout session completed: ${session.id} for customer: ${session.customer}`);

                // --- NEW SYSTEM (ActivePlan / PricingPlan) ---
                if (session.metadata?.planId) {
                    const vendorId = session.client_reference_id;
                    const { planId, targetId } = session.metadata;
                    this.logger.log(`🚀 Activating new-style plan: ${planId} for vendor: ${vendorId}`);
                    await this.processActivePlanSuccess(vendorId, planId, session.id, 'Stripe', targetId);
                    return { received: true };
                }

                // --- NEW SYSTEM (Promotion Booking / Boost) ---
                if (session.metadata?.type === 'promotion_booking' && session.metadata?.bookingId) {
                    const bookingId = session.metadata.bookingId;
                    this.logger.log(`🚀 Activating Promotion Booking: ${bookingId}`);
                    await this.promotionsService.activateBooking(bookingId, session.id);
                    return { received: true };
                }

                // --- OLD SYSTEM (FALLBACK) ---
                if (session.mode === 'subscription') {
                    const vendorId = session.client_reference_id;
                    if (session.subscription && vendorId) {
                        const subscription = await this.stripe.subscriptions.retrieve(session.subscription as string);
                        const priceId = subscription.items.data[0].price.id;

                        const plan = await this.planRepository.findOne({ where: { stripePriceId: priceId } });
                        if (plan) {
                            await this.processSubscriptionSuccess(vendorId, plan.id, session.id, 'Stripe');
                        }
                    }
                }
                break;
            }

            case 'invoice.paid': {
                const invoice = event.data.object as any;
                this.logger.log(` Invoice paid: ${invoice.id} for customer: ${invoice.customer} [Reason: ${invoice.billing_reason}]`);

                // 1. Skip the initial subscription creation invoice (it's handled by checkout.session.completed)
                // This prevents the "2 Invoices / 2 Months" bug where a new sub gets processed twice.
                if (invoice.billing_reason === 'subscription_create') {
                    this.logger.log(`ℹ️ Skipping initial invoice ${invoice.id} - already handled via checkout session.`);
                    return { received: true };
                }

                // For recurring subscription payments (Legacy System)
                if (invoice.subscription) {
                    const stripeSub = await this.stripe.subscriptions.retrieve(invoice.subscription as string);
                    const vendor = await this.vendorRepository.findOne({ where: { stripeCustomerId: invoice.customer as string } });

                    if (vendor) {
                        const priceId = stripeSub.items.data[0].price.id;
                        const plan = await this.planRepository.findOne({ where: { stripePriceId: priceId } });
                        const activeSub = await this.subscriptionRepository.findOne({
                            where: { vendorId: vendor.id, status: SubscriptionStatus.ACTIVE },
                            order: { createdAt: 'DESC' }
                        });

                        if (activeSub && plan) {
                            this.logger.log(`🔄 Extending subscription for vendor: ${vendor.id}`);

                            // Extend end date based on plan's billing cycle (perfect calendar date)
                            const currentEnd = new Date(activeSub.endDate);
                            const referenceDate = new Date(Math.max(currentEnd.getTime(), Date.now()));
                            const newEnd = new Date(referenceDate);

                            if (plan.billingCycle?.toLowerCase() === 'yearly') {
                                newEnd.setFullYear(newEnd.getFullYear() + 1);
                            } else {
                                newEnd.setMonth(newEnd.getMonth() + 1);
                            }

                            activeSub.endDate = newEnd;
                            await this.subscriptionRepository.save(activeSub);

                            // Create a new transaction for the renewal
                            const invoiceNumber = `INV-STRIPE-RENEW-${Date.now().toString().slice(-6)}`;
                            const transaction = this.transactionRepository.create({
                                subscriptionId: activeSub.id,
                                vendorId: vendor.id,
                                amount: invoice.amount_paid / 100, // Stripe returns cents
                                status: PaymentStatus.COMPLETED,
                                paidAt: new Date(),
                                gatewayTransactionId: invoice.id,
                                paymentGateway: 'Stripe',
                                invoiceNumber,
                            });
                            await this.transactionRepository.save(transaction);
                            this.logger.log(`✅ Subscription extended and renewal invoice created for vendor: ${vendor.id}`);
                        }
                    }
                }
                break;
            }
            case 'customer.subscription.deleted': {
                const subscription = event.data.object as Stripe.Subscription;
                this.logger.log(`🚫 Subscription deleted: ${subscription.id} for customer: ${subscription.customer}`);

                const vendor = await this.vendorRepository.findOne({ where: { stripeCustomerId: subscription.customer as string } });
                if (vendor) {
                    this.logger.log(`📉 Cancelling active subscription for vendor: ${vendor.id}`);
                    await this.subscriptionRepository.update(
                        { vendorId: vendor.id, status: SubscriptionStatus.ACTIVE },
                        { status: SubscriptionStatus.CANCELLED, cancelledAt: new Date() }
                    );
                    this.logger.log(`✅ Subscription cancelled for vendor: ${vendor.id}`);
                } else {
                    this.logger.warn(`⚠️ Vendor not found for Stripe Customer ID: ${subscription.customer}`);
                }
                break;
            }
            default:
                this.logger.log(`ℹ️ Unhandled event type: ${event.type}`);
        }
        return { received: true };
    }
}
