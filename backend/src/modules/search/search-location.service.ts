import { Injectable, Logger, Inject } from '@nestjs/common';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Brackets } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Listing, BusinessStatus } from '../../entities/business.entity';
import { SearchBusinessDto } from '../businesses/dto/search-business.dto';
import * as crypto from 'crypto';

@Injectable()
export class SearchLocationService {
    private readonly logger = new Logger(SearchLocationService.name);
    private readonly INDEX_NAME = 'businesses';
    private readonly SEARCH_TTL_MS = 15 * 60 * 1000;
    private readonly SEARCH_TTL_SECONDS = 15 * 60;
    private readonly CITY_INDEX_PREFIX = 'search:index:city:';
    private readonly CITY_CATEGORY_INDEX_PREFIX = 'search:index:city-category:';

    constructor(
        private readonly elasticsearchService: ElasticsearchService,
        @InjectRepository(Listing)
        private readonly businessRepository: Repository<Listing>,
        @Inject(CACHE_MANAGER) private cacheManager: Cache,
    ) { }

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
            page: dto.page || 1,
            limit: dto.limit || 20,
        });
        return crypto.createHash('sha1').update(normalized).digest('hex').slice(0, 8);
    }

    buildSearchCacheKey(dto: SearchBusinessDto): string {
        const citySlug = this.slugify(dto.city);
        const categorySlug = this.slugify(dto.categorySlug || dto.categoryId || 'all');
        const radiusKm = dto.radius ? String(dto.radius) : 'all';
        return `search:${citySlug}:${categorySlug}:${radiusKm}:${this.queryHash(dto)}`;
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

    private async trackCacheKey(dto: SearchBusinessDto, cacheKey: string) {
        await this.addToIndex(this.cityIndexKey(dto.city), cacheKey);
        await this.addToIndex(
            this.cityCategoryIndexKey(dto.city, dto.categorySlug || dto.categoryId || 'all'),
            cacheKey,
        );
    }

    async search<T>(dto: SearchBusinessDto, fetcher: () => Promise<T>): Promise<T> {
        const cacheKey = this.buildSearchCacheKey(dto);
        const cached = await this.cacheManager.get<T>(cacheKey);
        if (cached) {
            return cached;
        }

        const result = await fetcher();
        await this.cacheManager.set(cacheKey, result, this.SEARCH_TTL_SECONDS);
        await this.trackCacheKey(dto, cacheKey);
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
        const client =
            (this.cacheManager as any)?.store?.getClient?.() ??
            (this.cacheManager as any)?.stores?.[0]?.getClient?.() ??
            (this.cacheManager as any)?.client;

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
            } catch (error) {
                this.logger.warn(`Cache scan invalidation failed for city "${citySlug}": ${error.message}`);
                await this.invalidateIndex(this.cityIndexKey(city));
            }
        } else {
            await this.invalidateIndex(this.cityIndexKey(city));
        }
    }

    async invalidateCityCategory(city?: string | null, category?: string | null) {
        await this.invalidateIndex(this.cityCategoryIndexKey(city, category));
    }

    async searchHybrid(dto: SearchBusinessDto): Promise<any[]> {
        const cacheKey = this.buildSearchCacheKey(dto);
        
        // 1. Try Cache
        const cached = await this.cacheManager.get<any[]>(cacheKey);
        if (cached) {
            this.logger.debug(`Cache HIT for key: ${cacheKey}`);
            return cached;
        }

        this.logger.debug(`Cache MISS for key: ${cacheKey}. Executing Hybrid Search.`);

        const { query, city, categorySlug, minRating, verifiedOnly, latitude, longitude, radius } = dto;
        const normalizedQuery = (query || '').trim().toLowerCase();

        // 2. Query Elasticsearch (Semantic, Text, Filters)
        const filters: any[] = [];
        if (city) filters.push({ term: { city: city.toLowerCase() } });
        if (categorySlug) filters.push({ term: { category_slug: categorySlug } });
        if (minRating) filters.push({ range: { rating: { gte: minRating } } });
        if (verifiedOnly) filters.push({ term: { is_verified: true } });
        if (dto.featuredOnly) filters.push({ term: { is_featured: true } });

        const baseQuery = query
            ? {
                bool: {
                    should: [
                        { term: { 'title.raw': { value: normalizedQuery, boost: 20 } } },
                        { term: { 'name.raw': { value: normalizedQuery, boost: 20 } } },
                        { term: { 'category.raw': { value: normalizedQuery, boost: 12 } } },
                        { match_phrase: { title: { query, boost: 14 } } },
                        { match_phrase: { name: { query, boost: 14 } } },
                        {
                            multi_match: {
                                query,
                                fields: ['search_keywords^10', 'title^5', 'category^3', 'meta_keywords^2', 'description', 'address'],
                                fuzziness: 'AUTO'
                            }
                        },
                        {
                            match: {
                                search_text_normalized: {
                                    query: normalizedQuery,
                                    boost: 12,
                                },
                            },
                        },
                    ],
                    minimum_should_match: 1,
                },
              }
            : { match_all: {} };

        let esIds: string[] = [];
        let esFailed = false;
        try {
            const esResult = await this.elasticsearchService.search({
                index: this.INDEX_NAME,
                body: {
                    query: {
                        bool: {
                            must: [baseQuery, { term: { status: BusinessStatus.APPROVED } }],
                            filter: filters
                        }
                    },
                    size: 500, // Fetch up to 500 candidate IDs
                    _source: false // We only need IDs
                }
            });

            esIds = esResult.hits.hits.map(hit => hit._id);
        } catch (err) {
            esFailed = true;
            this.logger.error('Elasticsearch query failed, falling back to database query in hybrid search', err);
        }

        let businesses: Listing[] = [];

        // 3. Query Database (with PostGIS/earthdistance for radius lookup)
        if (esFailed) {
            this.logger.log('[Hybrid Search] Executing pure database fallback search.');
            const qb = this.businessRepository.createQueryBuilder('b')
                .leftJoinAndSelect('b.category', 'category')
                .where('b.status = :status', { status: BusinessStatus.APPROVED })
                .andWhere('b.hiddenByDeletion = false');

            if (city) {
                qb.andWhere('LOWER(b.city) = :city', { city: city.toLowerCase() });
            }
            if (categorySlug) {
                qb.andWhere('category.slug = :categorySlug', { categorySlug });
            }
            if (minRating) {
                qb.andWhere('b.averageRating >= :minRating', { minRating });
            }
            if (verifiedOnly) {
                qb.andWhere('b.isVerified = :verifiedOnly', { verifiedOnly: true });
            }

            if (query) {
                const searchTerms = query.toLowerCase().split(' ').filter(term => term.length > 0);
                for (const term of searchTerms) {
                    qb.andWhere(
                        new Brackets((innerQb) => {
                            innerQb.where('LOWER(b.title) LIKE :term', { term: `%${term}%` })
                                .orWhere('LOWER(b.description) LIKE :term', { term: `%${term}%` })
                                .orWhere('LOWER(b.city) LIKE :term', { term: `%${term}%` })
                                .orWhere('LOWER(category.name) LIKE :term', { term: `%${term}%` })
                                .orWhere('b.meta_keywords LIKE :term', { term: `%${term}%` })
                                .orWhere('"b"."search_keywords"::text ILIKE :term', { term: `%${term}%` });
                        }),
                        { term: `%${term}%` }
                    );
                }
            }

            if (latitude && longitude) {
                const formula = `earth_distance(ll_to_earth(b.latitude, b.longitude), ll_to_earth(:lat, :lng))`;
                qb.addSelect(`${formula} / 1000`, 'distance');
                qb.setParameters({ lat: latitude, lng: longitude });

                if (radius) {
                    const radiusInMeters = radius * 1000;
                    qb.andWhere(`${formula} <= :radiusInMeters`, { radiusInMeters });
                }
                qb.orderBy('distance', 'ASC');
            } else {
                qb.orderBy('b.createdAt', 'DESC');
            }

            qb.take(dto.limit || 50).skip(((dto.page || 1) - 1) * (dto.limit || 50));
            const { entities, raw } = await qb.getRawAndEntities();
            businesses = entities.map((entity, index) => {
                const rawItem = raw[index];
                if (rawItem) {
                    const distanceKey = Object.keys(rawItem).find(k => k.toLowerCase().includes('distance'));
                    if (distanceKey && rawItem[distanceKey] !== undefined && rawItem[distanceKey] !== null) {
                        (entity as any).distance = parseFloat(rawItem[distanceKey]);
                    }
                }
                return entity;
            });
        } else {
            if (esIds.length === 0) {
                return []; // No matches from ES
            }

            const qb = this.businessRepository.createQueryBuilder('b')
                .leftJoinAndSelect('b.category', 'category')
                .where('b.id IN (:...ids)', { ids: esIds })
                .andWhere('b.hiddenByDeletion = false');

            if (latitude && longitude) {
                const formula = `earth_distance(ll_to_earth(b.latitude, b.longitude), ll_to_earth(:lat, :lng))`;
                qb.addSelect(`${formula} / 1000`, 'distance');
                qb.setParameters({ lat: latitude, lng: longitude });

                if (radius) {
                    const radiusInMeters = radius * 1000;
                    qb.andWhere(`${formula} <= :radiusInMeters`, { radiusInMeters });
                }
                qb.orderBy('distance', 'ASC');
            } else {
                // Keep the ordering from ES by sorting by the order of esIds if possible,
                // or fall back to standard sorting.
                qb.orderBy('b.createdAt', 'DESC');
            }

            qb.take(dto.limit || 50).skip(((dto.page || 1) - 1) * (dto.limit || 50));
            const { entities, raw } = await qb.getRawAndEntities();
            businesses = entities.map((entity, index) => {
                const rawItem = raw[index];
                if (rawItem) {
                    const distanceKey = Object.keys(rawItem).find(k => k.toLowerCase().includes('distance'));
                    if (distanceKey && rawItem[distanceKey] !== undefined && rawItem[distanceKey] !== null) {
                        (entity as any).distance = parseFloat(rawItem[distanceKey]);
                    }
                }
                return entity;
            });
        }

        const formattedResults = businesses.map(b => ({
            id: b.id,
            title: b.title,
            description: b.description,
            category: b.category?.name,
            city: b.city,
            location: { lat: b.latitude, lon: b.longitude },
            rating: b.averageRating,
            isFeatured: b.isFeatured,
            isVerified: b.isVerified,
            status: b.status,
            slug: b.slug,
            logoUrl: b.logoUrl,
            coverImageUrl: b.coverImageUrl,
            phone: b.phone,
            address: b.address,
            followersCount: b.followersCount,
            createdAt: b.createdAt,
            distance: (b as any).distance ?? null,
        }));

        // 4. Cache the results for 15 minutes
        await this.cacheManager.set(cacheKey, formattedResults, this.SEARCH_TTL_MS);
        await this.trackCacheKey(dto, cacheKey);

        return formattedResults;
    }
}
