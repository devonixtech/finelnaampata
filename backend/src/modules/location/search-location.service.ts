import { Inject, Injectable } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { createHash } from 'crypto';
import { SearchBusinessDto } from '../businesses/dto/search-business.dto';

type SearchPayload = {
    items: any[];
    page: number;
    limit: number;
    total: number;
};

@Injectable()
export class SearchLocationService {
    private readonly SEARCH_TTL_SECONDS = 15 * 60;
    private readonly CITY_INDEX_PREFIX = 'search:index:city:';
    private readonly CITY_CATEGORY_INDEX_PREFIX = 'search:index:city-category:';

    constructor(
        @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    ) {}

    private slugify(value?: string | null): string {
        const normalized = (value || '').trim().toLowerCase();
        if (!normalized) return 'all';
        return normalized.replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'all';
    }

    private queryHash(dto: SearchBusinessDto): string {
        const normalized = JSON.stringify({
            query: dto.query || '',
            city: dto.city || '',
            categoryId: dto.categoryId || '',
            categorySlug: dto.categorySlug || '',
            radius: dto.radius || '',
            sortBy: dto.sortBy || '',
            openNow: Boolean(dto.openNow),
            verifiedOnly: Boolean(dto.verifiedOnly),
            featuredOnly: Boolean(dto.featuredOnly),
            latitude: dto.latitude || '',
            longitude: dto.longitude || '',
            minRating: dto.minRating || '',
            priceRange: dto.priceRange || '',
            filter: dto.filter || '',
        });
        return createHash('sha1').update(normalized).digest('hex').slice(0, 8);
    }

    buildSearchCacheKey(dto: SearchBusinessDto): string {
        const citySlug = this.slugify(dto.city);
        const categorySlug = this.slugify(dto.categorySlug || dto.categoryId || 'all');
        const radiusKm = dto.radius ? String(dto.radius) : 'all';
        const hash = this.queryHash(dto);
        return `search:${citySlug}:${categorySlug}:${radiusKm}:${hash}`;
    }

    private cityIndexKey(city?: string | null) {
        return `${this.CITY_INDEX_PREFIX}${this.slugify(city)}`;
    }

    private cityCategoryIndexKey(city?: string | null, category?: string | null) {
        return `${this.CITY_CATEGORY_INDEX_PREFIX}${this.slugify(city)}:${this.slugify(category)}`;
    }

    private async addToIndex(indexKey: string, value: string) {
        const existing = (await this.cacheManager.get<string[]>(indexKey)) || [];
        if (!existing.includes(value)) {
            existing.push(value);
            await this.cacheManager.set(indexKey, existing, this.SEARCH_TTL_SECONDS);
        }
    }

    async search<T>(dto: SearchBusinessDto, fetcher: () => Promise<T>) {
        const cacheKey = this.buildSearchCacheKey(dto);
        const cached = await this.cacheManager.get<T>(cacheKey);
        if (cached) return cached;

        const result = await fetcher();
        await this.cacheManager.set(cacheKey, result as SearchPayload, this.SEARCH_TTL_SECONDS);
        await this.addToIndex(this.cityIndexKey(dto.city), cacheKey);
        await this.addToIndex(this.cityCategoryIndexKey(dto.city, dto.categorySlug || dto.categoryId || 'all'), cacheKey);
        return result;
    }

    private async invalidateIndex(indexKey: string) {
        const keys = (await this.cacheManager.get<string[]>(indexKey)) || [];
        await Promise.all(keys.map((cacheKey) => this.cacheManager.del(cacheKey)));
        await this.cacheManager.del(indexKey);
    }

    async invalidateCity(city?: string | null) {
        const citySlug = this.slugify(city);
        const pattern = `search:${citySlug}:*`;
        const client = (this.cacheManager as any)?.store?.getClient?.() ?? (this.cacheManager as any)?.stores?.[0]?.getClient?.() ?? (this.cacheManager as any)?.client;
        if (client && typeof client.scan === 'function') {
            try {
                let cursor = '0';
                do {
                    const reply = await client.scan(cursor, { MATCH: pattern, COUNT: 100 });
                    cursor = reply.cursor;
                    const keys = reply.keys;
                    if (keys && keys.length > 0) {
                        await client.del(keys);
                    }
                } while (cursor !== '0');
            } catch (err) {
                console.error('Redis SCAN failed during invalidation:', err);
                await this.invalidateIndex(this.cityIndexKey(city));
            }
        } else {
            await this.invalidateIndex(this.cityIndexKey(city));
        }
    }

    async invalidateCityCategory(city?: string | null, category?: string | null) {
        await this.invalidateIndex(this.cityCategoryIndexKey(city, category));
    }
}
