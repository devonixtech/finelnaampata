import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Brackets } from 'typeorm';
import { User, UserRole } from '../../entities/user.entity';
import { Listing, BusinessStatus } from '../../entities/business.entity';
import { Review } from '../../entities/review.entity';
import { Vendor } from '../../entities/vendor.entity';
import { Transaction } from '../../entities/transaction.entity';
import { SystemSetting } from '../../entities/system-setting.entity';
import { ModerateBusinessDto, ModerateReviewDto } from './dto/moderate.dto';
import { BusinessHours } from '../../entities/business-hours.entity';
import { BusinessAmenity } from '../../entities/business-amenity.entity';
import { Lead } from '../../entities/lead.entity';
import { SavedListing } from '../../entities/favorite.entity';
import { Comment as BusinessComment } from '../../entities/comment.entity';
import { Notification } from '../../entities/notification.entity';
import { Subscription, SubscriptionStatus } from '../../entities/subscription.entity';
import { CommentReply } from '../../entities/comment-reply.entity';
import { createPaginatedResponse, calculateSkip } from '../../common/utils/pagination.util';
import { SearchLog } from '../../entities/search-log.entity';
import { SearchService } from '../search/search.service';
import { NotificationsService } from '../notifications/notifications.service';
import { VendorAttribute } from '../../entities/vendor-attribute.entity';
import { BusinessQuestion } from '../../entities/business-question.entity';
import { SearchLocationService } from '../location/search-location.service';

@Injectable()
export class AdminService {
    constructor(
        @InjectRepository(User)
        private userRepository: Repository<User>,
        @InjectRepository(Listing)
        private businessRepository: Repository<Listing>,
        @InjectRepository(Review)
        private reviewRepository: Repository<Review>,
        @InjectRepository(Vendor)
        private vendorRepository: Repository<Vendor>,
        @InjectRepository(Transaction)
        private transactionRepository: Repository<Transaction>,
        @InjectRepository(SystemSetting)
        private settingsRepository: Repository<SystemSetting>,
        @InjectRepository(BusinessHours)
        private businessHoursRepository: Repository<BusinessHours>,
        @InjectRepository(BusinessAmenity)
        private businessAmenityRepository: Repository<BusinessAmenity>,
        @InjectRepository(Lead)
        private leadRepository: Repository<Lead>,
        @InjectRepository(SavedListing)
        private favoriteRepository: Repository<SavedListing>,
        @InjectRepository(BusinessComment)
        private commentRepository: Repository<BusinessComment>,
        @InjectRepository(Notification)
        private notificationRepository: Repository<Notification>,
        @InjectRepository(Subscription)
        private subscriptionRepository: Repository<Subscription>,
        @InjectRepository(CommentReply)
        private commentReplyRepository: Repository<CommentReply>,
        @InjectRepository(SearchLog)
        private searchLogRepository: Repository<SearchLog>,
        @InjectRepository(VendorAttribute)
        private attributeRepository: Repository<VendorAttribute>,
        @InjectRepository(BusinessQuestion)
        private questionRepository: Repository<BusinessQuestion>,
        private searchService: SearchService,
        private notificationsService: NotificationsService,
        private searchLocationService: SearchLocationService,
    ) { }

    private async invalidateBusinessSearchCache(business: Listing | null | undefined) {
        if (!business) return;
        await this.searchLocationService.invalidateCity(business.city);
        await this.searchLocationService.invalidateCityCategory(
            business.city,
            business.category?.slug || business.categoryId || 'all',
        );
    }

    /**
     * Get all system settings
     */
    async getSettings() {
        const settings = await this.settingsRepository.find();
        return settings.reduce((acc, curr) => {
            acc[curr.key] = curr.value;
            return acc;
        }, {});
    }

    /**
     * Update system settings
     */
    async updateSettings(settings: Record<string, string>) {
        const entries = Object.entries(settings);
        for (const [key, value] of entries) {
            let setting = await this.settingsRepository.findOne({ where: { key } });
            if (!setting) {
                setting = this.settingsRepository.create({ key, value, group: 'general' });
            } else {
                setting.value = value;
            }
            await this.settingsRepository.save(setting);
        }
        return this.getSettings();
    }

