import {
    Injectable,
    Logger,
    NotFoundException,
    BadRequestException,
    ConflictException,
    OnModuleInit,
    ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike, MoreThan } from 'typeorm';
import { Affiliate, KycStatus } from '../../entities/affiliate.entity';
import { AffiliateReferral, ReferralStatus, ReferralType } from '../../entities/referral.entity';
import { Payout, PayoutStatus } from '../../entities/payout.entity';
import { User } from '../../entities/user.entity';
import { SystemSetting } from '../../entities/system-setting.entity';
import { Subscription, SubscriptionStatus } from '../../entities/subscription.entity';
import { ActivePlan, ActivePlanStatus } from '../../entities/active-plan.entity';
import { PricingPlan, PricingPlanType, PricingPlanUnit } from '../../entities/pricing-plan.entity';
import { SubscriptionPlan } from '../../entities/subscription-plan.entity';
import { Vendor } from '../../entities/vendor.entity';
import { Listing, BusinessStatus } from '../../entities/business.entity';
import { generateReferralCode } from '../../common/utils/referral-code';



@Injectable()
export class AffiliateService implements OnModuleInit {
    private readonly logger = new Logger(AffiliateService.name);
    constructor(
        @InjectRepository(Affiliate)
        private affiliateRepository: Repository<Affiliate>,
        @InjectRepository(AffiliateReferral)
        private referralRepository: Repository<AffiliateReferral>,
        @InjectRepository(Payout)
        private payoutRepository: Repository<Payout>,
        @InjectRepository(User)
        private userRepository: Repository<User>,
        @InjectRepository(SystemSetting)
        private systemSettingRepository: Repository<SystemSetting>,
        @InjectRepository(Subscription)
        private subscriptionRepository: Repository<Subscription>,
        @InjectRepository(ActivePlan)
        private activePlanRepository: Repository<ActivePlan>,
        @InjectRepository(PricingPlan)
        private pricingPlanRepository: Repository<PricingPlan>,
        @InjectRepository(Vendor)
        private vendorRepo: Repository<Vendor>,
        @InjectRepository(Listing)
        private listingRepo: Repository<Listing>,
        @InjectRepository(SubscriptionPlan)
        private subscriptionPlanRepo: Repository<SubscriptionPlan>,
    ) { }

    async onModuleInit() {
        await this.ensureAffiliateReferralEnums();
    }

    private async ensureAffiliateReferralEnums() {
        await this.referralRepository.query(`
            DO $$
            BEGIN
                IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'affiliate_referrals_status_enum') THEN
                    IF NOT EXISTS (
                        SELECT 1
                        FROM pg_enum e
                        JOIN pg_type t ON t.oid = e.enumtypid
                        WHERE t.typname = 'affiliate_referrals_status_enum' AND e.enumlabel = 'pending'
                    ) THEN
                        ALTER TYPE affiliate_referrals_status_enum ADD VALUE 'pending';
                    END IF;
                    IF NOT EXISTS (
                        SELECT 1
                        FROM pg_enum e
                        JOIN pg_type t ON t.oid = e.enumtypid
                        WHERE t.typname = 'affiliate_referrals_status_enum' AND e.enumlabel = 'converted'
                    ) THEN
                        ALTER TYPE affiliate_referrals_status_enum ADD VALUE 'converted';
                    END IF;
                    IF NOT EXISTS (
                        SELECT 1
                        FROM pg_enum e
                        JOIN pg_type t ON t.oid = e.enumtypid
                        WHERE t.typname = 'affiliate_referrals_status_enum' AND e.enumlabel = 'expired'
                    ) THEN
                        ALTER TYPE affiliate_referrals_status_enum ADD VALUE 'expired';
                    END IF;
                END IF;

                IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'affiliate_referrals_type_enum') THEN
                    IF NOT EXISTS (
                        SELECT 1
                        FROM pg_enum e
                        JOIN pg_type t ON t.oid = e.enumtypid
                        WHERE t.typname = 'affiliate_referrals_type_enum' AND e.enumlabel = 'signup'
                    ) THEN
                        ALTER TYPE affiliate_referrals_type_enum ADD VALUE 'signup';
                    END IF;
                    IF NOT EXISTS (
                        SELECT 1
                        FROM pg_enum e
                        JOIN pg_type t ON t.oid = e.enumtypid
                        WHERE t.typname = 'affiliate_referrals_type_enum' AND e.enumlabel = 'subscription'
                    ) THEN
                        ALTER TYPE affiliate_referrals_type_enum ADD VALUE 'subscription';
                    END IF;
                END IF;
            EXCEPTION
                WHEN duplicate_object THEN NULL;
                WHEN others THEN NULL;
            END
            $$;
        `);
    }

    private normalizeReferralCode(code?: string | null) {
        const normalizedCode = code?.trim();
        if (!normalizedCode) {
            throw new BadRequestException('Referral code is required');
        }
        return normalizedCode;
    }


