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
        const { businessId, userId, limit = 10, page = 1 } = query;
        const where: any = {};
        if (businessId) where.businessId = businessId;
        if (userId) where.userId = userId;

        const [data, total] = await this.reviewsRepository.findAndCount({
            where,
            relations: ['user'],
            order: { createdAt: 'DESC' },
            take: limit,
            skip: (page - 1) * limit,
        });

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
        // 1. Check for fraud
        const fraudCheck = await this.fraudDetectionService.detectFraud({
            ...createReviewDto,
            userId,
            ipAddress,
            deviceId
        });

        if (fraudCheck.isFraud) {
            // Increment spam flags for suspicious activity
            await this.userRepository.createQueryBuilder()
                .update(User)
                .set({ spamFlags: () => "spam_flags + 1" })
                .where("id = :id", { id: userId })
                .execute();

            await this.trustService.calculateUserTrustScore(userId);
            throw new BadRequestException(`Review rejected: ${fraudCheck.reason}`);
        }

        // 2. Create review
        const review = this.reviewsRepository.create({
            ...createReviewDto,
            userId,
            ipAddress,
            deviceId,
            isVerified: true
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
}