    /**
     * Get global site statistics
     */
    async getGlobalStats() {
        const userCount = await this.userRepository.count();
        const vendorCount = await this.vendorRepository.count();
        const businessCount = await this.businessRepository.count();
        const pendingBusinessCount = await this.businessRepository.count({
            where: { status: BusinessStatus.PENDING },
        });
        const reviewCount = await this.reviewRepository.count();

        const activeSubscriptionCount = await this.subscriptionRepository.count({
            where: { status: SubscriptionStatus.ACTIVE },
        });

        const revenue = await this.transactionRepository
            .createQueryBuilder('transaction')
            .select('SUM(transaction.amount)', 'total')
            .where('transaction.status = :status', { status: 'completed' })
            .getRawOne();

        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const monthlyRevenue = await this.transactionRepository
            .createQueryBuilder('transaction')
            .select('SUM(transaction.amount)', 'total')
            .where('transaction.status = :status', { status: 'completed' })
            .andWhere('transaction.created_at >= :startOfMonth', { startOfMonth })
            .getRawOne();

        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
        sixMonthsAgo.setDate(1);
        sixMonthsAgo.setHours(0, 0, 0, 0);

        const monthlyGraphDataRaw = await this.transactionRepository
            .createQueryBuilder('transaction')
            .select("TO_CHAR(transaction.created_at, 'Mon')", 'month')
            .addSelect("SUM(transaction.amount)", 'revenue')
            .where('transaction.status = :status', { status: 'completed' })
            .andWhere('transaction.created_at >= :sixMonthsAgo', { sixMonthsAgo })
            .groupBy("TO_CHAR(transaction.created_at, 'Mon')")
            .addGroupBy("EXTRACT(MONTH FROM transaction.created_at)")
            .orderBy("EXTRACT(MONTH FROM transaction.created_at)", "ASC")
            .getRawMany();

        const monthlyGraphData = monthlyGraphDataRaw.map(item => ({
            month: item.month ? item.month.trim() : '',
            revenue: parseFloat(item.revenue || '0')
        }));

        const vendorsGraphDataRaw = await this.vendorRepository
            .createQueryBuilder('vendor')
            .select("TO_CHAR(vendor.created_at, 'Mon')", 'month')
            .addSelect("COUNT(vendor.id)", 'count')
            .where('vendor.created_at >= :sixMonthsAgo', { sixMonthsAgo })
            .groupBy("TO_CHAR(vendor.created_at, 'Mon')")
            .addGroupBy("EXTRACT(MONTH FROM vendor.created_at)")
            .orderBy("EXTRACT(MONTH FROM vendor.created_at)", "ASC")
            .getRawMany();

        const vendorsGraphData = vendorsGraphDataRaw.map(item => ({
            month: item.month ? item.month.trim() : '',
            count: parseInt(item.count || '0')
        }));

        const subscriptionsGraphDataRaw = await this.subscriptionRepository
            .createQueryBuilder('subscription')
            .select("TO_CHAR(subscription.created_at, 'Mon')", 'month')
            .addSelect("COUNT(subscription.id)", 'count')
            .where('subscription.created_at >= :sixMonthsAgo', { sixMonthsAgo })
            //.andWhere('subscription.status = :status', { status: SubscriptionStatus.ACTIVE })
            .groupBy("TO_CHAR(subscription.created_at, 'Mon')")
            .addGroupBy("EXTRACT(MONTH FROM subscription.created_at)")
            .orderBy("EXTRACT(MONTH FROM subscription.created_at)", "ASC")
            .getRawMany();

        const subscriptionsGraphData = subscriptionsGraphDataRaw.map(item => ({
            month: item.month ? item.month.trim() : '',
            count: parseInt(item.count || '0')
        }));

        return {
            totalUsers: userCount,
            totalVendors: vendorCount,
            totalBusinesses: businessCount,
            pendingBusinesses: pendingBusinessCount,
            totalReviews: reviewCount,
            activeSubscriptions: activeSubscriptionCount,
            totalRevenue: parseFloat(revenue?.total || '0'),
            monthlyRevenue: parseFloat(monthlyRevenue?.total || '0'),
            monthlyGraphData,
            vendorsGraphData,
            subscriptionsGraphData,
        };
    }

