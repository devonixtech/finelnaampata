import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan, LessThan } from 'typeorm';
import { Review } from '../../entities/review.entity';

@Injectable()
export class ReviewDetectionService {
    constructor(
        @InjectRepository(Review)
        private reviewRepository: Repository<Review>,
    ) {}

    async analyzeReview(review: Review): Promise<{
        isSuspicious: boolean;
        score: number;
        reason: string | null;
    }> {
        let totalScore = 0;
        let reasons: string[] = [];

        if (review.ipAddress) {
            const ipCount = await this.reviewRepository.count({
                where: { ipAddress: review.ipAddress },
            });
            if (ipCount > 3) {
                totalScore += 0.4;
                reasons.push('Multiple reviews from same IP');
            }
        }

        const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const userCount = await this.reviewRepository.count({
            where: { 
                userId: review.userId,
                createdAt: MoreThan(dayAgo)
            },
        });
        if (userCount > 5) {
            totalScore += 0.3;
            reasons.push('High frequency of reviews in 24h');
        }

        if (review.comment && review.comment.length > 20) {
            const similarReview = await this.reviewRepository.findOne({
                where: { 
                    userId: review.userId,
                    comment: review.comment 
                },
            });
            if (similarReview && similarReview.id !== review.id) {
                totalScore += 0.5;
                reasons.push('Identical text with previous review');
            }
        }

        if (review.comment && review.comment.length > 20) {
            const recentReviews = await this.reviewRepository.find({
                where: {
                    userId: review.userId,
                    comment: MoreThan(''),
                },
                order: { createdAt: 'DESC' },
                take: 20,
            });
            for (const recent of recentReviews) {
                if (recent.id === review.id || !recent.comment || recent.comment.length < 20) continue;
                const maxLen = Math.max(review.comment.length, recent.comment.length);
                if (maxLen === 0) continue;
                const distance = this.levenshteinDistance(review.comment.toLowerCase(), recent.comment.toLowerCase());
                const similarity = 1 - distance / maxLen;
                if (similarity > 0.8) {
                    totalScore += 0.5;
                    reasons.push('Similar text detected');
                    break;
                }
            }
        }

        if (review.comment && review.comment.length < 10) {
            totalScore += 0.1;
            reasons.push('Extremely short comment');
        }

        if (review.rating === 5) {
            const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
            const newFiveStarCount = await this.reviewRepository
                .createQueryBuilder('r')
                .innerJoin('r.user', 'u', 'u.created_at > :sevenDaysAgo', { sevenDaysAgo })
                .where('r.rating = 5')
                .andWhere('r.business_id = :businessId', { businessId: review.businessId })
                .andWhere('r.created_at > :dayAgo', { dayAgo })
                .getCount();
            if (newFiveStarCount >= 3) {
                totalScore += 0.6;
                reasons.push('Multiple 5-star reviews from new accounts on same business');
            }
        }

        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const lowRatingsOnBusiness = await this.reviewRepository.find({
            where: {
                businessId: review.businessId,
                rating: LessThan(3),
                createdAt: MoreThan(weekAgo),
            },
            order: { createdAt: 'DESC' },
            take: 10,
        });
        if (lowRatingsOnBusiness.length >= 3) {
            const uniqueUsers = new Set(lowRatingsOnBusiness.map(r => r.userId));
            if (uniqueUsers.size >= 3) {
                totalScore += 0.5;
                reasons.push('Possible competitor attack: multiple low ratings from different users in short period');
            }
        }

        return {
            isSuspicious: totalScore >= 0.5,
            score: Math.min(totalScore, 1),
            reason: reasons.length > 0 ? reasons.join(', ') : null,
        };
    }

    private levenshteinDistance(a: string, b: string): number {
        const m = a.length;
        const n = b.length;
        const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
        for (let i = 0; i <= m; i++) dp[i][0] = i;
        for (let j = 0; j <= n; j++) dp[0][j] = j;
        for (let i = 1; i <= m; i++) {
            for (let j = 1; j <= n; j++) {
                const cost = a[i - 1] === b[j - 1] ? 0 : 1;
                dp[i][j] = Math.min(
                    dp[i - 1][j] + 1,
                    dp[i][j - 1] + 1,
                    dp[i - 1][j - 1] + cost,
                );
            }
        }
        return dp[m][n];
    }
}
