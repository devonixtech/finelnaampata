import {
    Injectable,
    NotFoundException,
    ForbiddenException,
    ConflictException,
    BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Review } from '../../entities/review.entity';
import { ReviewHelpfulVote } from '../../entities/review-helpful-vote.entity';
import { Listing } from '../../entities/business.entity';
import { Vendor } from '../../entities/vendor.entity';
import { User, UserRole } from '../../entities/user.entity';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { VendorResponseDto } from './dto/vendor-response.dto';
import { GetReviewsDto } from './dto/get-reviews.dto';
import { CreateReviewReplyDto } from './dto/create-review-reply.dto';
import { ReviewReply } from '../../entities/review-reply.entity';
import {
    createPaginatedResponse,
    calculateSkip,
} from '../../common/utils/pagination.util';
import { ReviewDetectionService } from './review-detection.service';
import { TrustService } from '../users/trust.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';

@Injectable()
export class ReviewsService {
    constructor(
        @InjectRepository(Review)
        private reviewRepository: Repository<Review>,
        @InjectRepository(ReviewHelpfulVote)
        private reviewHelpfulVoteRepository: Repository<ReviewHelpfulVote>,
        @InjectRepository(Listing)
        private listingRepository: Repository<Listing>,
        @InjectRepository(ReviewReply)
        private reviewReplyRepository: Repository<ReviewReply>,
        @InjectRepository(Vendor)
        private vendorRepository: Repository<Vendor>,
        private reviewDetectionService: ReviewDetectionService,
        private trustService: TrustService,
        private subscriptionsService: SubscriptionsService,
    ) { }

    /**
     * Create a reply to a review
     */
    async createReply(reviewId: string, createReviewReplyDto: CreateReviewReplyDto, user: User): Promise<ReviewReply> {
        const review = await this.reviewRepository.findOne({
            where: { id: reviewId },
        });

        if (!review) {
            throw new NotFoundException('Review not found');
        }

        const reply = this.reviewReplyRepository.create({
            ...createReviewReplyDto,
            reviewId,
            userId: user.id,
            isApproved: true, // Default to approved unless there's moderation
        });

        return this.reviewReplyRepository.save(reply);
    }

    /**
     * Find replies for a review
     */
    async findReplies(reviewId: string): Promise<ReviewReply[]> {
        return this.reviewReplyRepository.find({
            where: { reviewId, isApproved: true },
            relations: ['user'],
            order: { createdAt: 'ASC' },
        });
    }

    /**
     * Create a new review
     */
    async create(createReviewDto: CreateReviewDto, user: User, ipAddress?: string): Promise<Review> {
        const { businessId } = createReviewDto;

        // Verify listing exists and load vendor relation
        const listing = await this.listingRepository.findOne({
            where: { id: businessId },
            relations: ['vendor'],
        });

        if (!listing) {
            throw new NotFoundException('Listing not found');
        }

        // Prevent vendors from reviewing their own listing
        if (listing.vendor?.userId === user.id) {
            throw new ForbiddenException('You cannot review your own business listing');
        }

        // Check if user already reviewed this business
        const existingReview = await this.reviewRepository.findOne({
            where: {
                businessId,
                userId: user.id,
            },
        });

        if (existingReview) {
            throw new ConflictException('You have already reviewed this business');
        }

        // Create review - always approved by default.
        // Suspicious reviews are only FLAGGED for admin review, not auto-rejected.
        const review = this.reviewRepository.create({
            ...createReviewDto,
            userId: user.id,
            ipAddress,
            isApproved: true, // Always visible to customers
        });

        // Run suspicion detection (flags for admin attention, does not auto-reject)
        const analysis = await this.reviewDetectionService.analyzeReview(review);
        review.isSuspicious = analysis.isSuspicious;
        review.suspicionScore = analysis.score;
        review.suspicionReason = analysis.reason;

        const savedReview = await this.reviewRepository.save(review);

        // Update business rating
        await this.updateBusinessRating(businessId);

        // Update user trust score
        await this.trustService.updateTrustScore(user.id);

        return this.findOne(savedReview.id);
    }

