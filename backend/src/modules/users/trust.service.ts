import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../entities/user.entity';
import { Review } from '../../entities/review.entity';
import { SavedListing } from '../../entities/favorite.entity';
import { Lead } from '../../entities/lead.entity';
import { SearchLog } from '../../entities/search-log.entity';

@Injectable()
export class TrustService {
    constructor(
        @InjectRepository(User)
        private userRepository: Repository<User>,
        @InjectRepository(Review)
        private reviewRepository: Repository<Review>,
        @InjectRepository(SavedListing)
        private savedListingRepository: Repository<SavedListing>,
        @InjectRepository(Lead)
        private leadRepository: Repository<Lead>,
        @InjectRepository(SearchLog)
        private searchLogRepository: Repository<SearchLog>,
    ) {}

    /**
     * Recalculate and update trust score for a user
     */
    async updateTrustScore(userId: string): Promise<User> {
        const user = await this.userRepository.findOne({
            where: { id: userId },
            relations: ['reviews'],
        });

        if (!user) return null;

        // 1. Gather metrics
        const reviews = user.reviews || [];
        const reviewCount = reviews.length;
        const helpfulVotesCount = reviews.reduce((sum, r) => sum + (r.helpfulCount || 0), 0);
        const spamFlagsCount = reviews.filter(r => r.isSuspicious).length;

        // 2. Calculate Age Factor (Months active)
        const now = new Date();
        const created = new Date(user.createdAt);
        const monthsActive = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24 * 30));
        const ageScore = Math.min(monthsActive * 2, 20); // Max 20 points for age

        // 3. Calculate Activity Factor — reward consistency, not just volume
        let activityScore = 0;
        if (reviewCount > 0) {
            const reviewDates = reviews
                .map(r => new Date(r.createdAt).getTime())
                .sort((a, b) => a - b);
            if (reviewDates.length >= 2) {
                const gaps: number[] = [];
                for (let i = 1; i < reviewDates.length; i++) {
                    gaps.push((reviewDates[i] - reviewDates[i - 1]) / (1000 * 60 * 60 * 24)); // days
                }
                const avgGap = gaps.reduce((s, g) => s + g, 0) / gaps.length;
                // Reward regular reviewers (consistent gaps), penalize bursty ones
                const variance = gaps.reduce((s, g) => s + Math.pow(g - avgGap, 2), 0) / gaps.length;
                const consistency = Math.max(0, 1 - Math.min(variance / 1000, 1)); // 0-1 scale
                activityScore = Math.min(Math.round(reviewCount * 2 * consistency + reviewCount), 30);
            } else {
                activityScore = Math.min(reviewCount * 2, 30);
            }
        }

        // 4. Calculate Community Factor (Helpful votes)
        const communityScore = Math.min(helpfulVotesCount * 5, 30); // Max 30 points for being helpful

        // 5. Calculate Penalty Factor (Spam/Suspicious flags)
        const penaltyScore = spamFlagsCount * 25; // Significant penalty for each flag

        // 6. Phone verification bonus
        const phoneVerifiedBonus = user.isPhoneVerified ? 15 : 0;

        // 7. Real activity bonus
        const savedListingCount = await this.savedListingRepository.count({ where: { userId } });
        const savedListingScore = Math.min(savedListingCount * 5, 15);

        const leadCount = await this.leadRepository.count({ where: { userId } });
        const leadScore = Math.min(leadCount * 3, 10);

        // Search activity bonus
        const searchCount = await this.searchLogRepository.count({ where: { userId } });
        const searchScore = Math.min(searchCount, 10); // Max 10 points for search activity

        // 8. Final Score Calculation
        // Base score starts at 30 for new users
        let finalScore = 30 + ageScore + activityScore + communityScore + phoneVerifiedBonus + savedListingScore + leadScore + searchScore - penaltyScore;
        
        // Clamp between 0 and 100
        finalScore = Math.max(0, Math.min(100, finalScore));

        // 9. Update User Record
        user.trustScore = Math.round(finalScore);
        user.reviewCount = reviewCount;
        user.helpfulVotesCount = helpfulVotesCount;
        user.spamFlagsCount = spamFlagsCount;
        (user as any).badge = this.getUserBadge(Math.round(finalScore));

        return this.userRepository.save(user);
    }

    /**
     * Get user badge based on trust score
     */
    getUserBadge(score: number): string {
        if (score >= 80) return 'Trusted Reviewer';
        if (score >= 40) return 'Active Member';
        return 'New Member';
    }

    /**
     * Penalize user trust score for hitting rate limits
     */
    async penalizeRateLimit(userId: string): Promise<void> {
        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (!user) return;

        user.trustScore = Math.max(0, (user.trustScore || 50) - 10);
        await this.userRepository.save(user);
    }
}
