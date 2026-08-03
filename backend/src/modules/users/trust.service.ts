import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../entities/user.entity';
import { Review } from '../../entities/review.entity';
import { SavedListing } from '../../entities/favorite.entity';
import { Lead } from '../../entities/lead.entity';

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

        // 3. Calculate Activity Factor
        const activityScore = Math.min(reviewCount * 2, 30); // Max 30 points for reviews

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

        // 8. Final Score Calculation
        // Base score starts at 30 for new users
        let finalScore = 30 + ageScore + activityScore + communityScore + phoneVerifiedBonus + savedListingScore + leadScore - penaltyScore;
        
        // Clamp between 0 and 100
        finalScore = Math.max(0, Math.min(100, finalScore));

        // 9. Update User Record
        user.trustScore = Math.round(finalScore);
        user.reviewCount = reviewCount;
        user.helpfulVotesCount = helpfulVotesCount;
        user.spamFlagsCount = spamFlagsCount;

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
}
