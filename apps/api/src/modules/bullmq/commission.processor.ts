import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Commission, CommissionStatus } from '../../entities/commission.entity';
import { User } from '../../entities/user.entity';

@Processor('commissions')
export class CommissionProcessor extends WorkerHost {
    constructor(
        @InjectRepository(Commission)
        private commissionRepository: Repository<Commission>,
        @InjectRepository(User)
        private userRepository: Repository<User>,
    ) {
        super();
    }

    async process(job: Job<any, any, string>): Promise<any> {
        if (job.name === 'verify-commission') {
            const { commissionId } = job.data;
            const commission = await this.commissionRepository.findOne({ 
                where: { id: commissionId },
                relations: ['referredUser'] 
            });

            if (!commission || commission.status !== CommissionStatus.PENDING) {
                return; // Nothing to do
            }

            const referredUser = commission.referredUser;
            
            // 1. Check if user is still active (no refunds/chargebacks would set isActive = false)
            if (!referredUser.isActive) {
                commission.status = CommissionStatus.REVERSED;
                commission.adminNotes = 'User account deactivated or refunded within 30 days';
                await this.commissionRepository.save(commission);
                return;
            }

            // 2. Check IP/Device overlap with Affiliate to prevent self-referral
            // For a production app, we would query if the affiliate's IP matches this IP
            // Since we don't store affiliate IPs explicitly in this simple schema,
            // we assume manual review will catch advanced fraud, but we could add IP checks here.

            // 3. 30 days have passed and account is active. Move to PENDING_APPROVAL
            commission.status = CommissionStatus.PENDING_APPROVAL;
            await this.commissionRepository.save(commission);
        }
    }
}