    /**
     * Get Search Heatmap Data
     */
    async getHeatmapData(startDate?: string, endDate?: string) {
        console.log(`[getHeatmapData] Input dates: ${startDate} to ${endDate}`);
        const query = this.searchLogRepository.createQueryBuilder('log')
            .select('log.latitude', 'latitude')
            .addSelect('log.longitude', 'longitude')
            .addSelect('COUNT(log.id)', 'count')
            .where('log.latitude IS NOT NULL')
            .andWhere('log.longitude IS NOT NULL')
            .groupBy('log.latitude')
            .addGroupBy('log.longitude');

        if (startDate) {
            const start = new Date(startDate);
            start.setUTCHours(0, 0, 0, 0);
            query.andWhere('log.searched_at >= :startDate', { startDate: start });
        }
        if (endDate) {
            const end = new Date(endDate);
            end.setUTCHours(23, 59, 59, 999);
            query.andWhere('log.searched_at <= :endDate', { endDate: end });
        }

        try {
            const rawData = await query.getRawMany();
            console.log(`[getHeatmapData] Found ${rawData.length} distinct location groups.`);

            return rawData.map(item => ({
                latitude: parseFloat(item.latitude),
                longitude: parseFloat(item.longitude),
                weight: parseInt(item.count, 10) || 1,
            }));
        } catch (error) {
            console.error(`[getHeatmapData] Error executing query:`, error);
            throw error;
        }
    }

    /**
     * Moderate a business listing
     */
    async moderateBusiness(id: string, dto: ModerateBusinessDto) {
        const business = await this.businessRepository.findOne({ where: { id } });
        if (!business) throw new NotFoundException('Business not found');

        business.status = dto.status;
        if (dto.status === BusinessStatus.APPROVED) {
            business.approvedAt = new Date();
            business.isVerified = true;
        } else if (dto.status === BusinessStatus.REJECTED) {
            business.rejectedAt = new Date();
            business.rejectionReason = dto.reason;
            business.isVerified = false;
        }

        const moderated = await this.businessRepository.save(business);

        // Fetch fully populated listing for notification (need category name, slug etc)
        const result = await this.businessRepository.findOne({
            where: { id: moderated.id },
            relations: ['category']
        });

        if (dto.status === BusinessStatus.APPROVED && result) {
            // Broadcast to all users: new listing is live
            /* 
            this.notificationsService.broadcast({
                title: '📍 New Business Listed!',
                message: `"${result.title}" just joined ${result.category?.name ? result.category.name + ' listings' : 'our directory'}. Check it out!`,
                type: 'new_listing',
                data: { businessId: result.id, slug: result.slug },
            }).catch(() => {});
            */
        }

        // Update in Elasticsearch (approval status changed)
        this.searchService.indexBusiness(moderated).catch(err => console.error('ES Approval Index Error:', err));
        await this.invalidateBusinessSearchCache(result);

        return moderated;
    }

    /**
     * Moderate a review
     */
    async moderateReview(id: string, dto: ModerateReviewDto) {
        const review = await this.reviewRepository.findOne({ where: { id } });
        if (!review) throw new NotFoundException('Review not found');

        review.isApproved = dto.isApproved;
        return this.reviewRepository.save(review);
    }

    /**
     * Force verify a vendor
     */
    async verifyVendor(vendorId: string, isVerified = true) {
        const vendor = await this.vendorRepository.findOne({ where: { id: vendorId } });
        if (!vendor) throw new NotFoundException('Vendor not found');

        vendor.isVerified = isVerified;
        const updated = await this.vendorRepository.save(vendor);
        // Note: For simplicity, we don't automatically re-index all vendor businesses here, 
        // as businesses are usually indexed individually.
        return updated;
    }

    /**
     * Toggle a business featured status
     */
    async toggleFeatured(id: string, isFeatured: boolean) {
        const business = await this.businessRepository.findOne({ where: { id } });
        if (!business) throw new NotFoundException('Business not found');

        business.isFeatured = isFeatured;
        const updated = await this.businessRepository.save(business);

        // Update in Elasticsearch
        this.searchService.indexBusiness(updated).catch(err => console.error('ES Featured Index Error:', err));
        await this.invalidateBusinessSearchCache(updated);

        return updated;
    }

    /**
     * Toggle a business verification status
     */
    async toggleVerifiedListing(id: string, isVerified: boolean) {
        const business = await this.businessRepository.findOne({ where: { id } });
        if (!business) throw new NotFoundException('Business not found');

        business.isVerified = isVerified;
        const updated = await this.businessRepository.save(business);

        // Update in Elasticsearch
        this.searchService.indexBusiness(updated).catch(err => console.error('ES Verified Index Error:', err));
        await this.invalidateBusinessSearchCache(updated);

        return updated;
    }

