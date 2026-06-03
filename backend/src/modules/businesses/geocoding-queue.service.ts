import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BusinessStatus, Listing } from '../../entities/business.entity';
import { GeocoderService } from '../location/geocoder.service';
import { NotificationsService, NotificationType } from '../notifications/notifications.service';
import { ConfigService } from '@nestjs/config';
import { MailService } from '../auth/mail.service';
import { Queue, Worker } from 'bullmq';

type GeocodeJob = {
    listingId: string;
    address: string;
    city?: string | null;
    country?: string | null;
};

@Injectable()
export class GeocodingQueueService implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(GeocodingQueueService.name);
    private geocodeQueue: Queue;
    private geocodeWorker: Worker;

    constructor(
        @InjectRepository(Listing)
        private readonly listingRepository: Repository<Listing>,
        private readonly geocoderService: GeocoderService,
        private readonly notificationsService: NotificationsService,
        private readonly configService: ConfigService,
        private readonly mailService: MailService,
    ) {}

    onModuleInit() {
        const host = this.configService.get<string>('REDIS_HOST', 'your-redis-host');
        const port = this.configService.get<number>('REDIS_PORT', 6379);
        const connection = { host, port };

        if (process.env.REDIS_ENABLED === 'true') {
            this.geocodeQueue = new Queue('geocoding', { connection });

            this.geocodeWorker = new Worker(
                'geocoding',
                async (job) => {
                    await this.process(job.data);
                },
                {
                    connection,
                    concurrency: 10,
                    limiter: {
                        max: 1,
                        duration: 100, // 100ms throttling between jobs
                    },
                }
            );

            this.geocodeWorker.on('failed', async (job, err) => {
                this.logger.error(`Geocoding job ${job?.id} failed: ${err.message}`);
                if (job && job.attemptsMade >= (job.opts.attempts || 3)) {
                    await this.handleFinalFailure(job.data);
                }
            });
        }
    }

    async onModuleDestroy() {
        if (this.geocodeWorker) {
            await this.geocodeWorker.close();
        }
        if (this.geocodeQueue) {
            await this.geocodeQueue.close();
        }
    }

    async enqueue(job: GeocodeJob) {
        if (this.geocodeQueue) {
            await this.geocodeQueue.add('geocode', job, {
                attempts: 3,
                backoff: {
                    type: 'exponential',
                    delay: 2000, // 2s exponential backoff
                },
            });
        } else {
            this.logger.warn(`Geocoding queue is disabled (Redis off). Directly processing job in background.`);
            setImmediate(() => this.process(job).catch(err => this.logger.error(`Direct process failed: ${err.message}`)));
        }
    }

    private async process(job: GeocodeJob) {
        const listing = await this.listingRepository.findOne({ where: { id: job.listingId } });
        if (!listing) return;

        const canonical = this.geocoderService.buildCanonicalAddress({
            address: job.address,
            city: job.city || undefined,
            country: job.country || undefined,
        });

        // 1. Deduplication: check if another listing has the identical canonical address and has coordinates
        const existing = await this.listingRepository
            .createQueryBuilder('listing')
            .where('LOWER(CONCAT(COALESCE(listing.address, \'\'), \', \', COALESCE(listing.city, \'\'), \', \', COALESCE(listing.country, \'\'))) = LOWER(:canonical)', { canonical })
            .andWhere('listing.id != :id', { id: listing.id })
            .andWhere('listing.latitude IS NOT NULL')
            .andWhere('listing.longitude IS NOT NULL')
            .orderBy('listing.updatedAt', 'DESC')
            .getOne();

        if (existing?.latitude && existing?.longitude) {
            this.logger.log(`📍 Reusing coordinates for listing "${listing.title}" from existing listing.`);
            listing.latitude = Number(existing.latitude);
            listing.longitude = Number(existing.longitude);
            listing.location = `POINT(${existing.longitude} ${existing.latitude})`;
            listing.status = BusinessStatus.APPROVED;
            listing.approvedAt = listing.approvedAt || new Date();
            listing.rejectedAt = null as any;
            listing.rejectionReason = null as any;
            listing.recentUntil = listing.recentUntil || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
            await this.listingRepository.save(listing);
            return;
        }

        // 2. Call provider geocoder if no duplicate addresses are found
        const coords = await this.geocoderService.geocodeAddress(canonical);
        if (!coords) {
            throw new Error(`Geocoding returned null or empty results for address: ${canonical}`);
        }

        this.logger.log(`📍 Geocoded listing "${listing.title}" successfully: (${coords.lat}, ${coords.lng})`);
        listing.latitude = coords.lat;
        listing.longitude = coords.lng;
        listing.location = `POINT(${coords.lng} ${coords.lat})`;
        listing.status = BusinessStatus.APPROVED;
        listing.approvedAt = listing.approvedAt || new Date();
        listing.rejectedAt = null as any;
        listing.rejectionReason = null as any;
        listing.recentUntil = listing.recentUntil || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        await this.listingRepository.save(listing);
    }

    private async handleFinalFailure(jobData: GeocodeJob) {
        const listing = await this.listingRepository.findOne({ where: { id: jobData.listingId } });
        if (!listing) return;

        const canonical = this.geocoderService.buildCanonicalAddress({
            address: jobData.address,
            city: jobData.city || undefined,
            country: jobData.country || undefined,
        });

        this.logger.error(`🚨 Geocoding failed completely for listing "${listing.title}" after 3 attempts.`);

        // Notify via Admin System Updates
        await this.notificationsService
            .notifyAdmin({
                title: 'Geocoding Failed Completely',
                message: `Failed geocoding listing "${listing.title}" after 3 attempts.`,
                type: NotificationType.SYSTEM_UPDATE,
                data: { listingId: listing.id, address: canonical },
            })
            .catch(() => undefined);

        // Send Email notification to Administrator
        const adminEmail = this.configService.get<string>('ADMIN_EMAIL') || this.configService.get<string>('MAIL_USERNAME');
        if (adminEmail) {
            await this.mailService.sendGeocodingFailureAlert(adminEmail, listing.title, canonical);
        }
    }

}
