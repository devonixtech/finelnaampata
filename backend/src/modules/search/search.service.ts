import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Brackets } from 'typeorm';
import { Listing, BusinessStatus } from '../../entities/business.entity';
import { SearchBusinessDto, SearchSortBy } from '../businesses/dto/search-business.dto';
import { DayOfWeek } from '../../entities/business-hours.entity';
import { DemandService } from '../demand/demand.service';

@Injectable()
export class SearchService implements OnModuleInit {
    private INDEX_NAME = 'businesses';
    private isElasticAvailable = false;
    private readonly logger = new Logger(SearchService.name);
    private readonly romanUrduSynonymGroups: string[][] = [
        ['karachi', 'کراچی'],
        ['lahore', 'lahor', 'لاہور'],
        ['islamabad', 'اسلام آباد', 'isb'],
        ['rawalpindi', 'pindi', 'راولپنڈی'],
        ['faisalabad', 'فیصل آباد'],
        ['multan', 'ملتان'],
        ['peshawar', 'پشاور'],
        ['quetta', 'کوئٹہ'],
        ['hyderabad', 'حیدرآباد'],
        ['sialkot', 'سیالکوٹ'],
        ['restaurant', 'restoran', 'ریسٹورنٹ', 'ہوٹل'],
        ['hospital', 'hospitel', 'ہسپتال'],
        ['doctor', 'dr', 'ڈاکٹر'],
        ['clinic', 'کلینک'],
        ['pharmacy', 'medical store', 'medikal', 'میڈیکل', 'فارمیسی'],
        ['school', 'اسکول'],
        ['college', 'کالج'],
        ['university', 'یونیورسٹی'],
        ['salon', 'beauty parlour', 'parlor', 'سیلون'],
        ['spa', 'اسپا'],
        ['gym', 'جِم'],
        ['bakery', 'بیکری'],
        ['cafe', 'کافی شاپ', 'کیفے'],
        ['grocery', 'kiryana', 'کریانہ'],
        ['tailor', 'darzi', 'درزی'],
        ['plumber', 'پلمبر'],
        ['electrician', 'الیکٹریشن'],
        ['mechanic', 'workshop', 'مکینک', 'ورکشاپ'],
        ['mobile', 'موبائل'],
        ['computer', 'کمپیوٹر'],
        ['lawyer', 'wakeel', 'وکیل'],
        ['real estate', 'property dealer', 'پراپرٹی'],
    ];

    constructor(
        private readonly elasticsearchService: ElasticsearchService,
        private readonly configService: ConfigService,
        @InjectRepository(Listing)
        private readonly businessRepository: Repository<Listing>,
        private readonly demandService: DemandService,
    ) { }

    onModuleInit() {
        // Run index setup in the background to avoid blocking application startup
        setImmediate(async () => {
            const isEnabled = this.configService.get<string>('ELASTICSEARCH_ENABLED') === 'true';

            if (!isEnabled) {
                this.isElasticAvailable = false;
                this.logger.log('ℹ️ Elasticsearch is disabled by configuration. Using database search.');
                return;
            }

            this.INDEX_NAME = this.configService.get<string>('ELASTICSEARCH_INDEX') || 'businesses';

            try {
                await this.elasticsearchService.ping();
                this.isElasticAvailable = true;
                this.logger.log('✅ Elasticsearch is available. Creating index if needed...');
                await this.createIndex();
                this.logger.log('Search metadata sync starting...');
                const available = await this.isAvailable();
                if (available) {
                    // Re-index on startup to ensure mapping is up to date
                    // We do this asynchronously to not block application startup
                    this.reindexAll().catch(err => {
                        this.logger.error('Failed to reindex on startup:', err);
                    });
                }
                this.logger.log('✅ Elasticsearch index ready.');
            } catch (error) {
                this.isElasticAvailable = false;
                this.logger.warn(`⚠️ Elasticsearch is enabled but not reachable: ${error.message}`);
            }
        });
    }

    /**
     * Check if Elasticsearch is available
     */
    isAvailable() {
        return this.isElasticAvailable;
    }