    /**
     * Get all users for admin management
     */
    async getAllUsers(page = 1, limit = 20) {
        const skip = calculateSkip(page, limit);

        const [users, total] = await this.userRepository.findAndCount({
            order: { createdAt: 'DESC' },
            skip,
            take: limit,
        });

        return createPaginatedResponse(users, page, limit, total);
    }

    /**
     * Get complete user details for admin
     */
    async getUserDetails(userId: string) {
        const user = await this.userRepository.findOne({
            where: { id: userId },
            relations: [
                'vendor',
                'vendor.businesses',
                'vendor.businesses.category',
                'vendor.subscriptions',
                'vendor.subscriptions.plan',
                'reviews',
                'reviews.business',
                'leads',
                'savedListings',
                'savedListings.business',
                'comments',
                'affiliate'
            ],
        });

        if (!user) throw new NotFoundException('User not found');

        // Add some aggregates
        const totalSpent = user.vendor?.subscriptions?.reduce((sum, s) => sum + (Number(s.amount) || 0), 0) || 0;

        // Fetch vendor attributes (setup details like features, payment methods, service mode)
        let setupData: Record<string, string[]> = null;
        if (user.vendor) {
            const [attributes, questions] = await Promise.all([
                this.attributeRepository.find({ where: { vendorId: user.vendor.id } }),
                this.questionRepository.find()
            ]);

            const answers: Record<string, string[]> = {};
            attributes.forEach(attr => {
                // Find matching question to get its category
                const question = questions.find(q => q.id === attr.attributeKey);
                const key = question ? question.category : attr.attributeKey;

                if (!answers[key]) {
                    answers[key] = [];
                }
                answers[key].push(attr.attributeValue);
            });
            setupData = answers;
        }

        return {
            ...user,
            stats: {
                totalSpent,
                businessCount: user.vendor?.businesses?.length || 0,
                reviewCount: user.reviews?.length || 0,
                leadCount: user.leads?.length || 0,
                favoriteCount: user.savedListings?.length || 0
            },
            setupData
        };
    }

    /**
     * Update a user's role
     */
    async updateUserRole(userId: string, role: UserRole) {
        const allowedRoles = [UserRole.USER, UserRole.VENDOR, UserRole.ADMIN];
        if (!allowedRoles.includes(role)) {
            throw new BadRequestException('Invalid role. Only user, vendor, or admin allowed.');
        }

        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (!user) throw new NotFoundException('User not found');

        user.role = role;
        return this.userRepository.save(user);
    }

    /**
     * Toggle a user's active status
     */
    async toggleUserStatus(userId: string, isActive: boolean) {
        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (!user) throw new NotFoundException('User not found');

        user.isActive = isActive;
        return this.userRepository.save(user);
    }