    /**
     * Get reviews with filters
     */
    async findAll(getReviewsDto: GetReviewsDto) {
        try {
            const { businessId, userId, vendorId } = getReviewsDto;
            
            // Explicitly convert types to avoid TypeORM/Postgres issues with strings
            const page = Number(getReviewsDto.page) || 1;
            const limit = Number(getReviewsDto.limit) || 20;
            const rating = getReviewsDto.rating ? Number(getReviewsDto.rating) : undefined;
            
            const skip = calculateSkip(page, limit);

            const queryBuilder = this.reviewRepository
                .createQueryBuilder('review')
                .leftJoinAndSelect('review.user', 'user')
                .leftJoinAndSelect('review.business', 'business')
                .leftJoinAndSelect('review.replies', 'replies', 'replies.isApproved = :replyApproved', { replyApproved: true })
                .leftJoinAndSelect('replies.user', 'replyUser')
                .where('review.isApproved = :isApproved', { isApproved: true });

            // Filter by business
            if (businessId) {
                queryBuilder.andWhere('review.businessId = :businessId', { businessId });
            }

            // Filter by user
            if (userId) {
                queryBuilder.andWhere('review.userId = :userId', { userId });
            }

            // Filter by rating
            if (rating !== undefined && !isNaN(rating)) {
                queryBuilder.andWhere('review.rating = :rating', { rating });
            }

            // Filter by vendor
            if (vendorId) {
                queryBuilder.andWhere('business.vendorId = :vendorId', { vendorId });
            }

            // Order by newest first
            queryBuilder.orderBy('review.createdAt', 'DESC');

            // Get total count and paginated results
            const [reviews, total] = await Promise.all([
                queryBuilder.skip(skip).take(limit).getMany(),
                queryBuilder.getCount()
            ]);

            return createPaginatedResponse(reviews, page, limit, total);
        } catch (error) {
            console.error('Error in ReviewsService.findAll:', error);
            throw new BadRequestException('Could not retrieve reviews. Please check your filter parameters.');
        }
    }

    /**
     * Get review by ID
     */
    async findOne(id: string): Promise<Review> {
        const review = await this.reviewRepository.findOne({
            where: { id },
            relations: ['user', 'business', 'helpfulVotes', 'replies', 'replies.user'],
        });

        if (!review) {
            throw new NotFoundException('Review not found');
        }

        return review;
    }

    /**
     * Update review
     */
    async update(
        id: string,
        updateReviewDto: UpdateReviewDto,
        user: User,
    ): Promise<Review> {
        const review = await this.reviewRepository.findOne({
            where: { id },
        });

        if (!review) {
            throw new NotFoundException('Review not found');
        }

        // Check ownership
        if (review.userId !== user.id && user.role !== UserRole.ADMIN) {
            throw new ForbiddenException('You can only update your own reviews');
        }

        // Update review
        await this.reviewRepository.update(id, updateReviewDto);

        // Update business rating if rating changed
        if (updateReviewDto.rating && updateReviewDto.rating !== review.rating) {
            await this.updateBusinessRating(review.businessId);
        }

        // Update user trust score
        await this.trustService.updateTrustScore(review.userId);

        return this.findOne(id);
    }

    /**
     * Delete review
     */
    async remove(id: string, user: User): Promise<void> {
        const review = await this.reviewRepository.findOne({
            where: { id },
        });

        if (!review) {
            throw new NotFoundException('Review not found');
        }

        // Check ownership
        if (review.userId !== user.id && user.role !== UserRole.ADMIN) {
            throw new ForbiddenException('You can only delete your own reviews');
        }

        const businessId = review.businessId;

        await this.reviewRepository.remove(review);

        // Update business rating
        await this.updateBusinessRating(businessId);

        // Update user trust score
        await this.trustService.updateTrustScore(review.userId);
    }

