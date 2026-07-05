import {
    Injectable,
    NotFoundException,
    ConflictException,
    InternalServerErrorException,
    BadRequestException,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual } from 'typeorm';
import { User, UserRole } from '../../entities/user.entity';
import { SavedListing } from '../../entities/favorite.entity';
import { SavedOfferEvent } from '../../entities/saved-offer-event.entity';
import { Notification } from '../../entities/notification.entity';
import { Listing } from '../../entities/business.entity';
import { OfferEvent } from '../../entities/offer-event.entity';
import { Lead } from '../../entities/lead.entity';
import { Comment } from '../../entities/comment.entity';
import { Vendor } from '../../entities/vendor.entity';
import { UpdateUserDto } from './dto/update-user.dto';
import {
    createPaginatedResponse,
    calculateSkip,
} from '../../common/utils/pagination.util';
import { ChangePasswordDto } from './dto/change-password.dto';
import * as bcrypt from 'bcrypt';
import { createHash } from 'crypto';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User)
        private userRepository: Repository<User>,
        @InjectRepository(SavedListing)
        private savedListingRepository: Repository<SavedListing>,
        @InjectRepository(SavedOfferEvent)
        private savedOfferEventRepository: Repository<SavedOfferEvent>,
        @InjectRepository(Notification)
        private notificationRepository: Repository<Notification>,
        @InjectRepository(Listing)
        private businessRepository: Repository<Listing>,
        @InjectRepository(Vendor)
        private vendorRepository: Repository<Vendor>,
        @InjectRepository(OfferEvent)
        private offerEventRepository: Repository<OfferEvent>,
        @InjectRepository(Lead)
        private leadRepository: Repository<Lead>,
        @InjectRepository(Comment)
        private commentRepository: Repository<Comment>,
        private subscriptionsService: SubscriptionsService,
    ) { }

    /**
     * Get user profile
     */
    async getProfile(id: string): Promise<User> {
        const user = await this.userRepository.findOne({
            where: { id },
            relations: ['vendor', 'vendor.businesses', 'vendor.subscriptions', 'vendor.subscriptions.plan', 'vendor.activePlans', 'vendor.activePlans.plan'],
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        // Normalize and merge subscription data for the frontend if vendor exists
        if (user.vendor) {
            const now = new Date();
            let activeSubscription: any = null;
            
            // Collect ALL active subscriptions and plans from both systems
            const allActive: any[] = [];

            // 1. Check legacy system
            if (user.vendor.subscriptions) {
                user.vendor.subscriptions.forEach(sub => {
                    if (sub.status === 'active' && new Date(sub.endDate) > now) {
                        allActive.push(this.subscriptionsService.normalizeSubOrActivePlan(sub, false));
                    }
                });
            }

            // 2. Check new system
            if (user.vendor.activePlans) {
                user.vendor.activePlans.forEach(plan => {
                    if (plan.status === 'active' && new Date(plan.endDate) > now) {
                        allActive.push(this.subscriptionsService.normalizeSubOrActivePlan(plan, true));
                    }
                });
            }

            if (allActive.length > 0) {
                // Sort by: 
                // 1. Type (Subscriptions first, then Boosts)
                // 2. Price (Higher price = more "prime")
                // 3. Start Date (Newest first)
                allActive.sort((a, b) => {
                    // Prioritize Membership Plans over one-off Boosts for the base "Current Plan" name
                    const planTiers = ['free', 'basic', 'premium', 'enterprise'];
                    const isAPlan = planTiers.includes(a.plan?.planType?.toLowerCase());
                    const isBPlan = planTiers.includes(b.plan?.planType?.toLowerCase());
                    
                    if (isAPlan && !isBPlan) return -1;
                    if (!isAPlan && isBPlan) return 1;

                    // Then Price
                    const priceDiff = (b.plan?.price || 0) - (a.plan?.price || 0);
                    if (priceDiff !== 0) return priceDiff;

                    // Then Date
                    return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
                });

                // Pick the Best Plan for the identity
                activeSubscription = JSON.parse(JSON.stringify(allActive[0]));

                // Merge features from ALL other active boosts/plans into this one
                if (allActive.length > 1) {
                    const mergedFeatures = { ...(activeSubscription.plan.dashboardFeatures || {}) };
                    
                    for (let i = 1; i < allActive.length; i++) {
                        const nextFeatures = allActive[i].plan.dashboardFeatures || {};
                        Object.keys(nextFeatures).forEach(key => {
                            if (typeof nextFeatures[key] === 'boolean') {
                                mergedFeatures[key] = mergedFeatures[key] || nextFeatures[key];
                            } else if (typeof nextFeatures[key] === 'number') {
                                mergedFeatures[key] = Math.max(mergedFeatures[key] || 0, nextFeatures[key]);
                            }
                        });
                    }
                    activeSubscription.plan.dashboardFeatures = mergedFeatures;
                }
            }

            // Attaching normalized sub to vendor for frontend consumption
            (user.vendor as any).activeSubscription = activeSubscription;
        }

        // Attempt to update online status but don't fail profile retrieval if it fails
        try {
            user.isOnline = true;
            user.lastActiveAt = new Date();
            await this.userRepository.save(user);
        } catch (error) {
            console.error(`[UsersService] Failed to update user online status for ${id}:`, error.message);
            // We ignore this error and continue with the profile result
        }

        return user;
    }

    /**
     * Update user profile
     */
    async updateProfile(id: string, updateUserDto: UpdateUserDto): Promise<User> {
        console.log(`[UsersService] Updating profile for user ${id}:`, JSON.stringify(updateUserDto, null, 2));
        const user = await this.getProfile(id);

        Object.assign(user, updateUserDto);
        const savedUser = await this.userRepository.save(user);
        console.log(`[UsersService] Profile saved successfully for user ${id}`);

        // Re-fetch to ensure everything is up to date and relations are populated
        return this.getProfile(id);
    }

    /**
     * Update user avatar
     */
    async updateAvatar(id: string, filename: string): Promise<User> {
        console.log(`[UsersService] Updating avatar for user ${id}`);
        const user = await this.getProfile(id);
        user.avatarUrl = filename;
        await this.userRepository.save(user);

        console.log(`[UsersService] Avatar saved successfully for user ${id}`);
        return this.getProfile(id);
    }

    /**
     * Change user password
     */
    async changePassword(id: string, dto: ChangePasswordDto): Promise<void> {
        const user = await this.userRepository.findOne({
            where: { id },
            select: ['id', 'password'],
        });

        if (!user) throw new NotFoundException('User not found');
        if (!user.password) throw new ConflictException('User does not have a password set');

        const isPasswordValid = await bcrypt.compare(dto.oldPassword, user.password);
        if (!isPasswordValid) throw new ConflictException('Invalid old password');

        const hashedPassword = await bcrypt.hash(dto.newPassword, 10);
        user.password = hashedPassword;
        await this.userRepository.save(user);
    }

    /**
     * Add to favorites
     */
    async addFavorite(userId: string, businessId: string): Promise<void> {
        // Check if business exists
        const business = await this.businessRepository.findOne({ where: { id: businessId } });
        if (!business) throw new NotFoundException('Business not found');

        // Check if already favoring
        const existing = await this.savedListingRepository.findOne({ where: { userId, businessId } });
        if (existing) return;

        const savedListing = this.savedListingRepository.create({ userId, businessId });
        await this.savedListingRepository.save(savedListing);
    }

    /**
     * Remove from favorites
     */
    async removeFavorite(userId: string, businessId: string): Promise<void> {
        const savedListing = await this.savedListingRepository.findOne({ where: { userId, businessId } });
        if (!savedListing) throw new NotFoundException('Saved listing not found');

        await this.savedListingRepository.remove(savedListing);
    }

    /**
     * Get user favorites
     */
    async getFavorites(userId: string, page = 1, limit = 20) {
        console.log(`[UsersService] Fetching favorites for userId: ${userId}`);
        const skip = calculateSkip(page, limit);

        const [savedListings, total] = await this.savedListingRepository.findAndCount({
            where: { userId },
            relations: ['business', 'business.category'],
            skip,
            take: limit,
            order: { createdAt: 'DESC' },
        });

        return createPaginatedResponse(
            savedListings.map((f) => f.business),
            page,
            limit,
            total,
        );
    }

    /**
     * Add saved offer/event
     */
    async addSavedOfferEvent(userId: string, offerEventId: string): Promise<void> {
        const offerEvent = await this.offerEventRepository.findOne({ where: { id: offerEventId } });
        if (!offerEvent) throw new NotFoundException('Offer/Event not found');

        const existing = await this.savedOfferEventRepository.findOne({ where: { userId, offerEventId } });
        if (existing) return;

        const saved = this.savedOfferEventRepository.create({ userId, offerEventId });
        await this.savedOfferEventRepository.save(saved);
    }

    /**
     * Remove saved offer/event
     */
    async removeSavedOfferEvent(userId: string, offerEventId: string): Promise<void> {
        const saved = await this.savedOfferEventRepository.findOne({ where: { userId, offerEventId } });
        if (!saved) throw new NotFoundException('Saved offer/event not found');

        await this.savedOfferEventRepository.remove(saved);
    }

    /**
     * Get saved offers/events
     */
    async getSavedOfferEvents(userId: string, page = 1, limit = 20) {
        const skip = calculateSkip(page, limit);

        const [savedItems, total] = await this.savedOfferEventRepository.findAndCount({
            where: { userId },
            relations: ['offerEvent', 'offerEvent.business'],
            skip,
            take: limit,
            order: { createdAt: 'DESC' },
        });

        return createPaginatedResponse(
            savedItems.map((s) => s.offerEvent),
            page,
            limit,
            total,
        );
    }

    /**
     * Get user notifications
     */
    async getNotifications(userId: string, page = 1, limit = 20) {
        const skip = calculateSkip(page, limit);

        const [notifications, total] = await this.notificationRepository.findAndCount({
            where: { userId },
            skip,
            take: limit,
            order: { createdAt: 'DESC' },
        });

        return createPaginatedResponse(notifications, page, limit, total);
    }

    /**
     * Mark notification as read
     */
    async markNotificationRead(userId: string, notificationId: string): Promise<void> {
        const notification = await this.notificationRepository.findOne({
            where: { id: notificationId, userId },
        });

        if (!notification) throw new NotFoundException('Notification not found');

        notification.isRead = true;
        notification.readAt = new Date();
        await this.notificationRepository.save(notification);
    }

    /**
     * ADMIN: Find user by email
     */
    async findByEmail(email: string): Promise<User | null> {
        return this.userRepository.findOne({ where: { email } });
    }

    /**
     * Request account deletion (scheduled for 30 days from now)
     */
    async requestDeletion(id: string): Promise<User> {
        const user = await this.userRepository.findOne({
            where: { id },
            relations: ['vendor', 'vendor.businesses'],
        });

        if (!user) throw new NotFoundException('User not found');
        if (user.deletionScheduledAt) return this.getProfile(id);

        const now = new Date();
        const holdReason = !user.isActive ? 'Account is suspended' : null;

        user.deletionCancelledAt = null;
        user.deletionCompletedAt = null;
        user.deletionHoldReason = holdReason;
        user.deletionHoldStartedAt = holdReason ? now : null;
        user.deletionReminderSentAt = null;
        user.deletionFinalReminderSentAt = null;

        if (!holdReason) {
            user.deletionScheduledAt = now;
        }

        await this.hideOwnedBusinesses(user, true);
        await this.appendDeletionAudit(user, 'deletion_requested', {
            holdReason,
            scheduledAt: user.deletionScheduledAt?.toISOString() || null,
        });

        await this.userRepository.save(user);
        return this.getProfile(id);
    }

    /**
     * Cancel scheduled account deletion
     */
    async cancelDeletion(id: string): Promise<User> {
        const user = await this.userRepository.findOne({
            where: { id },
            relations: ['vendor', 'vendor.businesses'],
        });
        if (!user) throw new NotFoundException('User not found');

        user.deletionScheduledAt = null;
        user.deletionHoldReason = null;
        user.deletionHoldStartedAt = null;
        user.deletionReminderSentAt = null;
        user.deletionFinalReminderSentAt = null;
        user.deletionCancelledAt = new Date();

        await this.hideOwnedBusinesses(user, false);
        await this.appendDeletionAudit(user, 'deletion_cancelled', {});
        return this.userRepository.save(user);
    }

    /**
     * Update notification settings
     */
    async updateNotificationSettings(userId: string, settings: any): Promise<User> {
        const user = await this.getProfile(userId);
        // Deep merge or replace
        user.notificationSettings = settings;
        return this.userRepository.save(user);
    }

    /**
     * Update FCM device token
     */
    async updateDeviceToken(userId: string, token: string): Promise<User> {
        const user = await this.getProfile(userId);
        user.deviceToken = token;
        return this.userRepository.save(user);
    }

    /**
     * Permanent deletion of accounts that have passed their 30-day grace period
     */
    @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
    async handlePermanentDeletion() {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const usersToDelete = await this.userRepository.find({
            where: {
                deletionScheduledAt: LessThanOrEqual(thirtyDaysAgo),
            },
            relations: ['vendor', 'vendor.businesses'],
        });

        if (usersToDelete.length > 0) {
            console.log(`[UsersService] Found ${usersToDelete.length} accounts for permanent deletion`);
            for (const user of usersToDelete) {
                try {
                    await this.completeDeletion(user);
                    console.log(`[UsersService] Permanently deleted user ${user.id} (${user.email})`);
                } catch (error) {
                    console.error(`[UsersService] Failed to permanently delete user ${user.id}:`, error.message);
                }
            }
        }
    }

    private async hideOwnedBusinesses(user: User, hidden: boolean): Promise<void> {
        const businessIds = user.vendor?.businesses?.map((business: Listing) => business.id).filter(Boolean) || [];
        if (businessIds.length === 0) return;

        await this.businessRepository
            .createQueryBuilder()
            .update(Listing)
            .set({ hiddenByDeletion: hidden })
            .whereInIds(businessIds)
            .execute();
    }

    private async completeDeletion(user: User): Promise<void> {
        const reloaded = await this.userRepository.findOne({
            where: { id: user.id },
            relations: ['vendor', 'vendor.businesses', 'reviews', 'notifications', 'leads', 'savedListings', 'comments', 'savedOfferEvents'],
        });

        if (!reloaded) return;

        await this.appendDeletionAudit(reloaded, 'deletion_completed', {});
        await this.hideOwnedBusinesses(reloaded, true);

        if (reloaded.notifications?.length) {
            await this.notificationRepository.remove(reloaded.notifications);
        }
        if (reloaded.leads?.length) {
            await this.leadRepository.delete({ userId: reloaded.id });
        }
        if (reloaded.savedListings?.length) {
            await this.savedListingRepository.delete({ userId: reloaded.id });
        }
        if (reloaded.savedOfferEvents?.length) {
            await this.savedOfferEventRepository.delete({ userId: reloaded.id });
        }
        if (reloaded.comments?.length) {
            await this.commentRepository.delete({ userId: reloaded.id });
        }

        if (reloaded.vendor) {
            reloaded.vendor.businessName = 'Deleted Business';
            reloaded.vendor.businessEmail = null;
            reloaded.vendor.businessPhone = null;
            reloaded.vendor.businessAddress = null;
            reloaded.vendor.bio = null;
            reloaded.vendor.isVerified = false;
            await this.vendorRepository.save(reloaded.vendor);
        }

        reloaded.fullName = 'Deleted User';
        reloaded.avatarUrl = null;
        reloaded.phone = null;
        reloaded.city = null;
        reloaded.state = null;
        reloaded.country = null;
        reloaded.googleId = null;
        reloaded.facebookId = null;
        reloaded.pendingReferralCode = null;
        reloaded.password = null;
        reloaded.deviceToken = null;
        reloaded.pushSubscriptions = [];
        reloaded.verificationOtp = null;
        reloaded.otpExpiresAt = null;
        reloaded.deletionScheduledAt = null;
        reloaded.deletionHoldReason = null;
        reloaded.deletionHoldStartedAt = null;
        reloaded.deletionReminderSentAt = null;
        reloaded.deletionFinalReminderSentAt = null;
        reloaded.deletionCancelledAt = null;
        reloaded.deletionCompletedAt = new Date();
        reloaded.isActive = false;
        reloaded.isEmailVerified = false;
        reloaded.isPhoneVerified = false;

        await this.userRepository.save(reloaded);
    }

    private async appendDeletionAudit(user: User, eventType: string, details: Record<string, any>) {
        const hash = createHash('sha256').update(`${user.id}:${user.email || ''}`).digest('hex');
        try {
            await this.userRepository.query(
                `INSERT INTO deletion_audit_logs (account_id_hash, user_id, event_type, details) VALUES ($1, $2, $3, $4)`,
                [hash, user.id, eventType, JSON.stringify(details || {})],
            );
        } catch (error) {
            console.warn(`[UsersService] Failed to write deletion audit log (${eventType}): ${error.message}`);
        }
    }
}
