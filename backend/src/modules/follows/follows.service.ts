import {
    Injectable,
    NotFoundException,
    ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Follow } from '../../entities/follow.entity';
import { Listing } from '../../entities/business.entity';
import { User } from '../../entities/user.entity';
import { SearchService } from '../search/search.service';

@Injectable()
export class FollowsService {
    constructor(
        @InjectRepository(Follow)
        private followRepository: Repository<Follow>,
        @InjectRepository(Listing)
        private listingRepository: Repository<Listing>,
        private searchService: SearchService,
    ) {}

    /** Follow a business */
    async follow(userId: string, businessId: string): Promise<{ followersCount: number }> {
        // Verify business exists
        const business = await this.listingRepository.findOne({ where: { id: businessId } });
        if (!business) throw new NotFoundException('Business not found');

        // Check already following
        const existing = await this.followRepository.findOne({ where: { userId, businessId } });
        if (existing) throw new ConflictException('Already following this business');

        // Save follow
        const follow = this.followRepository.create({ userId, businessId });
        await this.followRepository.save(follow);

        // Increment counter
        await this.listingRepository.increment({ id: businessId }, 'followersCount', 1);

        // Update follower history snapshot
        const today = new Date().toISOString().split('T')[0];
        const history = business.followerHistory || [];
        const existingEntry = history.find((e: any) => e.date === today);
        const newCount = (business.followersCount || 0) + 1;
        if (existingEntry) {
            existingEntry.count = newCount;
        } else {
            history.push({ date: today, count: newCount });
        }
        const trimmedHistory = history.slice(-30);
        await this.listingRepository.update(businessId, { followerHistory: trimmedHistory });

        // Sync with Elasticsearch
        const updated = await this.listingRepository.findOne({
            where: { id: businessId },
            relations: ['category', 'vendor', 'vendor.user']
        });
        if (updated) {
            await this.searchService.indexBusiness(updated);
        }

        return { followersCount: updated?.followersCount ?? 0 };
    }

    /** Unfollow a business */
    async unfollow(userId: string, businessId: string): Promise<{ followersCount: number }> {
        const follow = await this.followRepository.findOne({ where: { userId, businessId } });
        if (!follow) throw new NotFoundException('Not following this business');

        await this.followRepository.remove(follow);

        // Decrement counter (min 0)
        const business = await this.listingRepository.findOne({ where: { id: businessId }, select: ['followersCount', 'followerHistory'] });
        if (business && business.followersCount > 0) {
            await this.listingRepository.decrement({ id: businessId }, 'followersCount', 1);
        }

        // Update follower history snapshot
        if (business) {
            const today = new Date().toISOString().split('T')[0];
            const history = business.followerHistory || [];
            const existingEntry = history.find((e: any) => e.date === today);
            const newCount = Math.max(0, (business.followersCount || 1) - 1);
            if (existingEntry) {
                existingEntry.count = newCount;
            } else {
                history.push({ date: today, count: newCount });
            }
            const trimmedHistory = history.slice(-30);
            await this.listingRepository.update(businessId, { followerHistory: trimmedHistory });
        }

        // Sync with Elasticsearch
        const updated = await this.listingRepository.findOne({
            where: { id: businessId },
            relations: ['category', 'vendor', 'vendor.user']
        });
        if (updated) {
            await this.searchService.indexBusiness(updated);
        }

        return { followersCount: updated?.followersCount ?? 0 };
    }

    /** Check if a user follows a business */
    async checkFollow(userId: string, businessId: string): Promise<{ isFollowing: boolean; followersCount: number }> {
        const [follow, business] = await Promise.all([
            this.followRepository.findOne({ where: { userId, businessId } }),
            this.listingRepository.findOne({ where: { id: businessId }, select: ['followersCount'] }),
        ]);
        return {
            isFollowing: !!follow,
            followersCount: business?.followersCount ?? 0,
        };
    }

    /** Get follower count for a business */
    async getFollowerCount(businessId: string): Promise<{ followersCount: number }> {
        const business = await this.listingRepository.findOne({
            where: { id: businessId },
            select: ['followersCount'],
        });
        if (!business) throw new NotFoundException('Business not found');
        return { followersCount: business.followersCount };
    }

    /** Get all businesses the current user follows */
    async getMyFollows(userId: string, page = 1, limit = 20) {
        const skip = (page - 1) * limit;
        const [follows, total] = await this.followRepository.findAndCount({
            where: { userId },
            relations: ['business', 'business.category', 'business.vendor', 'business.vendor.user'],
            order: { createdAt: 'DESC' },
            skip,
            take: limit,
        });

        return {
            data: follows.map(f => f.business),
            meta: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
                hasMore: skip + limit < total,
            },
        };
    }
}
