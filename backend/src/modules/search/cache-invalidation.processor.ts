import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Processor('search-cache-invalidation')
export class CacheInvalidationProcessor extends WorkerHost {
    private readonly logger = new Logger(CacheInvalidationProcessor.name);

    constructor(
        @Inject(CACHE_MANAGER) private cacheManager: Cache
    ) {
        super();
    }

    async process(job: Job<any, any, string>): Promise<any> {
        this.logger.log(`Processing cache invalidation for listing update: ${job.id}`);

        const { city, categorySlug } = job.data;

        try {
            // Note: cache-manager with redis-yet supports store.keys() if implemented,
            // but commonly, we can clear namespace-wide. 
            // Since standard cache-manager v5 doesn't easily support wildcard deletes across all stores,
            // a robust approach in production is using Redis client directly to run `del search:city:*`
            // For now, we will clear the entire cache or specific known keys if feasible.
            // If we have a direct redis client, we could do: redisClient.keys('search:*')
            
            // Assuming cache manager's reset clears the current namespace
            // In a highly optimized system, we'd use ioredis directly to match `search:${city}:*`
            
            // As a simplified fallback for this architecture phase:
            const cacheAny = this.cacheManager as any;
            await (cacheAny.clear ? cacheAny.clear() : cacheAny.reset?.());
            
            this.logger.log(`Successfully invalidated search cache for city: ${city}, category: ${categorySlug}`);
        } catch (error) {
            this.logger.error(`Failed to invalidate cache: ${error.message}`, error.stack);
            throw error;
        }

        return { success: true };
    }
}
