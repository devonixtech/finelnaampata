import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Listing, BusinessStatus } from '../../entities/business.entity';
import { GeocoderService } from './geocoder.service';

@Processor('geocoding', {
    concurrency: 10,
    limiter: {
        max: 1,
        duration: 100, // 1 job per 100ms
    }
})
@Injectable()
export class GeocodingProcessor extends WorkerHost {
    private readonly logger = new Logger(GeocodingProcessor.name);

    constructor(
        @InjectRepository(Listing)
        private listingRepository: Repository<Listing>,
        private geocoderService: GeocoderService,
    ) {
        super();
    }

    async process(job: Job<{ businessId: string, address: string, city: string }>, token?: string): Promise<any> {
        this.logger.log(`Processing geocoding for business ${job.data.businessId}`);
        const { businessId, address, city } = job.data;

        const business = await this.listingRepository.findOne({ where: { id: businessId } });
        if (!business) {
            this.logger.warn(`Business ${businessId} not found`);
            return;
        }

        // Check if another business with the exact same address has coordinates (Deduplication optimization)
        const existingLocation = await this.listingRepository.createQueryBuilder('business')
            .where('business.address = :address', { address })
            .andWhere('business.latitude IS NOT NULL')
            .andWhere('business.longitude IS NOT NULL')
            .select(['business.latitude', 'business.longitude'])
            .limit(1)
            .getOne();

        if (existingLocation) {
            this.logger.log(`Reusing coordinates from existing address for ${businessId}`);
            business.latitude = existingLocation.latitude;
            business.longitude = existingLocation.longitude;
            business.location = `SRID=4326;POINT(${existingLocation.longitude} ${existingLocation.latitude})`;
            business.status = BusinessStatus.APPROVED; // Assuming it goes active
            await this.listingRepository.save(business);
            return;
        }

        // Call Geocoder Service
        try {
            const coords = await this.geocoderService.geocodeAddress(`${address}, ${city}`);
            
            business.latitude = coords.lat;
            business.longitude = coords.lng;
            business.location = `SRID=4326;POINT(${coords.lng} ${coords.lat})`;
            business.status = BusinessStatus.APPROVED;
            
            await this.listingRepository.save(business);
            this.logger.log(`Successfully geocoded and activated business ${businessId}`);
        } catch (error) {
            this.logger.error(`Failed to geocode address for ${businessId}: ${error.message}`);
            // Let it throw so BullMQ retries (configured up to 3 times in job dispatch)
            throw error;
        }
    }

    @OnWorkerEvent('failed')
    onFailed(job: Job, error: Error) {
        this.logger.error(`Geocoding job ${job.id} failed: ${error.message}`);
        if (job.attemptsMade >= (job.opts.attempts || 3)) {
            // Send admin alert logic here (e.g., email or notification)
            this.logger.error(`CRITICAL: Geocoding failed permanently for business ${job.data.businessId} after ${job.attemptsMade} attempts.`);
        }
    }
}