    /**
     * Delete a user and all related data
     */
    async deleteUser(userId: string) {
        const log = (msg: string) => {
            const fs = require('fs');
            const path = require('path');
            const logFile = path.join(process.cwd(), 'debug_logs.txt');
            fs.appendFileSync(logFile, `[${new Date().toISOString()}] [AdminService] deleteUser: ${msg}\n`);
        };

        log(`Attempting to delete user: ${userId}`);
        try {
            const user = await this.userRepository.findOne({
                where: { id: userId },
                relations: [
                    'vendor',
                    'vendor.businesses',
                    'notifications',
                    'reviews',
                    'leads',
                    'savedListings',
                    'comments'
                ],
            });

            if (!user) {
                log(`User ${userId} NOT FOUND`);
                throw new NotFoundException('User not found');
            }

            log(`Found user: ${user.email}. Role: ${user.role}. Starting manual cleanup...`);

            // 1. Delete user-specific relations
            if (user.notifications?.length > 0) {
                log(`Deleting ${user.notifications.length} notifications`);
                await this.notificationRepository.remove(user.notifications);
            }
            if (user.reviews?.length > 0) {
                log(`Deleting ${user.reviews.length} written reviews`);
                await this.reviewRepository.remove(user.reviews);
            }
            if (user.leads?.length > 0) {
                log(`Deleting ${user.leads.length} user leads`);
                await this.leadRepository.remove(user.leads);
            }
            if (user.savedListings?.length > 0) {
                log(`Deleting ${user.savedListings.length} favorite entries`);
                await this.favoriteRepository.remove(user.savedListings);
            }
            if (user.comments?.length > 0) {
                log(`Deleting ${user.comments.length} user comments`);
                await this.commentRepository.remove(user.comments as any);
            }

            // 2. If vendor, delete all their businesses properly
            if (user.vendor) {
                log(`User has a vendor profile. Cleaning up vendor data...`);

                // 2a. Recursive cleanup for businesses
                if (user.vendor.businesses?.length > 0) {
                    log(`Recursive cleanup for ${user.vendor.businesses.length} businesses...`);
                    const bizIds = user.vendor.businesses.map(b => b.id);
                    for (const bizId of bizIds) {
                        try {
                            await this.deleteBusiness(bizId);
                        } catch (e) {
                            log(`Warning: Failed to delete nested business ${bizId}: ${e.message}`);
                        }
                    }
                }

                // 2b. Cleanup Transactions (many-to-one with Vendor)
                log(`Cleaning up transactions...`);
                await this.transactionRepository.delete({ vendorId: user.vendor.id });

                // 2c. Cleanup Subscriptions (many-to-one with Vendor)
                log(`Cleaning up subscriptions...`);
                await this.subscriptionRepository.delete({ vendorId: user.vendor.id });

                // 2d. Cleanup Comment Replies (many-to-one with Vendor)
                log(`Cleaning up vendor replies...`);
                await this.commentReplyRepository.delete({ vendorId: user.vendor.id });

                log(`Removing vendor record...`);
                await this.vendorRepository.remove(user.vendor);
            }

            log(`Final user record removal...`);
            const result = await this.userRepository.remove(user);
            log(`Successfully removed user: ${userId}`);
            return result;

        } catch (error: any) {
            log(`ERROR deleting user ${userId}: ${error.message}\n${error.stack}`);
            throw error;
        }
    }

    /**
     * Get all businesses with filters
     */
    async getAllBusinesses(page = 1, limit = 20, status?: BusinessStatus, search?: string) {
        const skip = calculateSkip(page, limit);
        const query = this.businessRepository.createQueryBuilder('business')
            .leftJoinAndSelect('business.vendor', 'vendor')
            .leftJoinAndSelect('vendor.user', 'user')
            .leftJoinAndSelect('vendor.subscriptions', 'subscriptions', 'subscriptions.status = :activeStatus', { activeStatus: SubscriptionStatus.ACTIVE })
            .leftJoinAndSelect('subscriptions.plan', 'plan')
            .leftJoinAndSelect('business.category', 'category')
            .orderBy('business.createdAt', 'DESC')
            .skip(skip)
            .take(limit);

        if (status) {
            query.andWhere('business.status = :status', { status });
        }

        if (search) {
            query.andWhere(
                new Brackets((qb) => {
                    qb.where('business.title ILIKE :search', { search: `%${search}%` })
                        .orWhere('business.address ILIKE :search', { search: `%${search}%` })
                        .orWhere('business.city ILIKE :search', { search: `%${search}%` });
                }),
            );
        }

        const [businesses, total] = await query.getManyAndCount();
        return createPaginatedResponse(businesses, page, limit, total);
    }