    /**
     * Add vendor response to review
     */
    async addVendorResponse(
        id: string,
        vendorResponseDto: VendorResponseDto,
        user: User,
    ): Promise<Review> {
        const review = await this.reviewRepository.findOne({
            where: { id },
            relations: ['business', 'business.vendor'],
        });

        if (!review) {
            throw new NotFoundException('Review not found');
        }

        // Check if user is the vendor of this business
        if (
            review.business.vendor.userId !== user.id &&
            user.role !== UserRole.ADMIN
        ) {
            throw new ForbiddenException('Only the business owner can respond to reviews');
        }

        if (user.role !== UserRole.ADMIN) {
            const canReply = await this.subscriptionsService.canPerformAction(user.id, 'canReplyReviews');
            if (!canReply) {
                throw new ForbiddenException('Replying to reviews requires a paid plan. Upgrade to respond.');
            }
        }

        // Update review with vendor response
        review.vendorResponse = vendorResponseDto.response;
        review.vendorResponseAt = new Date();

        await this.reviewRepository.save(review);

        return this.findOne(id);
    }

    /**
     * Mark review as helpful
     */
    async markAsHelpful(reviewId: string, user: User): Promise<void> {
        const review = await this.reviewRepository.findOne({
            where: { id: reviewId },
        });

        if (!review) {
            throw new NotFoundException('Review not found');
        }

        // Check if user already marked as helpful
        const existingVote = await this.reviewHelpfulVoteRepository.findOne({
            where: {
                reviewId,
                userId: user.id,
            },
        });

        if (existingVote) {
            throw new ConflictException('You have already marked this review as helpful');
        }

        // Create helpful vote
        const vote = this.reviewHelpfulVoteRepository.create({
            reviewId,
            userId: user.id,
        });

        await this.reviewHelpfulVoteRepository.save(vote);

        // Increment helpful count
        await this.reviewRepository.increment({ id: reviewId }, 'helpfulCount', 1);

        // Update user trust score of the review OWNER
        await this.trustService.updateTrustScore(review.userId);
    }

    /**
     * Remove helpful mark
     */
    async removeHelpfulMark(reviewId: string, user: User): Promise<void> {
        const vote = await this.reviewHelpfulVoteRepository.findOne({
            where: {
                reviewId,
                userId: user.id,
            },
        });

        if (!vote) {
            throw new NotFoundException('Helpful vote not found');
        }

        await this.reviewHelpfulVoteRepository.remove(vote);

        // Decrement helpful count
        await this.reviewRepository.decrement({ id: reviewId }, 'helpfulCount', 1);

        // Update user trust score of the review OWNER
        const review = await this.reviewRepository.findOne({ where: { id: reviewId } });
        if (review) {
            await this.trustService.updateTrustScore(review.userId);
        }
    }

    /**
     * Get business rating statistics
     */
    async getBusinessRatingStats(idOrSlug: string) {
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);

        let listing;

        if (isUuid) {
            listing = await this.listingRepository.findOne({
                where: { id: idOrSlug },
            });
        } else {
            listing = await this.listingRepository.findOne({
                where: { slug: idOrSlug },
            });
        }

        if (!listing) {
            throw new NotFoundException('Business not found');
        }

        const businessId = listing.id;

        const stats = await this.reviewRepository
            .createQueryBuilder('review')
            .select('review.rating', 'rating')
            .addSelect('COUNT(*)', 'count')
            .where('review.businessId = :businessId', { businessId })
            .andWhere('review.isApproved = :isApproved', { isApproved: true })
            .groupBy('review.rating')
            .orderBy('review.rating', 'DESC')
            .getRawMany();

        const ratingDistribution = {
            5: 0,
            4: 0,
            3: 0,
            2: 0,
            1: 0,
        };

        stats.forEach((stat) => {
            ratingDistribution[stat.rating] = parseInt(stat.count);
        });