    private normalizeSearchText(value?: string | null): string {
        return (value || '')
            .toLowerCase()
            .normalize('NFKD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[اآأإ]/g, 'ا')
            .replace(/[يی]/g, 'ی')
            .replace(/[كک]/g, 'ک')
            .replace(/[ةه]/g, 'ه')
            .replace(/[ؤئ]/g, '')
            .replace(/[^\p{L}\p{N}\s]/gu, ' ')
            .replace(/\s+/g, ' ')
            .trim();
    }

    private expandRomanUrduTokens(value?: string | null): string[] {
        const normalized = this.normalizeSearchText(value);
        if (!normalized) return [];

        const expanded = new Set<string>(normalized.split(' ').filter(Boolean));
        for (const group of this.romanUrduSynonymGroups) {
            const normalizedGroup = group.map((item) => this.normalizeSearchText(item));
            const matchesGroup = normalizedGroup.some((item) =>
                item.includes(' ') ? normalized.includes(item) : expanded.has(item),
            );
            if (matchesGroup) {
                normalizedGroup.forEach((item) => {
                    if (item) expanded.add(item);
                });
            }
        }

        return Array.from(expanded);
    }

    private buildNormalizedSearchText(...values: Array<string | string[] | null | undefined>): string {
        const rawParts = values.flatMap((value) => Array.isArray(value) ? value : [value]);
        const normalizedParts = rawParts
            .map((value) => this.normalizeSearchText(value))
            .filter(Boolean);
        const expanded = rawParts.flatMap((value) => this.expandRomanUrduTokens(value));
        return Array.from(new Set([...normalizedParts, ...expanded])).join(' ');
    }

    /**
     * Create index with appropriate mapping
     */
    private async createIndex() {
        const indexExists = await this.elasticsearchService.indices.exists({
            index: this.INDEX_NAME,
        });

        if (!indexExists) {
            await this.elasticsearchService.indices.create({
                index: this.INDEX_NAME,
                body: {
                    settings: {
                        analysis: {
                            analyzer: {
                                search_text_analyzer: {
                                    type: 'custom',
                                    tokenizer: 'standard',
                                    filter: ['lowercase', 'asciifolding'],
                                },
                            },
                            normalizer: {
                                lowercase_normalizer: {
                                    type: 'custom',
                                    filter: ['lowercase', 'asciifolding'],
                                },
                            },
                        },
                    },
                    mappings: {
                        properties: {
                            id: { type: 'keyword' },
                            name: {
                                type: 'text',
                                analyzer: 'search_text_analyzer',
                                fields: {
                                    raw: { type: 'keyword', normalizer: 'lowercase_normalizer' },
                                },
                            },
                            title: {
                                type: 'text',
                                analyzer: 'search_text_analyzer',
                                fields: {
                                    raw: { type: 'keyword', normalizer: 'lowercase_normalizer' },
                                },
                            },
                            slug: { type: 'keyword' },
                            description: { type: 'text', analyzer: 'search_text_analyzer' },
                            category: {
                                type: 'text',
                                analyzer: 'search_text_analyzer',
                                fields: {
                                    raw: { type: 'keyword', normalizer: 'lowercase_normalizer' },
                                },
                            },
                            category_slug: { type: 'keyword' },
                            city: { type: 'keyword' },
                            address: { type: 'text', analyzer: 'search_text_analyzer' },
                            logoUrl: { type: 'keyword' },
                            coverImageUrl: { type: 'keyword' },
                            location: { type: 'geo_point' },
                            lat_lng: { type: 'geo_point' },
                            rating: { type: 'float' },
                            is_featured: { type: 'boolean' },
                            is_verified: { type: 'boolean' },
                            status: { type: 'keyword' },
                            is_active: { type: 'boolean' },
                            search_keywords: { type: 'text', analyzer: 'search_text_analyzer' },
                            meta_keywords: { type: 'text', analyzer: 'search_text_analyzer' },
                            search_text_normalized: { type: 'text', analyzer: 'search_text_analyzer' },
                            followersCount: { type: 'integer' },
                            businessType: { type: 'keyword' },
                            coreBusinessNature: { type: 'keyword' },
                            operationalStructure: { type: 'keyword' },
                            targetMarket: { type: 'keyword' },
                            industrySubType: { type: 'keyword' },
                            amenities: { type: 'keyword' },
                            languagesSpoken: { type: 'keyword' },
                            acceptedPaymentMethods: { type: 'keyword' },
                            certifications: { type: 'keyword' },
                            timezone: { type: 'keyword' },
                            createdAt: { type: 'date' },
                            updatedAt: { type: 'date' },
                        },
                    },
                },
            });
        }
    }

    /**
     * Index a single business
     */
    async indexBusiness(business: Listing) {
        if (!this.isElasticAvailable) return;
        return this.elasticsearchService.index({
            index: this.INDEX_NAME,
            id: business.id,
            body: {
                id: business.id,
                name: business.title,
                title: business.title,
                slug: business.slug,
                description: business.description,
                category: business.category?.name,
                category_slug: business.category?.slug,
                city: business.city,
                address: business.address,
                logoUrl: business.logoUrl,
                coverImageUrl: business.coverImageUrl,
                location: {
                    lat: business.latitude,
                    lon: business.longitude,
                },
                lat_lng: {
                    lat: business.latitude,
                    lon: business.longitude,
                },
                rating: Number(business.averageRating) || 0,
                status: business.status,
                is_active: business.status === BusinessStatus.APPROVED,
                is_verified: business.isVerified,
                is_featured: business.isFeatured,
                search_keywords: business.searchKeywords || [],
                meta_keywords: business.metaKeywords || '',
                search_text_normalized: this.buildNormalizedSearchText(
                    business.title,
                    business.category?.name,
                    business.city,
                    business.address,
                    business.metaKeywords,
                    business.searchKeywords || [],
                ),
                followersCount: business.followersCount || 0,
                businessType: business.businessType || [],
                coreBusinessNature: business.coreBusinessNature || [],
                operationalStructure: business.operationalStructure || null,
                targetMarket: business.targetMarket || [],
                industrySubType: business.industrySubType || [],
                amenities: business.facilities || [],
                languagesSpoken: business.businessLanguages || [],
                acceptedPaymentMethods: business.paymentMethods || [],
                certifications: [],
                timezone: business.timezone || 'UTC',
                createdAt: business.createdAt,
                updatedAt: business.updatedAt,
            },
        });
    }

    /**
     * Database-based fallback search using TypeORM
     */
    private async dbSearch(searchDto: SearchBusinessDto): Promise<any[]> {
        const {
            query,
            city,
            categorySlug,
            minRating,
            latitude,
            longitude,
            radius,
            openNow,
            verifiedOnly,
            featuredOnly,
            sortBy,
            limit = 50,
            page = 1
        } = searchDto;

        const skip = (page - 1) * limit;
        const take = limit;

        this.logger.log(`[DB Fallback] Search params: ${JSON.stringify(searchDto)}`);

        const qb = this.businessRepository
            .createQueryBuilder('b')
            .leftJoinAndSelect('b.category', 'category')
            .where('b.status = :status', { status: BusinessStatus.APPROVED })
            .andWhere('b.hiddenByDeletion = false')
            .andWhere(new Brackets(qb => {
                qb.where('category.id IS NULL')
                  .orWhere('category.status = :catStatus', { catStatus: 'active' });
            }));

        if (query) {
            const searchTerms = query.toLowerCase().split(' ').filter(term => term.length > 0);
            for (const term of searchTerms) {
                qb.andWhere(
                    new Brackets((innerQb) => {
                        innerQb.where('LOWER(b.name) LIKE :term', { term: `%${term}%` })
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

        if (featuredOnly) {
            qb.andWhere('b.isFeatured = :featuredOnly', { featuredOnly: true });
        }

        // Distance Filter & Selection
        if (latitude && longitude) {
            const formula = `earth_distance(ll_to_earth(b.latitude, b.longitude), ll_to_earth(:lat, :lng))`;
            qb.addSelect(`${formula} / 1000`, 'distance');
            qb.setParameters({ lat: latitude, lng: longitude });

            if (radius) {
                const radiusInMeters = radius * 1000;
                qb.andWhere(`${formula} <= :radiusInMeters`, { radiusInMeters });
            }
        }

        // Open Now Filter
        if (openNow) {
            const now = new Date();
            const days = [
                DayOfWeek.SUNDAY,
                DayOfWeek.MONDAY,
                DayOfWeek.TUESDAY,
                DayOfWeek.WEDNESDAY,
                DayOfWeek.THURSDAY,
                DayOfWeek.FRIDAY,
                DayOfWeek.SATURDAY,
            ];
            const currentDay = days[now.getDay()];
            const currentTime = now.toTimeString().split(' ')[0]; // HH:MM:SS

            qb.innerJoin('b.businessHours', 'bh', 'bh.dayOfWeek = :currentDay AND bh.isOpen = true', { currentDay });
            qb.andWhere(':currentTime BETWEEN bh.openTime AND bh.closeTime', { currentTime });
        }

        // Apply Sorting based on sortBy
        switch (sortBy) {
            case SearchSortBy.DISTANCE:
                if (latitude && longitude) {
                    qb.orderBy('distance', 'ASC');
                } else {
                    qb.orderBy('b.isFeatured', 'DESC').addOrderBy('b.averageRating', 'DESC');
                }
                break;
            case SearchSortBy.RATING:
                qb.orderBy('b.averageRating', 'DESC');
                break;
            case SearchSortBy.MOST_REVIEWED:
                qb.orderBy('b.totalReviews', 'DESC');
                break;
            case SearchSortBy.MOST_CONTACTED:
                qb.orderBy('b.totalLeads', 'DESC');
                break;
            case SearchSortBy.NEWEST:
                qb.orderBy('b.createdAt', 'DESC');
                break;
            case SearchSortBy.RELEVANCE:
            default:
                qb.orderBy('b.isFeatured', 'DESC')
                    .addOrderBy('b.averageRating', 'DESC')
                    .addOrderBy('b.followersCount', 'DESC');
                break;
        }

        qb.skip(skip).take(take);

        const results = await qb.getMany();

        return results.map((b) => ({
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
        }));
    }

    async search(
        searchDto: SearchBusinessDto,
        userId?: string,
        ipAddress?: string,
        userAgent?: string
    ) {
        let results: any[];
        
        if (!this.isElasticAvailable) {
            results = await this.dbSearch(searchDto);
        } else {

        const {
            query, city, categorySlug, minRating,
            latitude, longitude, radius,
            verifiedOnly, featuredOnly, sortBy
        } = searchDto;

        const filters: any[] = [{ term: { status: BusinessStatus.APPROVED } }];

        if (city) {
            filters.push({ term: { city: city.toLowerCase() } });
        }

        if (categorySlug) {
            filters.push({ term: { category_slug: categorySlug } });
        }

        if (minRating) {
            filters.push({ range: { rating: { gte: minRating } } });
        }

        if (verifiedOnly) {
            filters.push({ term: { is_verified: true } }); // Changed to is_verified
        }

        if (featuredOnly) {
            filters.push({ term: { is_featured: true } });
        }

        // Base query - if no text query, match all but keep filters
        const normalizedQuery = (query || '').trim().toLowerCase();
        const normalizedExpandedQuery = this.buildNormalizedSearchText(query);
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
                                fields: [
                                    'title^10',
                                    'name^10',
                                    'category^8',
                                    'search_keywords^6',
                                    'meta_keywords^4',
                                    'description^2',
                                    'address'
                                ],
                                fuzziness: 'AUTO'
                            }
                        },
                        {
                            match: {
                                search_text_normalized: {
                                    query: normalizedExpandedQuery || normalizedQuery,
                                    boost: 12,
                                },
                            },
                        }
                    ],
                    minimum_should_match: 1,
                }
              }
            : { match_all: {} };

        // Ranking functions
        const functions: any[] = [
            // Boost Verified
            {
                filter: { term: { is_verified: true } }, // Changed to is_verified
                weight: 1.5
            },
            // Rating Score
            {
                field_value_factor: {
                    field: 'rating',
                    factor: 1.0,
                    missing: 0
                }
            },
            // Followers Score (Minimal influence)
            {
                field_value_factor: {
                    field: 'followersCount',
                    factor: 0.1,
                    modifier: 'log1p',
                    missing: 0
                }
            }
        ];

        // Proximity Boost (if location provided)
        if (latitude && longitude) {
            functions.push({
                gauss: {
                    location: {
                        origin: { lat: latitude, lon: longitude },
                        offset: "2km",
                        scale: "10km",
                        decay: 0.5
                    }
                }
            });

            // Distance filter if radius provided
            if (radius) {
                filters.push({
                    geo_distance: {
                        distance: `${radius}km`,
                        location: { lat: latitude, lon: longitude }
                    }
                });
            }
        }

        // Construct sorting for ES
        const sort: any[] = [];
        if (sortBy === SearchSortBy.DISTANCE && latitude && longitude) {
            sort.push({
                _geo_distance: {
                    location: { lat: latitude, lon: longitude },
                    order: "asc",
                    unit: "km",
                    mode: "min",
                    distance_type: "arc",
                    ignore_unmapped: true
                }
            });
        } else if (sortBy === SearchSortBy.RATING) {
            sort.push({ rating: { order: "desc" } });
        } else if (sortBy === SearchSortBy.NEWEST) {
            sort.push({ createdAt: { order: "desc" } });
        } else if (sortBy === SearchSortBy.RELEVANCE) {
            // Default is score-based
            sort.push({ _score: { order: "desc" } });
        }

        const limit = searchDto.limit || 50;
        const page = searchDto.page || 1;
        const searchAfterRaw = (searchDto as any).searchAfter as string | undefined;
        let searchAfter: any[] | undefined;
        if (searchAfterRaw) {
            try {
                searchAfter = JSON.parse(Buffer.from(searchAfterRaw, 'base64').toString('utf8'));
            } catch {
                searchAfter = undefined;
            }
        }

        const response = await this.elasticsearchService.search({
            index: this.INDEX_NAME,
            body: {
                query: {
                    function_score: {
                        query: {
                            bool: {
                                must: [baseQuery],
                                filter: filters,
                            },
                        },
                        functions,
                        score_mode: 'multiply',
                        boost_mode: 'multiply',
                    },
                },
                sort: sort.length > 0 ? sort : [{ _score: { order: 'desc' } }, { id: { order: 'asc' } }],
                size: limit,
                search_after: searchAfter,
            },
        });

        const hits = response.hits.hits || [];
        results = hits.map((hit: any) => ({
            ...hit._source,
            score: hit._score,
            distance: hit.sort && sortBy === SearchSortBy.DISTANCE ? hit.sort[0] : undefined
        }));
        const lastSort = hits.length ? hits[hits.length - 1].sort : null;
        const nextSearchAfter = lastSort ? Buffer.from(JSON.stringify(lastSort), 'utf8').toString('base64') : null;
        (results as any).__pagination = {
            page,
            limit,
            nextSearchAfter,
        };
        } // end of else block

        // Log search for demand insights
        if (searchDto.query || searchDto.categorySlug) {
            this.demandService.logSearch({
                keyword: searchDto.query || '',
                city: searchDto.city,
                categorySlug: searchDto.categorySlug,
                latitude: searchDto.latitude,
                longitude: searchDto.longitude,
                userId,
                ipAddress,
                userAgent,
                resultsCount: results.length,
            }).catch(err => this.logger.error(`Failed to log search: ${err.message}`));
        }

        return results;
    }

    /**
     * Search only for IDs (useful for combining with TypeORM)
     */
    async searchIds(query: string, city?: string, category?: string, limit = 100): Promise<string[]> {
        if (!this.isElasticAvailable) return [];

        const filters: any[] = [{ term: { status: 'approved' } }];
        if (city) filters.push({ term: { city: city.toLowerCase() } });
        if (category) filters.push({ term: { category: category.toLowerCase() } });

        const normalizedQuery = (query || '').trim().toLowerCase();
        const normalizedExpandedQuery = this.buildNormalizedSearchText(query);
        const response = await this.elasticsearchService.search({
            index: this.INDEX_NAME,
            size: limit,
            body: {
                _source: false,
                query: {
                    function_score: {
                        query: {
                            bool: {
                                must: query ? [
                                    {
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
                                                        fields: [
                                                            'title^10',
                                                            'name^10',
                                                            'category^8',
                                                            'search_keywords^6',
                                                            'meta_keywords^4',
                                                            'description^2',
                                                            'address'
                                                        ],
                                                        fuzziness: 'AUTO'
                                                    },
                                                },
                                                {
                                                    match: {
                                                        search_text_normalized: {
                                                            query: normalizedExpandedQuery || normalizedQuery,
                                                            boost: 12,
                                                        },
                                                    },
                                                },
                                            ],
                                            minimum_should_match: 1,
                                        },
                                    },
                                ] : [{ match_all: {} }],
                                filter: filters,
                            },
                        },
                    },
                },
            },
        });

        return response.hits.hits.map((hit: any) => hit._id);
    }

    /**
     * Bulk re-index (Sync DB to ES)
     */
    async reindexAll() {
        if (!this.isElasticAvailable) {
            this.logger.warn('[reindexAll] Elasticsearch not available. Skipping re-index.');
            return { indexed: 0, message: 'Elasticsearch is not available.' };
        }

        // Delete and recreate index to ensure new mapping is applied
        try {
            const indexExists = await this.elasticsearchService.indices.exists({
                index: this.INDEX_NAME,
            });
            if (indexExists) {
                await this.elasticsearchService.indices.delete({
                    index: this.INDEX_NAME,
                });
                this.logger.log(`🗑️ Deleted existing index: ${this.INDEX_NAME}`);
            }
            await this.createIndex();
            this.logger.log(`✅ Re-created index with new mapping: ${this.INDEX_NAME}`);
        } catch (error) {
            this.logger.error(`❌ Error refreshing index: ${error.message}`);
        }

        const businesses = await this.businessRepository.find({
            relations: ['category'],
        });

        for (const business of businesses) {
            await this.indexBusiness(business);
        }

        return { indexed: businesses.length };
    }

    /**
     * Remove from index
     */
    async remove(businessId: string) {
        if (!this.isElasticAvailable) return;
        await this.elasticsearchService.delete({
            index: this.INDEX_NAME,
            id: businessId,
        });
    }
}