    /**
     * Delete a business and related records
     */
    async deleteBusiness(id: string) {
        const log = (msg: string) => {
            const fs = require('fs');
            const path = require('path');
            const logFile = path.join(process.cwd(), 'debug_logs.txt');
            fs.appendFileSync(logFile, `[${new Date().toISOString()}] [AdminService] deleteBusiness: ${msg}\n`);
        };

        log(`Attempting to delete business: ${id}`);
        try {
            const business = await this.businessRepository.findOne({
                where: { id },
                relations: ['businessHours', 'businessAmenities', 'reviews', 'leads', 'savedListings', 'comments'],
            });

            if (!business) {
                log(`Business ${id} NOT FOUND`);
                throw new NotFoundException('Business not found');
            }

            log(`Found business: ${business.title}. Starting manual cleanup...`);

            // Manual cleanup of relations to avoid foreign key violations
            if (business.businessHours?.length > 0) {
                log(`Deleting ${business.businessHours.length} business hours`);
                await this.businessHoursRepository.remove(business.businessHours);
            }
            if (business.businessAmenities?.length > 0) {
                log(`Deleting ${business.businessAmenities.length} business amenities`);
                await this.businessAmenityRepository.remove(business.businessAmenities);
            }
            if (business.reviews?.length > 0) {
                log(`Deleting ${business.reviews.length} reviews`);
                await this.reviewRepository.remove(business.reviews);
            }
            if (business.leads?.length > 0) {
                log(`Deleting ${business.leads.length} leads`);
                await this.leadRepository.remove(business.leads);
            }
            if (business.savedListings?.length > 0) {
                log(`Deleting ${business.savedListings.length} favorite entries`);
                await this.favoriteRepository.remove(business.savedListings);
            }
            if (business.comments?.length > 0) {
                log(`Deleting ${business.comments.length} comments`);
                await this.commentRepository.remove(business.comments as any);
            }

            log(`Main record removal...`);
            await this.invalidateBusinessSearchCache(business);
            const result = await this.businessRepository.remove(business);

            // Remove from Elasticsearch
            this.searchService.remove(id).catch(err => console.error('ES Delete Index Error:', err));

            log(`Successfully removed business: ${id}`);
            return result;
        } catch (error: any) {
            log(`ERROR deleting business ${id}: ${error.message}\n${error.stack}`);
            throw error;
        }
    }

    /**
     * Get all vendors with filters
     */
    async getAllVendors(page = 1, limit = 20, isVerified?: boolean, search?: string) {
        const skip = calculateSkip(page, limit);
        const query = this.vendorRepository.createQueryBuilder('vendor')
            .leftJoinAndSelect('vendor.user', 'user')
            .orderBy('vendor.createdAt', 'DESC')
            .skip(skip)
            .take(limit);

        if (isVerified !== undefined) {
            query.andWhere('vendor.isVerified = :isVerified', { isVerified });
        }

        if (search) {
            query.andWhere(
                '(vendor.businessName ILIKE :search OR vendor.businessEmail ILIKE :search)',
                { search: `%${search}%` },
            );
        }

        const [vendors, total] = await query.getManyAndCount();

        // Get total verified count for the dashboard
        const totalVerified = await this.vendorRepository.count({ where: { isVerified: true } });

        const response = createPaginatedResponse(vendors, page, limit, total);
        return {
            ...response,
            meta: {
                ...response.meta,
                totalVerified,
            },
        };
    }

    /**
     * Update search keywords for a business
     */
    async updateSearchKeywords(id: string, keywords: string[]) {
        const business = await this.businessRepository.findOne({
            where: { id },
            relations: ['vendor', 'vendor.subscriptions', 'vendor.subscriptions.plan'],
        });
        if (!business) throw new NotFoundException('Business not found');

        // Check plan limits
        const activeSubscription = business.vendor?.subscriptions?.find(s => s.status === SubscriptionStatus.ACTIVE);
        const planLimit = activeSubscription?.plan?.dashboardFeatures?.['maxKeywords'] || 0;

        if (keywords.length > planLimit) {
            throw new BadRequestException(`Keyword limit exceeded for this plan (${planLimit} allowed)`);
        }

        business.searchKeywords = keywords;
        const updated = await this.businessRepository.save(business);

        // Update in Elasticsearch
        this.searchService.indexBusiness(updated).catch(err => console.error('ES Keyword Index Error:', err));
        return updated;
    }

    /**
     * Schedule a user for deletion in 30 days
     */
    async scheduleUserDeletion(userId: string) {
        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (!user) throw new NotFoundException('User not found');

        const scheduledDate = new Date();
        scheduledDate.setDate(scheduledDate.getDate() + 30); // 30 days grace period

        user.deletionScheduledAt = scheduledDate;
        await this.userRepository.save(user);

        return { message: 'User scheduled for deletion', deletionScheduledAt: scheduledDate };
    }

    /**
     * Cancel a scheduled user deletion
     */
    async cancelUserDeletion(userId: string) {
        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (!user) throw new NotFoundException('User not found');

        if (!user.deletionScheduledAt) {
            throw new BadRequestException('Deletion not scheduled for this user');
        }

        user.deletionScheduledAt = null;
        await this.userRepository.save(user);

        return { message: 'Account deletion cancelled successfully' };
    }
}