        return {
            averageRating: listing.averageRating,
            totalReviews: listing.totalReviews,
            ratingDistribution,
        };
    }

    /**
     * Get reviews by business ID or slug
     */
    async findByBusiness(idOrSlug: string, query: GetReviewsDto) {
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);

        let businessId = idOrSlug;

        if (!isUuid) {
            const listing = await this.listingRepository.findOne({
                where: { slug: idOrSlug },
                select: ['id'],
            });

            if (!listing) {
                throw new NotFoundException('Listing not found');
            }

            businessId = listing.id;
        }

        return this.findAll({ ...query, businessId });
    }

    /**
     * Update business average rating and total reviews
     */
    private async updateBusinessRating(businessId: string): Promise<void> {
        const result = await this.reviewRepository
            .createQueryBuilder('review')
            .select('AVG(review.rating)', 'averageRating')
            .addSelect('COUNT(*)', 'totalReviews')
            .where('review.businessId = :businessId', { businessId })
            .andWhere('review.isApproved = :isApproved', { isApproved: true })
            .getRawOne();

        const averageRating = parseFloat(result.averageRating) || 0;
        const totalReviews = parseInt(result.totalReviews) || 0;

        await this.listingRepository.update(businessId, {
            averageRating: Math.round(averageRating * 100) / 100, // Round to 2 decimals
            totalReviews,
        });
    }

    /**
     * Get all reviews for admin with suspicion filter
     */
    async findAllForAdmin(query: any) {
        try {
            const { isSuspicious, isApproved, businessId } = query;
            const page = Number(query.page) || 1;
            const limit = Number(query.limit) || 20;
            const skip = calculateSkip(page, limit);

            const queryBuilder = this.reviewRepository
                .createQueryBuilder('review')
                .leftJoinAndSelect('review.user', 'user')
                .leftJoinAndSelect('review.business', 'business')
                .leftJoinAndSelect('business.vendor', 'vendor')
                .leftJoinAndSelect('vendor.user', 'vendor_user');

            if (isSuspicious !== undefined) {
                queryBuilder.andWhere('review.isSuspicious = :isSuspicious', { 
                    isSuspicious: isSuspicious === 'true' || isSuspicious === true 
                });
            }

            if (isApproved !== undefined) {
                queryBuilder.andWhere('review.isApproved = :isApproved', { 
                    isApproved: isApproved === 'true' || isApproved === true 
                });
            }

            if (businessId) {
                queryBuilder.andWhere('review.businessId = :businessId', { businessId });
            }

            queryBuilder.orderBy('review.createdAt', 'DESC');

            const [reviews, total] = await Promise.all([
                queryBuilder.skip(skip).take(limit).getMany(),
                queryBuilder.getCount()
            ]);

            return createPaginatedResponse(reviews, page, limit, total);
        } catch (error) {
            console.error('Error in ReviewsService.findAllForAdmin:', error);
            throw new BadRequestException('Could not retrieve admin reviews.');
        }
    }

    /**
     * Moderate a review
     */
    async moderate(id: string, moderationDto: { isApproved?: boolean; isSuspicious?: boolean }) {
        const review = await this.findOne(id);
        
        if (moderationDto.isApproved !== undefined) {
            review.isApproved = moderationDto.isApproved;
        }
        
        if (moderationDto.isSuspicious !== undefined) {
            review.isSuspicious = moderationDto.isSuspicious;
        }

        await this.reviewRepository.save(review);
        
        // Update business rating if approval status changed
        await this.updateBusinessRating(review.businessId);

        // Update user trust score (suspicious flags might have changed)
        await this.trustService.updateTrustScore(review.userId);
        
        return review;
    }

    /**
     * Find all reviews for businesses owned by a vendor
     */
    async findVendorReviews(userId: string, query: GetReviewsDto) {
        try {
            const vendor = await this.vendorRepository.findOne({ where: { userId } });
            if (!vendor) {
                throw new ForbiddenException('Only vendors can access this');
            }

            const page = Number(query.page) || 1;
            const limit = Number(query.limit) || 20;
            const skip = calculateSkip(page, limit);

            const queryBuilder = this.reviewRepository
                .createQueryBuilder('review')
                .leftJoinAndSelect('review.user', 'user')
                .leftJoinAndSelect('review.business', 'business')
                .leftJoinAndSelect('review.replies', 'replies')
                .leftJoinAndSelect('replies.user', 'replyUser')
                .where('business.vendorId = :vendorId', { vendorId: vendor.id })
                .orderBy('review.createdAt', 'DESC');

            const [reviews, total] = await Promise.all([
                queryBuilder.skip(skip).take(limit).getMany(),
                queryBuilder.getCount()
            ]);

            return createPaginatedResponse(reviews, page, limit, total);
        } catch (error) {
            console.error('Error in ReviewsService.findVendorReviews:', error);
            throw new BadRequestException('Could not retrieve vendor reviews.');
        }
    }
}