    async getStats(userId: string) {
        const userObj = await this.userRepository.findOne({ where: { id: userId }, relations: ['vendor'] });
        const hasRegisteredBusiness = !!(userObj?.vendor?.id || userObj?.role === 'vendor');

        let affiliate = await this.affiliateRepository.findOne({
            where: { user: { id: userId } },
        });

        const referredBy = await this.referralRepository.findOne({
            where: { referredUserId: userId },
            relations: ['affiliate', 'affiliate.user']
        });

        let referrerName = referredBy?.affiliate?.user?.fullName;
        if (!referrerName && userObj?.pendingReferralCode) {
            const pendingAff = await this.affiliateRepository.findOne({
                where: { referralCode: ILike(userObj.pendingReferralCode.trim()) },
                relations: ['user']
            });
            if (pendingAff?.user?.fullName) {
                referrerName = pendingAff.user.fullName;
            }
        }

        const hasReferrer = !!referredBy || !!userObj?.pendingReferralCode;

        if (!affiliate) {
            // Check if user is a vendor, if so auto-create
            if (userObj && userObj.role === 'vendor') {
                affiliate = this.affiliateRepository.create({
                    user: { id: userId } as any,
                    referralCode: generateReferralCode(),
                });
                affiliate = await this.affiliateRepository.save(affiliate);
            } else {
                return { 
                    isAffiliate: false,
                    hasReferrer,
                    referrerName: referrerName || 'Affiliate Partner',
                    hasRegisteredBusiness,
                };
            }
        }

        const referrals = await this.referralRepository.count({
            where: { affiliateId: affiliate.id },
        });

        const conversions = await this.referralRepository.count({
            where: { affiliateId: affiliate.id, status: ReferralStatus.CONVERTED },
        });

        return {
            isAffiliate: true,
            referralCode: affiliate.referralCode,
            totalReferrals: referrals,
            convertedReferrals: conversions,
            totalEarnings: affiliate.totalEarnings,
            balance: affiliate.balance,
            balanceHeld: affiliate.balanceHeld,
            holdUntil: affiliate.holdUntil,
            totalWithdrawals: affiliate.totalWithdrawals,
            conversionRate: referrals > 0 ? (conversions / referrals) * 100 : 0,
            hasReferrer,
            referrerName: referrerName || 'Affiliate Partner',
            hasRegisteredBusiness,
        };
    }

    async join(userId: string) {
        const existing = await this.affiliateRepository.findOne({
            where: { user: { id: userId } },
        });

        if (existing) {
            throw new ConflictException('Already an affiliate');
        }

        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (!user || user.role !== 'vendor') {
            throw new BadRequestException('Only registered vendors can join the affiliate program');
        }

        const affiliate = this.affiliateRepository.create({
            user: { id: userId } as any,
            referralCode: generateReferralCode(), // Short unique code
        });

        return this.affiliateRepository.save(affiliate);
    }

    async getReferrals(userId: string) {
        const affiliate = await this.affiliateRepository.findOne({
            where: { user: { id: userId } },
        });

        if (!affiliate) return [];

        return this.referralRepository.find({
            where: { affiliateId: affiliate.id },
            relations: ['referredUser'],
            order: { createdAt: 'DESC' },
            take: 20,
        });
    }

    async validateCodeForUser(userId: string, code: string) {
        const normalizedCode = this.normalizeReferralCode(code);
        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (!user) throw new NotFoundException('User not found');

        const existing = await this.referralRepository.findOne({ where: { referredUserId: userId } });
        if (existing) throw new BadRequestException('You have already been referred');

        const affiliate = await this.affiliateRepository.findOne({
            where: { referralCode: ILike(normalizedCode) },
            relations: ['user']
        });

        if (!affiliate || !affiliate.user || affiliate.user.role !== 'vendor') {
            throw new NotFoundException('Invalid referral code');
        }

        if (affiliate.user.id === userId) {
            throw new BadRequestException('You cannot refer yourself');
        }

        return true;
    }

    async applyReferralCode(userId: string, code: string) {
        const normalizedCode = this.normalizeReferralCode(code);
        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (!user) {
            throw new NotFoundException('User not found');
        }

        // Check if user already has a referrer
        const existing = await this.referralRepository.findOne({
            where: { referredUserId: userId }
        });
        if (existing) {
            throw new BadRequestException('You have already been referred');
        }
        this.logger.log(`Applying referral code: "${normalizedCode}" (length: ${normalizedCode.length})`);
        
        // Find the affiliate with this code
        const affiliate = await this.affiliateRepository.findOne({
            where: { referralCode: ILike(normalizedCode) },
            relations: ['user']
        });

        if (!affiliate || !affiliate.user || affiliate.user.role !== 'vendor') {
            const reason = !affiliate ? 'not found' : 'belongs to a non-vendor user';
            this.logger.warn(`Referral code "${normalizedCode}" ${reason}`);
            throw new NotFoundException('Invalid referral code');
        }

        if (affiliate.user.id === userId) {
            throw new BadRequestException('You cannot refer yourself');
        }

        // Users can save a referral before becoming a business account.
        // It will be auto-applied when they activate their business profile.
        if (user.role !== 'vendor') {
            await this.userRepository.update(userId, { pendingReferralCode: normalizedCode });
            return { success: true, message: 'Referral code saved. It will be applied when you activate your business account.' };
        }

        // Create the referral record
        const referral = this.referralRepository.create({
            affiliateId: affiliate.id,
            referredUserId: userId,
            type: ReferralType.SIGNUP,
            status: ReferralStatus.PENDING,
        });

        await this.referralRepository.save(referral);

        // Immediately process the referral to grant the 10 days free extension reward and convert it
        await this.processSuccessfulReferral(userId, 0, true);

        return { success: true, message: 'Referral code applied successfully' };
    }

