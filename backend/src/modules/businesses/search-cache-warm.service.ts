import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Listing, BusinessStatus } from '../../entities/business.entity';
import { SearchLocationService } from '../location/search-location.service';
import { BusinessesService } from './businesses.service';
import { SearchBusinessDto } from './dto/search-business.dto';
import { ConfigService } from '@nestjs/config';
import { Queue, Worker } from 'bullmq';

@Injectable()
export class SearchCacheWarmService implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(SearchCacheWarmService.name);
    private warmQueue: Queue;
    private warmWorker: Worker;

    constructor(
        @InjectRepository(Listing)
        private readonly listingRepository: Repository<Listing>,
        private readonly searchLocationService: SearchLocationService,
        private readonly businessesService: BusinessesService,
        private readonly configService: ConfigService,
    ) {}

    onModuleInit() {
        const host = this.configService.get<string>('REDIS_HOST', 'your-redis-host');
        const port = this.configService.get<number>('REDIS_PORT', 6379);
        const connection = { host, port };

        if (process.env.REDIS_ENABLED === 'true') {
            this.warmQueue = new Queue('cache-warming', { connection });

            this.warmWorker = new Worker(
                'cache-warming',
                async (job) => {
                    this.logger.log(`🔄 Processing cache-warming job: ${job.name}`);
                    await this.warmTopSearchCombinations();
                },
                { connection }
            );
        }

        // Schedule the repeatable cache-warming job at 03:00 AM daily (off-peak hours: 02:00 - 05:00) in a non-blocking manner
        setImmediate(async () => {
            try {
                // Check if redis connection works or try to add with a timeout/uncaught rejection handling
                await this.warmQueue.add(
                    'warm-top-searches',
                    {},
                    {
                        repeat: {
                            pattern: '0 3 * * *', // Runs at 03:00 AM daily
                        },
                    }
                );
                this.logger.log('⏰ Cache-warming repeatable job scheduled successfully (every day at 03:00 AM).');
            } catch (err) {
                this.logger.warn(`⚠️ Failed to schedule repeatable cache-warming job (Redis might be offline): ${err.message}`);
            }
        });
    }

    async onModuleDestroy() {
        if (this.warmWorker) {
            await this.warmWorker.close();
        }
        if (this.warmQueue) {
            await this.warmQueue.close();
        }
    }

    async warmTopSearchCombinations() {
        try {
            const topRows = await this.listingRepository
                .createQueryBuilder('listing')
                .select('LOWER(listing.city)', 'city')
                .addSelect('listing.category_id', 'categoryId')
                .addSelect('COUNT(*)', 'count')
                .where('listing.status = :status', { status: BusinessStatus.APPROVED })
                .andWhere('listing.city IS NOT NULL')
                .groupBy('LOWER(listing.city)')
                .addGroupBy('listing.category_id')
                .orderBy('COUNT(*)', 'DESC')
                .limit(20)
                .getRawMany();

            for (const row of topRows) {
                const baseDto: SearchBusinessDto = {
                    city: row.city || undefined,
                    categoryId: row.categoryId || undefined,
                    page: 1,
                    limit: 20,
                };
                await this.searchLocationService.search(baseDto, () => this.businessesService.search(baseDto));
            }

            this.logger.log(`Cache warm complete for ${topRows.length} top city/category combinations`);
        } catch (error) {
            this.logger.error(`Cache warm failed: ${error.message}`);
        }
    }
}
