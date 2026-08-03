import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { Review } from '../../entities/review.entity';

@Injectable()
export class ReviewDetectionService {
    constructor(
        @InjectRepository(Review)
        private reviewRepository: Repository<Review>,
    ) {}

    /**
     * Analyze a review for suspicious activity
     */
    async analyzeReview(review: Review): Promise<{
        isSuspicious: boolean;
        score: number;
        reason: string | null;
    }> {
        let totalScore = 0;
        let reasons: string[] = [];

        // 1. Check for IP repetition
        if (review.ipAddress) {
            const ipCount = await this.reviewRepository.count({
                where: { ipAddress: review.ipAddress },
            });
            if (ipCount > 3) {
                totalScore += 0.4;
                reasons.push('Multiple reviews from same IP');
            }
        }

        // 2. Check for frequency (last 24h)
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

        // 3. Check for repetitive text similarity (exact match)
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

        // 3b. Fuzzy duplicate text detection via Levenshtein distance
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

        // 4. Short review check
        if (review.comment && review.comment.length < 10) {
            totalScore += 0.1;
            reasons.push('Extremely short comment');
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