    async trackClick(userId: string, code: string) {
        const normalizedCode = this.normalizeReferralCode(code);
        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (!user) {
            throw new NotFoundException('User not found');
        }

        const affiliate = await this.affiliateRepository.findOne({
            where: { referralCode: ILike(normalizedCode) },
            relations: ['user'],
        });

        if (!affiliate || !affiliate.user || affiliate.user.role !== 'vendor') {
            throw new NotFoundException('Invalid referral code');
        }

        if (affiliate.user.id === userId) {
            throw new BadRequestException('You cannot refer yourself');
        }

        const existing = await this.referralRepository.findOne({
            where: { referredUserId: userId },
        });
        if (existing) {
            return { success: true, message: 'Referral already exists' };
        }

        if (user.role === 'vendor') {
            return this.applyReferralCode(userId, normalizedCode);
        }

        await this.userRepository.update(userId, { pendingReferralCode: normalizedCode });
        return { success: true, message: 'Referral click tracked successfully' };
    }

    private async releaseHeldFunds(affiliate: Affiliate): Promise<void> {
        if (!affiliate.holdUntil) return;
        const now = new Date();
        if (now >= new Date(affiliate.holdUntil)) {
            const heldAmount = Number(affiliate.balanceHeld);
            if (heldAmount > 0) {
                affiliate.balance = Number(affiliate.balance) + heldAmount;
                affiliate.balanceHeld = 0;
                affiliate.holdUntil = null;
                await this.affiliateRepository.save(affiliate);
                this.logger.log(`[Hold] Released ${heldAmount} from held balance for affiliate ${affiliate.id}`);
            }
        }
    }

    // --- Payout Logic ---

    async getPayoutHistory(userId: string) {
        const affiliate = await this.affiliateRepository.findOne({
            where: { user: { id: userId } },
        });

        if (!affiliate) return [];

        return this.payoutRepository.find({
            where: { affiliateId: affiliate.id },
            order: { createdAt: 'DESC' },
        });
    }

    async adminGetAllPayouts() {
        return this.payoutRepository.find({
            relations: ['affiliate', 'affiliate.user'],
            order: { createdAt: 'DESC' },
        });
    }

    async adminUpdatePayout(payoutId: string, status: PayoutStatus, notes?: string) {
        const payout = await this.payoutRepository.findOne({
            where: { id: payoutId },
            relations: ['affiliate'],
        });

        if (!payout) throw new NotFoundException('Payout request not found');

        if (payout.status === PayoutStatus.PAID || payout.status === PayoutStatus.REJECTED) {
            throw new BadRequestException('Payout already processed');
        }

        payout.status = status;
        payout.adminNotes = notes;

        if (status === PayoutStatus.PAID) {
            payout.processedAt = new Date();
            payout.affiliate.totalWithdrawals = Number(payout.affiliate.totalWithdrawals) + Number(payout.amount);
        } else if (status === PayoutStatus.REJECTED) {
            // Refund balance
            payout.affiliate.balance = Number(payout.affiliate.balance) + Number(payout.amount);
        }

        await this.affiliateRepository.save(payout.affiliate);
        return this.payoutRepository.save(payout);
    }

    // --- KYC Methods ---

    async adminGetAllAffiliates() {
        return this.affiliateRepository.find({
            relations: ['user'],
            order: { totalEarnings: 'DESC' },
        });
    }

    async adminUpdateSettings(settings: { 
        commissionRate: string; 
        commissionType: string;
        checkinReward: string; 
        checkinType: string;
        validityMonths: string;
        expiryDate: string 
    }) {
        const updates = [
            { key: 'affiliate_commission_rate', value: settings.commissionRate },
            { key: 'affiliate_commission_type', value: settings.commissionType },
            { key: 'affiliate_checkin_reward', value: settings.checkinReward },
            { key: 'affiliate_checkin_type', value: settings.checkinType },
            { key: 'affiliate_validity_months', value: settings.validityMonths },
            { key: 'affiliate_settings_expiry', value: settings.expiryDate },
        ];

        for (const update of updates) {
            await this.systemSettingRepository.update({ key: update.key }, { value: update.value });
        }

        return { success: true };
    }

    async getSettings() {
        const settings = await this.systemSettingRepository.find({
            where: { group: 'affiliate' }
        });

        const config: any = {};
        settings.forEach(s => {
            const field = s.key.split('affiliate_')[1];
            config[field] = s.value;
        });

        return {
            commissionRate: config.commission_rate || '10',
            commissionType: config.commission_type || 'percent',
            checkinReward: config.checkin_reward || '5',
            checkinType: config.checkin_type || 'fixed',
            validityMonths: config.validity_months || '2',
            expiryDate: config.settings_expiry || '',
        };
    }

    async getReferralStats() {
        return await this.referralRepository.find({
            relations: ['affiliate', 'affiliate.user', 'referredUser'],
            order: { createdAt: 'DESC' }
        });
    }

    // --- KYC Methods ---

    async submitKyc(userId: string, documentUrl: string) {
        const affiliate = await this.affiliateRepository.findOne({
            where: { user: { id: userId } },
        });

        if (!affiliate) throw new NotFoundException('Affiliate not found');

        if (affiliate.kycStatus === KycStatus.APPROVED) {
            throw new BadRequestException('KYC already approved');
        }

        affiliate.kycDocumentUrl = documentUrl;
        affiliate.kycStatus = KycStatus.PENDING;
        affiliate.kycSubmittedAt = new Date();

        return this.affiliateRepository.save(affiliate);
    }

