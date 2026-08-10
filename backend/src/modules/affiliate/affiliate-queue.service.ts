import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Queue, Worker, Job } from 'bullmq';

export type ProcessReferralJobData = {
    referredUserId: string;
    paidAmount: number;
    force: boolean;
};

export type ReverseCommissionJobData = {
    vendorId: string;
    reason: string;
};

export type ReleaseHeldFundsJobData = {
    affiliateId: string;
};

@Injectable()
export class AffiliateQueueService implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(AffiliateQueueService.name);
    private commissionQueue: Queue | null = null;
    private commissionWorker: Worker | null = null;

    constructor(private readonly configService: ConfigService) {}

    onModuleInit() {
        if (process.env.REDIS_ENABLED !== 'true') {
            this.logger.warn('Redis disabled — affiliate commission queue will run inline (no BullMQ).');
            return;
        }

        const host = this.configService.get<string>('REDIS_HOST', 'localhost');
        const port = this.configService.get<number>('REDIS_PORT', 6379);
        const connection = { host, port };

        this.commissionQueue = new Queue('affiliate-commission', { connection });

        this.commissionWorker = new Worker(
            'affiliate-commission',
            async (job: Job) => {
                return this.processJob(job);
            },
            {
                connection,
                concurrency: 5,
            },
        );

        this.commissionWorker.on('failed', (job, err) => {
            this.logger.error(`Affiliate commission job ${job?.id} (${job?.name}) failed: ${err.message}`);
        });

        this.commissionWorker.on('completed', (job) => {
            this.logger.log(`Affiliate commission job ${job.id} (${job.name}) completed`);
        });

        this.logger.log('Affiliate commission queue and worker initialized');
    }

    async onModuleDestroy() {
        if (this.commissionWorker) {
            await this.commissionWorker.close();
        }
        if (this.commissionQueue) {
            await this.commissionQueue.close();
        }
    }

    // --- Enqueue methods (called by AffiliateService) ---

    async enqueueProcessReferral(data: ProcessReferralJobData) {
        if (!this.commissionQueue) {
            this.logger.warn('Queue disabled — processing referral inline (no Redis)');
            if (this.affiliateServiceRef) {
                return this.affiliateServiceRef.processSuccessfulReferralDirect(
                    data.referredUserId,
                    data.paidAmount,
                    data.force,
                );
            }
            return null;
        }

        const job = await this.commissionQueue.add('process-referral', data, {
            attempts: 3,
            backoff: { type: 'exponential', delay: 2000 },
        });

        this.logger.log(`Enqueued process-referral job ${job.id} for user ${data.referredUserId}`);
        return job;
    }

    async enqueueReverseCommission(data: ReverseCommissionJobData) {
        if (!this.commissionQueue) {
            this.logger.warn('Queue disabled — reversing commission inline (no Redis)');
            if (this.affiliateServiceRef) {
                return this.affiliateServiceRef.reverseCommissionDirect(
                    data.vendorId,
                    data.reason,
                );
            }
            return null;
        }

        const job = await this.commissionQueue.add('reverse-commission', data, {
            attempts: 3,
            backoff: { type: 'exponential', delay: 2000 },
        });

        this.logger.log(`Enqueued reverse-commission job ${job.id} for vendor ${data.vendorId}`);
        return job;
    }

    async enqueueReleaseHeldFunds(data: ReleaseHeldFundsJobData) {
        if (!this.commissionQueue) {
            this.logger.warn('Queue disabled — releasing held funds inline (no Redis)');
            if (this.affiliateServiceRef) {
                const affiliate = await this.affiliateServiceRef['affiliateRepository'].findOne({
                    where: { id: data.affiliateId },
                });
                if (affiliate) {
                    return this.affiliateServiceRef.releaseHeldFunds(affiliate);
                }
            }
            return null;
        }

        const job = await this.commissionQueue.add('release-held-funds', data, {
            attempts: 3,
            backoff: { type: 'exponential', delay: 2000 },
        });

        this.logger.log(`Enqueued release-held-funds job ${job.id} for affiliate ${data.affiliateId}`);
        return job;
    }

    // --- Job processor (delegates to AffiliateService) ---

    // This is injected after module init to avoid circular dependency
    private affiliateServiceRef: any = null;

    setAffiliateService(service: any) {
        this.affiliateServiceRef = service;
    }

    private async processJob(job: Job): Promise<any> {
        if (!this.affiliateServiceRef) {
            throw new Error('AffiliateService not registered with AffiliateQueueService');
        }

        switch (job.name) {
            case 'process-referral': {
                const data = job.data as ProcessReferralJobData;
                return this.affiliateServiceRef.processSuccessfulReferralDirect(
                    data.referredUserId,
                    data.paidAmount,
                    data.force,
                );
            }
            case 'reverse-commission': {
                const data = job.data as ReverseCommissionJobData;
                return this.affiliateServiceRef.reverseCommissionDirect(data.vendorId, data.reason);
            }
            case 'release-held-funds': {
                const data = job.data as ReleaseHeldFundsJobData;
                const affiliate = await this.affiliateServiceRef['affiliateRepository'].findOne({
                    where: { id: data.affiliateId },
                });
                if (affiliate) {
                    return this.affiliateServiceRef.releaseHeldFunds(affiliate);
                }
                return null;
            }
            default:
                this.logger.warn(`Unknown job type: ${job.name}`);
                return null;
        }
    }
}
