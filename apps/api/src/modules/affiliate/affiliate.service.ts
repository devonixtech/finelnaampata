import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Affiliate } from '../../entities/affiliate.entity';
import { Commission, CommissionStatus } from '../../entities/commission.entity';
import { User } from '../../entities/user.entity';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class AffiliateService {
    constructor(
        @InjectRepository(Affiliate)
        private affiliateRepository: Repository<Affiliate>,
        @InjectRepository(Commission)
        private commissionRepository: Repository<Commission>,
        @InjectRepository(User)
        private userRepository: Repository<User>,
        @InjectQueue('commissions') private commissionQueue: Queue,
    ) { }

    async registerAffiliate(userId: string): Promise<Affiliate> {
        let affiliate = await this.affiliateRepository.findOne({ where: { userId } });
        if (affiliate) return affiliate;

        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (!user) throw new NotFoundException('User not found');

        // Generate unique 6 char code
        const affiliateCode = (user.fullName.substring(0, 3) + Math.random().toString(36).substring(2, 5)).toUpperCase();

        affiliate = this.affiliateRepository.create({
            userId,
            affiliateCode,
        });

        return this.affiliateRepository.save(affiliate);
    }

    async getStats(userId: string) {
        const affiliate = await this.affiliateRepository.findOne({ where: { userId } });
        if (!affiliate) throw new NotFoundException('Not registered as affiliate');

        const commissions = await this.commissionRepository.find({ where: { affiliateId: affiliate.id } });
        
        return {
            affiliateCode: affiliate.affiliateCode,
            totalEarned: affiliate.totalEarned,
            pendingBalance: affiliate.pendingBalance,
            commissions
        };
    }

    async getAffiliateByCode(code: string): Promise<Affiliate | null> {
        return this.affiliateRepository.findOne({ where: { affiliateCode: code } });
    }

    async createPendingCommission(affiliateId: string, referredUserId: string, ipAddress?: string, deviceId?: string) {
        // Flat $50 commission for now
        const amount = 50.00; 
        
        // Setup 30 days from now
        const eligibleAt = new Date();
        eligibleAt.setDate(eligibleAt.getDate() + 30);

        const commission = this.commissionRepository.create({
            affiliateId,
            referredUserId,
            amount,
            status: CommissionStatus.PENDING,
            eligibleAt,
            ipAddress,
            deviceId
        });

        const saved = await this.commissionRepository.save(commission);

        // Queue BullMQ Job to verify in 30 days
        const delay = 30 * 24 * 60 * 60 * 1000;
        await this.commissionQueue.add('verify-commission', { commissionId: saved.id }, { delay });

        return saved;
    }

    // Admin Methods
    async getAllCommissions() {
        return this.commissionRepository.find({
            relations: ['affiliate', 'affiliate.user', 'referredUser'],
            order: { createdAt: 'DESC' }
        });
    }

    async approveCommission(id: string, adminNotes?: string) {
        const commission = await this.commissionRepository.findOne({ where: { id }, relations: ['affiliate'] });
        if (!commission) throw new NotFoundException('Commission not found');
        if (commission.status !== CommissionStatus.PENDING_APPROVAL) {
            throw new BadRequestException('Commission is not in pending approval state');
        }

        commission.status = CommissionStatus.APPROVED;
        if (adminNotes) commission.adminNotes = adminNotes;
        
        await this.commissionRepository.save(commission);

        // Update Affiliate Balance
        await this.affiliateRepository.increment({ id: commission.affiliateId }, 'totalEarned', Number(commission.amount));
        
        return commission;
    }

    async rejectCommission(id: string, reason: string) {
        const commission = await this.commissionRepository.findOne({ where: { id } });
        if (!commission) throw new NotFoundException('Commission not found');

        commission.status = CommissionStatus.REJECTED;
        commission.adminNotes = reason;
        
        return this.commissionRepository.save(commission);
    }
}