    async reviewKyc(affiliateId: string, status: 'approved' | 'rejected', adminId: string) {
        const affiliate = await this.affiliateRepository.findOne({
            where: { id: affiliateId },
        });

        if (!affiliate) throw new NotFoundException('Affiliate not found');

        if (affiliate.kycStatus !== KycStatus.PENDING) {
            throw new BadRequestException('No pending KYC to review');
        }

        affiliate.kycStatus = status === 'approved' ? KycStatus.APPROVED : KycStatus.REJECTED;
        affiliate.kycReviewedAt = new Date();
        affiliate.kycReviewedBy = adminId;

        return this.affiliateRepository.save(affiliate);
    }

    // --- Admin Approval Methods ---

    async approveAffiliate(affiliateId: string, adminId: string) {
        const affiliate = await this.affiliateRepository.findOne({
            where: { id: affiliateId },
        });

        if (!affiliate) throw new NotFoundException('Affiliate not found');

        affiliate.adminApproved = true;
        affiliate.adminApprovedAt = new Date();
        affiliate.adminApprovedBy = adminId;
        affiliate.status = 'active';

        return this.affiliateRepository.save(affiliate);
    }

    async suspendAffiliate(affiliateId: string, adminId: string, reason?: string) {
        const affiliate = await this.affiliateRepository.findOne({
            where: { id: affiliateId },
        });

        if (!affiliate) throw new NotFoundException('Affiliate not found');

        affiliate.status = 'suspended';
        affiliate.adminApproved = false;

        return this.affiliateRepository.save(affiliate);
    }

    // --- Enhanced Payout Methods ---

    async requestPayout(userId: string, amount: number, method: string, details: string) {
        const affiliate = await this.affiliateRepository.findOne({
            where: { user: { id: userId } },
        });

        if (!affiliate) throw new NotFoundException('Affiliate not found');

        if (!affiliate.adminApproved) {
            throw new ForbiddenException('Your affiliate account is not yet approved by admin');
        }

        if (affiliate.kycStatus !== KycStatus.APPROVED) {
            throw new ForbiddenException('KYC verification required before requesting payout');
        }

        if (amount < 500) {
            throw new BadRequestException('Minimum withdrawal amount is Rs. 500');
        }

        await this.releaseHeldFunds(affiliate);

        if (Number(affiliate.balance) < amount) {
            throw new BadRequestException('Insufficient available balance');
        }

        const payout = this.payoutRepository.create({
            affiliateId: affiliate.id,
            amount,
            paymentMethod: method,
            paymentDetails: details,
            status: PayoutStatus.PENDING,
        });

        affiliate.balance = Number(affiliate.balance) - amount;
        await this.affiliateRepository.save(affiliate);

        return this.payoutRepository.save(payout);
    }

    async adminApprovePayout(payoutId: string, adminId: string, paymentReference?: string) {
        const payout = await this.payoutRepository.findOne({
            where: { id: payoutId },
            relations: ['affiliate'],
        });

        if (!payout) throw new NotFoundException('Payout request not found');

        if (payout.status === PayoutStatus.PAID || payout.status === PayoutStatus.REJECTED) {
            throw new BadRequestException('Payout already processed');
        }

        await this.releaseHeldFunds(payout.affiliate);

        payout.status = PayoutStatus.APPROVED;
        payout.processedAt = new Date();
        payout.adminNotes = `Approved by admin ${adminId}`;
        if (paymentReference) {
            payout.paymentReference = paymentReference;
        }

        return this.payoutRepository.save(payout);
    }

    async adminRejectPayout(payoutId: string, reason: string) {
        const payout = await this.payoutRepository.findOne({
            where: { id: payoutId },
            relations: ['affiliate'],
        });

        if (!payout) throw new NotFoundException('Payout request not found');

        if (payout.status === PayoutStatus.PAID || payout.status === PayoutStatus.REJECTED) {
            throw new BadRequestException('Payout already processed');
        }

        payout.status = PayoutStatus.REJECTED;
        payout.adminNotes = reason;

        // Refund balance
        payout.affiliate.balance = Number(payout.affiliate.balance) + Number(payout.amount);
        await this.affiliateRepository.save(payout.affiliate);

        return this.payoutRepository.save(payout);
    }

    async adminMarkAsPaid(payoutId: string, adminId: string, paymentReference: string) {
        const payout = await this.payoutRepository.findOne({
            where: { id: payoutId },
            relations: ['affiliate'],
        });

        if (!payout) throw new NotFoundException('Payout request not found');

        if (payout.status !== PayoutStatus.APPROVED) {
            throw new BadRequestException('Payout must be approved before marking as paid');
        }

        payout.status = PayoutStatus.PAID;
        payout.processedAt = new Date();
        payout.paymentReference = paymentReference;
        payout.adminNotes = `Marked as paid by admin ${adminId}`;

        payout.affiliate.totalWithdrawals = Number(payout.affiliate.totalWithdrawals) + Number(payout.amount);
        await this.affiliateRepository.save(payout.affiliate);

        return this.payoutRepository.save(payout);
    }

    // --- Fraud Detection ---

