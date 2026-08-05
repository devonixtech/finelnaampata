import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Review } from '../../entities/review.entity';
import { User } from '../../entities/user.entity';
import { Business } from '../../entities/business.entity';
import { TrustService, FraudDetectionService } from '../trust/trust.service';

@Injectable()
export class ReviewsService {
    constructor(
        @InjectRepository(Review)
        private reviewsRepository: Repository<Review>,
        @InjectRepository(Business)
        private businessRepository: Repository<Business>,
        @InjectRepository(User)
        private userRepository: Repository<User>,
        private trustService: TrustService,
        private fraudDetectionService: FraudDetectionService,
    ) { }

    async findAll(query: any) {
        const { businessId, userId, limit = 10, page = 1, sortBy = 'newest' } = query;
        const where: any = {};
        if (businessId) where.businessId = businessId;
        if (userId) where.userId = userId;
        where.isApproved = true; // Only return active reviews by default unless admin

        const queryBuilder = this.reviewsRepository.createQueryBuilder('review')
            .leftJoinAndSelect('review.user', 'user')
            .where('review.isApproved = :isApproved', { isApproved: true });

        if (businessId) {
            queryBuilder.andWhere('review.businessId = :businessId', { businessId });
        }
        if (userId) {
            queryBuilder.andWhere('review.userId = :userId', { userId });
        }

        // Apply advanced sorting
        if (sortBy === 'relevant') {
            // (trustScore * 10) + (helpfulCount * 5)
            queryBuilder.addSelect('((COALESCE(user.trustScore, 0) * 10) + (review.helpfulCount * 5))', 'relevanceScore');
            queryBuilder.orderBy('relevanceScore', 'DESC');
            queryBuilder.addOrderBy('review.createdAt', 'DESC');
        } else if (sortBy === 'helpful') {
            queryBuilder.orderBy('review.helpfulCount', 'DESC');
            queryBuilder.addOrderBy('review.createdAt', 'DESC');
        } else if (sortBy === 'photos') {
            // Sort by whether images array is not null/empty
            queryBuilder.orderBy('jsonb_array_length(review.images)', 'DESC', 'NULLS LAST');
            queryBuilder.addOrderBy('review.createdAt', 'DESC');
        } else if (sortBy === 'lowest') {
            queryBuilder.orderBy('review.rating', 'ASC');
            queryBuilder.addOrderBy('review.createdAt', 'DESC');
        } else {
            // 'newest' (default)
            queryBuilder.orderBy('review.createdAt', 'DESC');
        }

        queryBuilder.take(limit);
        queryBuilder.skip((page - 1) * limit);

        const [data, total] = await queryBuilder.getManyAndCount();

        return {
            data,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    async create(userId: string, createReviewDto: any, ipAddress: string, deviceId?: string): Promise<Review> {
        // 0. Verify phone requirement
        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (!user?.isPhoneVerified) {
            throw new BadRequestException('Only phone-verified accounts can leave reviews');
        }

        // 1. Check for fraud
        const fraudCheck = await this.fraudDetectionService.detectFraud({
            ...createReviewDto,
            userId,
            ipAddress,
            deviceId
        });

        let isSuspicious = false;
        let isApproved = true;

        if (fraudCheck.isFraud) {
            // Increment spam flags for suspicious activity
            await this.userRepository.createQueryBuilder()
                .update(User)
                .set({ spamFlags: () => "spam_flags + 1" })
                .where("id = :id", { id: userId })
                .execute();

            await this.trustService.calculateUserTrustScore(userId);
            // Save as flagged for admin review instead of throwing error
            isSuspicious = true;
            isApproved = false;
        }

        // 2. Create review
        const review = this.reviewsRepository.create({
            ...createReviewDto,
            userId,
            ipAddress,
            deviceId,
            isVerified: true,
            isApproved,
            isSuspicious,
            suspicionReason: fraudCheck.reason || null
        });

        const savedReview = await this.reviewsRepository.save(review);

        // 3. Update business rating
        await this.updateBusinessRating(createReviewDto.businessId);

        // 4. Update user trust score and review count
        await this.trustService.calculateUserTrustScore(userId);

        return savedReview;
    }

    private async updateBusinessRating(businessId: string) {
        const reviews = await this.reviewsRepository.find({ where: { businessId } });
        const totalReviews = reviews.length;
        const averageRating = totalReviews > 0
            ? reviews.reduce((sum, r) => sum + Number(r.rating), 0) / totalReviews
            : 0;

        await this.businessRepository.update(businessId, {
            totalReviews,
            averageRating: parseFloat(averageRating.toFixed(2))
        });
    }

    async markHelpful(reviewId: string, votingUserId: string) {
        const review = await this.reviewsRepository.findOne({ where: { id: reviewId } });
        if (!review) throw new BadRequestException('Review not found');
        if (review.userId === votingUserId) throw new BadRequestException('Cannot vote for own review');

        await this.reviewsRepository.increment({ id: reviewId }, 'helpfulCount', 1);
        await this.userRepository.increment({ id: review.userId }, 'helpfulVotes', 1);

        await this.trustService.calculateUserTrustScore(review.userId);
        return { success: true };
    }

    async flagAsSpam(reviewId: string, flaggingUserId: string) {
        const review = await this.reviewsRepository.findOne({ where: { id: reviewId } });
        if (!review) throw new BadRequestException('Review not found');

        await this.userRepository.increment({ id: review.userId }, 'spamFlags', 1);

        await this.trustService.calculateUserTrustScore(review.userId);
        return { success: true, message: 'Review flagged for moderation' };
    }

    async moderate(reviewId: string, isApproved: boolean, isSuspicious: boolean) {
        const review = await this.reviewsRepository.findOne({ where: { id: reviewId } });
        if (!review) throw new BadRequestException('Review not found');

        review.isApproved = isApproved;
        review.isSuspicious = isSuspicious;
        await this.reviewsRepository.save(review);
        
        // Recalculate business rating in case a review was hidden or made active
        await this.updateBusinessRating(review.businessId);

        return review;
    }
}