    async detectFraud(affiliateId: string, referredUserId: string): Promise<{ isFraud: boolean; reason?: string }> {
        // Check for self-referral
        const affiliate = await this.affiliateRepository.findOne({
            where: { id: affiliateId },
            relations: ['user'],
        });

        if (affiliate?.userId === referredUserId) {
            return { isFraud: true, reason: 'Self-referral detected' };
        }

        // Check for duplicate referral
        const existing = await this.referralRepository.findOne({
            where: { referredUserId },
        });

        if (existing) {
            return { isFraud: true, reason: 'Duplicate referral detected' };
        }

        // Check for rapid signups from same affiliate (more than 10 in last hour)
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        const recentReferrals = await this.referralRepository.count({
            where: {
                affiliateId,
                createdAt: MoreThan(oneHourAgo),
            },
        });

        if (recentReferrals > 10) {
            return { isFraud: true, reason: 'Suspicious rapid signups detected' };
        }

        return { isFraud: false };
    }

    // --- Earnings Breakdown ---

    async getEarningsBreakdown(userId: string) {
        const affiliate = await this.affiliateRepository.findOne({
            where: { user: { id: userId } },
        });

        if (!affiliate) throw new NotFoundException('Affiliate not found');

        const referrals = await this.referralRepository.count({
            where: { affiliateId: affiliate.id },
        });

        const conversions = await this.referralRepository.count({
            where: { affiliateId: affiliate.id, status: ReferralStatus.CONVERTED },
        });

        const pendingPayouts = await this.payoutRepository.sum('amount', {
            affiliateId: affiliate.id,
            status: PayoutStatus.PENDING,
        });

        const paidPayouts = await this.payoutRepository.sum('amount', {
            affiliateId: affiliate.id,
            status: PayoutStatus.PAID,
        });

        const clicks = await this.referralRepository.count({
            where: { affiliateId: affiliate.id },
        });

        return {
            signups: referrals,
            conversions,
            totalEarned: affiliate.totalEarnings,
            pendingPayout: pendingPayouts || 0,
            paidOut: paidPayouts || 0,
            clicks,
            conversionRate: referrals > 0 ? (conversions / referrals) * 100 : 0,
            balance: affiliate.balance,
            balanceHeld: affiliate.balanceHeld,
            holdUntil: affiliate.holdUntil,
        };
    }

    // --- Enhanced Admin Stats ---

    async adminGetAllStats() {
        const totalAffiliates = await this.affiliateRepository.count();
        const activeAffiliates = await this.affiliateRepository.count({ where: { status: 'active' } });
        const pendingApprovals = await this.affiliateRepository.count({ where: { adminApproved: false } });
        const totalEarnings = await this.affiliateRepository.sum('totalEarnings') || 0;
        const totalPaidOut = await this.payoutRepository.sum('amount', { status: PayoutStatus.PAID }) || 0;
        const totalCommissionOwed = await this.payoutRepository.sum('amount', { status: PayoutStatus.PENDING }) || 0;
        const pendingPayouts = await this.payoutRepository.count({ where: { status: PayoutStatus.PENDING } });
        const totalClicks = await this.referralRepository.count();

        return {
            totalAffiliates,
            activeAffiliates,
            pendingApprovals,
            totalEarnings,
            totalPaidOut,
            totalCommissionOwed,
            pendingPayouts,
            totalClicks,
        };
    }

    // --- Export ---

    async exportAffiliates(format: 'csv' | 'json' = 'csv') {
        const affiliates = await this.affiliateRepository.find({
            relations: ['user'],
            order: { totalEarnings: 'DESC' },
        });

        if (format === 'json') {
            return affiliates;
        }

        // CSV export
        const headers = ['ID', 'User', 'Referral Code', 'Total Earnings', 'Balance', 'Balance Held', 'Hold Until', 'Status', 'KYC Status', 'Admin Approved', 'Created At'];
        const rows = affiliates.map(a => [
            a.id,
            a.user?.fullName || a.user?.email || 'Unknown',
            a.referralCode,
            a.totalEarnings,
            a.balance,
            a.balanceHeld,
            a.holdUntil?.toISOString() || '',
            a.status,
            a.kycStatus,
            a.adminApproved ? 'Yes' : 'No',
            a.createdAt?.toISOString(),
        ]);

        return [headers, ...rows].map(r => r.join(',')).join('\n');
    }

    // --- Click Tracking for Business Cards ---

    async trackBusinessClick(affiliateCode: string, businessId: string, ip: string, userAgent: string) {
        const affiliate = await this.affiliateRepository.findOne({
            where: { referralCode: ILike(affiliateCode) },
        });

        if (!affiliate) return;

        await this.listingRepo
            .createQueryBuilder()
            .update(Listing)
            .set({ clickCount: () => '"click_count" + 1' })
            .where('id = :businessId', { businessId })
            .execute();

        this.logger.log(`Business click tracked: affiliate=${affiliate.id}, business=${businessId}, ip=${ip}`);
    }

    async adminActivateReferral(referralId: string) {
        const referral = await this.referralRepository.findOne({
            where: { id: referralId },
            relations: ['affiliate', 'referredUser']
        });

        if (!referral) {
            throw new NotFoundException('Referral not found');
        }

        return this.processSuccessfulReferral(referral.referredUserId, 0, true);
    }

    /**
     * Common logic to process a successful referral (signup -> purchase)
     * Rewards are only granted when the referred vendor makes a PAID purchase.
     */
    async processSuccessfulReferral(referredUserId: string, paidAmount: number = 0, force: boolean = false) {
        // Gate: Reward only for paid subscriptions
        if (!force && Number(paidAmount) <= 0) {
            this.logger.debug(`[Referral] Skipping reward for user ${referredUserId} - Transaction amount is 0 (Free Plan). Referral remains PENDING.`);
            return { success: false, reason: 'Paid subscription required' };
        }

        const referral = await this.referralRepository.findOne({
            where: [
                { referredUserId, status: ReferralStatus.PENDING, type: ReferralType.SIGNUP },
                { referredUserId, status: ReferralStatus.PENDING, type: ReferralType.SUBSCRIPTION },
                { referredUserId, status: ReferralStatus.CONVERTED, type: ReferralType.SIGNUP },
                { referredUserId, status: ReferralStatus.CONVERTED, type: ReferralType.SUBSCRIPTION }
            ],
            relations: ['affiliate', 'affiliate.user']
        });

        if (!referral) {
            this.logger.debug(`No pending or converted referral found for user ${referredUserId}`);
            return { success: false, reason: 'No referral found' };
        }

        const referrerUserId = referral.affiliate.user.id;
        let extensionGranted = false;

        // Helper to find the "Premium/Basic" reward plan
        const getRewardPlan = async (): Promise<PricingPlan | SubscriptionPlan | null> => {
             // 1. Try to find a PricingPlan named 'Basic' (case-insensitive)
             let plan: PricingPlan | SubscriptionPlan | null = await this.pricingPlanRepository.findOne({
                where: { 
                    type: PricingPlanType.SUBSCRIPTION, 
                    isActive: true,
                    name: ILike('%basic%')
                }
            });

            // 2. If no 'Basic' PricingPlan, try to find a SubscriptionPlan named 'Basic'
            if (!plan) {
                plan = await this.subscriptionPlanRepo.findOne({
                    where: { 
                        isActive: true,
                        name: ILike('%basic%')
                    }
                });
            }

            // 3. Fallback to any active PricingPlan (price > 0)
            if (!plan) {
                plan = await this.pricingPlanRepository.findOne({
                    where: { 
                        type: PricingPlanType.SUBSCRIPTION, 
                        isActive: true,
                        price: MoreThan(0)
                    },
                    order: { price: 'ASC' }
                });
            }

            // 4. Fallback to any active SubscriptionPlan (price > 0)
            if (!plan) {
                plan = await this.subscriptionPlanRepo.findOne({
                    where: { isActive: true, price: MoreThan(0) },
                    order: { price: 'ASC' }
                });
            }

            // 5. Hard fallback to any active subscription plan
            if (!plan) {
                plan = await this.pricingPlanRepository.findOne({
                    where: { type: PricingPlanType.SUBSCRIPTION, isActive: true },
                    order: { price: 'ASC' }
                });
            }

            if (!plan) {
                plan = await this.subscriptionPlanRepo.findOne({
                    where: { isActive: true },
                    order: { price: 'ASC' }
                });
            }

            return plan;
        };

        const rewardPlan = await getRewardPlan();
        if (!rewardPlan) {
            this.logger.error(`No reward plan found for referral processing.`);
            return { success: false, reason: 'No reward plan configured' };
        }

        const now = new Date();
        const isPricingPlan = (p: any): p is PricingPlan => 'unit' in p;
        
        // Calculate duration in days - strictly set to 10 days per affiliate policy update
        const durationDays = 10;
        
        // --- 1. REWARD THE REFERRER ---
        const referrerVendor = await this.vendorRepo.findOne({ where: { userId: referrerUserId } });
        if (referrerVendor) {
            // Check BOTH systems (new & old) for an active subscription
            const [newPlan, oldSub] = await Promise.all([
                this.activePlanRepository.findOne({
                    where: { 
                        vendorId: referrerVendor.id, 
                        status: ActivePlanStatus.ACTIVE,
                        plan: { type: PricingPlanType.SUBSCRIPTION } as any
                    },
                    relations: ['plan'],
                    order: { endDate: 'DESC' }
                }),
                this.subscriptionRepository.findOne({
                    where: { 
                        vendorId: referrerVendor.id, 
                        status: SubscriptionStatus.ACTIVE 
                    },
                    relations: ['plan'],
                    order: { endDate: 'DESC' }
                })
            ]);

            // Determine which one is the "best" to extend (latest expiration)
            let extensionTarget: { type: 'new' | 'old', record: any } | null = null;
            if (newPlan && oldSub) {
                extensionTarget = new Date(newPlan.endDate) >= new Date(oldSub.endDate) 
                    ? { type: 'new', record: newPlan } 
                    : { type: 'old', record: oldSub };
            } else if (newPlan) {
                extensionTarget = { type: 'new', record: newPlan };
            } else if (oldSub) {
                extensionTarget = { type: 'old', record: oldSub };
            }

            if (extensionTarget) {
                const record = extensionTarget.record;
                const currentPrice = Number(record.plan.price);
                
                if (currentPrice === 0) {
                    // Upgrade Free -> Basic reward plan
                    this.logger.log(`Upgrading referrer ${referrerUserId} from Free to ${rewardPlan.name}`);
                    
                    if (isPricingPlan(rewardPlan)) {
                        // Reward is a NEW system plan
                        if (extensionTarget.type === 'new') {
                            record.planId = rewardPlan.id;
                            record.plan = rewardPlan;
                            record.startDate = now;
                            const newEnd = new Date(now);
                            newEnd.setDate(newEnd.getDate() + durationDays);
                            record.endDate = newEnd;
                            await this.activePlanRepository.save(record);
                        } else {
                            // Deactivate old free sub and create new reward active plan
                            await this.subscriptionRepository.update(record.id, { status: SubscriptionStatus.CANCELLED });
                            const newActivePlan = this.activePlanRepository.create({
                                vendorId: referrerVendor.id,
                                planId: rewardPlan.id,
                                status: ActivePlanStatus.ACTIVE,
                                startDate: now,
                                endDate: new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000),
                                amountPaid: 0,
                                transactionId: `REFERRAL_UPGRADE_${referredUserId}`
                            });
                            await this.activePlanRepository.save(newActivePlan);
                        }
                    } else {
                        // Reward is an OLD system plan
                        if (extensionTarget.type === 'old') {
                            record.planId = rewardPlan.id;
                            record.plan = rewardPlan;
                            record.startDate = now;
                            const newEnd = new Date(now);
                            newEnd.setDate(newEnd.getDate() + durationDays);
                            record.endDate = newEnd;
                            await this.subscriptionRepository.save(record);
                        } else {
                            // Deactivate new free plan and create old system subscription
                            await this.activePlanRepository.update(record.id, { status: ActivePlanStatus.CANCELLED });
                            const newSub = this.subscriptionRepository.create({
                                vendorId: referrerVendor.id,
                                planId: rewardPlan.id,
                                status: SubscriptionStatus.ACTIVE,
                                startDate: now,
                                endDate: new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000),
                                amount: 0,
                                currency: 'INR'
                            });
                            await this.subscriptionRepository.save(newSub);
                        }
                    }
                    extensionGranted = true;
                } else {
                    // Extend existing paid plan
                    this.logger.log(`Extending referrer ${referrerUserId} paid plan (${record.plan.name}) by ${durationDays} days`);
                    const currentEndDate = new Date(record.endDate);
                    if (currentEndDate > now) {
                        currentEndDate.setDate(currentEndDate.getDate() + durationDays);
                        record.endDate = currentEndDate;
                    } else {
                        const newEndDate = new Date(now);
                        newEndDate.setDate(newEndDate.getDate() + durationDays);
                        record.startDate = now;
                        record.endDate = newEndDate;
                    }
                    
                    if (extensionTarget.type === 'new') {
                        await this.activePlanRepository.save(record);
                    } else {
                        await this.subscriptionRepository.save(record);
                    }
                    extensionGranted = true;
                }
            } else {
                // Assign a new reward plan if they have NONE
                if (isPricingPlan(rewardPlan)) {
                    const newActivePlan = this.activePlanRepository.create({
                        vendorId: referrerVendor.id,
                        planId: rewardPlan.id,
                        status: ActivePlanStatus.ACTIVE,
                        startDate: now,
                        endDate: new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000),
                        amountPaid: 0,
                        transactionId: `REFERRAL_REWARD_${referredUserId}`
                    });
                    await this.activePlanRepository.save(newActivePlan);
                } else {
                    const newSub = this.subscriptionRepository.create({
                        vendorId: referrerVendor.id,
                        planId: rewardPlan.id,
                        status: SubscriptionStatus.ACTIVE,
                        startDate: now,
                        endDate: new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000),
                        amount: 0,
                        currency: 'INR'
                    });
                    await this.subscriptionRepository.save(newSub);
                }
                this.logger.log(`Assigned NEW ${rewardPlan.name} reward plan to referrer ${referrerUserId}`);
                extensionGranted = true;
            }
        }

        // --- 2. REWARD THE REFERRED VENDOR (ACTIVATE ALL FEATURES) ---
        try {
            const referredVendor = await this.vendorRepo.findOne({ 
                where: { userId: referredUserId } 
            });
            
            if (referredVendor) {
                // Auto-verify the vendor profile
                referredVendor.isVerified = true;
                await this.vendorRepo.save(referredVendor);
                this.logger.log(`[Referral] Auto-verified referred vendor ${referredUserId}`);

                // Auto-approve all pending listings and activate Verified feature (as part of basic subscription perk)
                // We use QueryBuilder for a "perfect" bulk update to ensure all listings are updated correctly
                // Note: We removed isFeatured and isSponsored as requested, since those correspond to Boost & Promote plans.
                await this.listingRepo.createQueryBuilder()
                    .update(Listing)
                    .set({
                        isVerified: true,
                        status: BusinessStatus.APPROVED,
                        approvedAt: new Date(),
                    })
                    .where("vendor_id = :vendorId", { vendorId: referredVendor.id })
                    .execute();
                
                this.logger.log(`[Referral] Fully activated premium features and approved all listings for referred vendor ${referredUserId}`);

                // Ensure referred vendor has the reward (Basic/Standard) plan
                // Check both systems for an active plan to extend/upgrade
                const [refNewPlan, refOldSub] = await Promise.all([
                    this.activePlanRepository.findOne({
                        where: { vendorId: referredVendor.id, status: ActivePlanStatus.ACTIVE },
                        relations: ['plan']
                    }),
                    this.subscriptionRepository.findOne({
                        where: { vendorId: referredVendor.id, status: SubscriptionStatus.ACTIVE },
                        relations: ['plan']
                    })
                ]);

                const extensionSource = refNewPlan || refOldSub;
                const isNew = !!refNewPlan;
                const endDate = new Date(now);
                endDate.setDate(endDate.getDate() + durationDays);

                if (extensionSource) {
                    const price = Number(extensionSource.plan.price);
                    if (price === 0) {
                        // Upgrade Free -> Basic
                        this.logger.log(`Upgrading referred vendor ${referredUserId} from Free to ${rewardPlan.name}`);
                        
                        if (isPricingPlan(rewardPlan)) {
                            if (isNew) {
                                (extensionSource as any).planId = rewardPlan.id;
                                (extensionSource as any).plan = rewardPlan;
                                (extensionSource as any).startDate = now;
                                (extensionSource as any).endDate = endDate;
                                (extensionSource as any).transactionId = 'REFERRAL_SIGNUP_UPGRADE_REWARD';
                                await this.activePlanRepository.save(extensionSource as any);
                            } else {
                                // Assign new active plan and cancel old sub
                                await this.subscriptionRepository.update((extensionSource as any).id, { status: SubscriptionStatus.CANCELLED });
                                const newActivePlan = this.activePlanRepository.create({
                                    vendorId: referredVendor.id,
                                    planId: rewardPlan.id,
                                    status: ActivePlanStatus.ACTIVE,
                                    startDate: now,
                                    endDate: endDate,
                                    amountPaid: 0,
                                    transactionId: 'REFERRAL_SIGNUP_UPGRADE_REWARD'
                                });
                                await this.activePlanRepository.save(newActivePlan);
                            }
                        } else {
                            if (!isNew) {
                                (extensionSource as any).planId = rewardPlan.id;
                                (extensionSource as any).plan = rewardPlan;
                                (extensionSource as any).startDate = now;
                                (extensionSource as any).endDate = endDate;
                                await this.subscriptionRepository.save(extensionSource as any);
                            } else {
                                // Assign new sub and cancel old active plan
                                await this.activePlanRepository.update((extensionSource as any).id, { status: ActivePlanStatus.CANCELLED });
                                const newSub = this.subscriptionRepository.create({
                                    vendorId: referredVendor.id,
                                    planId: rewardPlan.id,
                                    status: SubscriptionStatus.ACTIVE,
                                    startDate: now,
                                    endDate: endDate,
                                    amount: 0,
                                    currency: 'INR'
                                });
                                await this.subscriptionRepository.save(newSub);
                            }
                        }
                    } else {
                        // Already on a paid plan: Extend it
                        this.logger.log(`Extending referred vendor ${referredUserId} paid plan by ${durationDays} days`);
                        const currentEnd = new Date(extensionSource.endDate);
                        if (currentEnd > now) {
                            currentEnd.setDate(currentEnd.getDate() + durationDays);
                            extensionSource.endDate = currentEnd;
                        } else {
                            const newEnd = new Date(now);
                            newEnd.setDate(newEnd.getDate() + durationDays);
                            extensionSource.endDate = newEnd;
                        }
                        await (isNew ? this.activePlanRepository.save(extensionSource as any) : this.subscriptionRepository.save(extensionSource as any));
                    }
                } else {
                    // Assign a new reward plan
                    if (isPricingPlan(rewardPlan)) {
                        const newActivePlan = this.activePlanRepository.create({
                            vendorId: referredVendor.id,
                            planId: rewardPlan.id,
                            status: ActivePlanStatus.ACTIVE,
                            startDate: now,
                            endDate: endDate,
                            amountPaid: 0,
                            transactionId: 'REFERRAL_SIGNUP_REWARD'
                        });
                        await this.activePlanRepository.save(newActivePlan);
                    } else {
                        const newSub = this.subscriptionRepository.create({
                            vendorId: referredVendor.id,
                            planId: rewardPlan.id,
                            status: SubscriptionStatus.ACTIVE,
                            startDate: now,
                            endDate: endDate,
                            amount: 0,
                            currency: 'INR'
                        });
                        await this.subscriptionRepository.save(newSub);
                    }
                    this.logger.log(`Assigned ${rewardPlan.name} plan to referred vendor ${referredUserId}`);
                }
            }
        } catch (err) {
            this.logger.error(`Failed to activate referred vendor features for ${referredUserId}: ${err.message}`);
        }

        // --- 3. Finalize Referral Status & Calculate Commission ---
        referral.status = ReferralStatus.CONVERTED;
        await this.referralRepository.save(referral);

        if (Number(paidAmount) > 0) {
            try {
                const settings = await this.getSettings();
                const rate = parseFloat(settings.commissionRate) || 10;
                const commType = settings.commissionType || 'percent';
                let commission = 0;
                if (commType === 'percent') {
                    commission = (Number(paidAmount) * rate) / 100;
                } else {
                    commission = rate;
                }

                if (commission > 0) {
                    const affiliateObj = referral.affiliate;
                    affiliateObj.totalEarnings = Number(affiliateObj.totalEarnings) + commission;
                    affiliateObj.balanceHeld = Number(affiliateObj.balanceHeld) + commission;
                    const holdDays = affiliateObj.referralHoldDays || 30;
                    const holdEnd = new Date();
                    holdEnd.setDate(holdEnd.getDate() + holdDays);
                    affiliateObj.holdUntil = holdEnd;
                    await this.affiliateRepository.save(affiliateObj);
                    this.logger.log(`[Referral] Commission of PKR ${commission} placed on ${holdDays}-day hold for affiliate ${affiliateObj.id} (paid amount PKR ${paidAmount})`);
                }
            } catch (commErr) {
                this.logger.error(`[Referral] Failed to calculate commission for referral ${referral.id}: ${commErr.message}`);
            }
        }

        this.logger.log(`✅ Referral ${referral.id} for user ${referredUserId} successfully converted. Extension granted: ${extensionGranted}`);

        return {
            success: true,
            message: extensionGranted 
                ? 'Referral activated and both accounts upgraded/extended' 
                : 'Referral activated for referred user only',
            extensionGranted
        };
    }

}

