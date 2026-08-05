import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Business, BusinessStatus } from '../../entities/business.entity';

@Injectable()
export class BusinessesService {
    constructor(
        @InjectRepository(Business)
        private businessesRepository: Repository<Business>,
    ) { }

    async findAll(options: any = {}): Promise<{ data: Business[], total: number, page: number, limit: number }> {
        const { limit = 10, page = 1, sort = 'createdAt' } = options;
        const [data, total] = await this.businessesRepository.findAndCount({
            where: { status: BusinessStatus.APPROVED },
            take: limit,
            skip: (page - 1) * limit,
            order: { [sort]: 'DESC' },
            relations: ['category']
        });

        return {
            data,
            total,
            page: Number(page),
            limit: Number(limit)
        };
    }

    async findOne(id: string): Promise<Business | null> {
        return this.businessesRepository.findOne({
            where: { id },
            relations: ['category', 'vendor']
        });
    }

    async findBySlug(slug: string): Promise<Business | null> {
        return this.businessesRepository.findOne({
            where: { slug },
            relations: ['category', 'vendor']
        });
    }

    async search(params: any): Promise<{ data: Business[], total: number, page: number, limit: number }> {
        const { limit = 20, page = 1, featuredOnly, verifiedOnly, categorySlug, city, query, minRating, latitude, longitude, radius, sortBy } = params;

        const queryBuilder = this.businessesRepository.createQueryBuilder('business')
            .leftJoinAndSelect('business.category', 'category')
            .leftJoinAndSelect('business.vendor', 'vendor')

        // Base condition: Approved status
        queryBuilder.where('business.status = :status', { status: BusinessStatus.APPROVED });

        // Featured filtering
        const shouldShowFeaturedOnly = params.featuredOnly === 'true' || params.featuredOnly === true || params.filter === 'featured';
        if (shouldShowFeaturedOnly) {
            queryBuilder.andWhere('business.isFeatured = :isFeaturedVal', { isFeaturedVal: true });
        }

        // Verified filtering
        const shouldShowVerifiedOnly = params.verifiedOnly === 'true' || params.verifiedOnly === true;
        if (shouldShowVerifiedOnly) {
            queryBuilder.andWhere('vendor.isVerified = :isVerifiedVal', { isVerifiedVal: true });
        }

        if (categorySlug) {
            queryBuilder.andWhere('category.slug = :categorySlug', { categorySlug });
        }

        if (city) {
            queryBuilder.andWhere('LOWER(business.city) = LOWER(:city)', { city });
        }

        if (minRating) {
            queryBuilder.andWhere('business.averageRating >= :minRating', { minRating: Number(minRating) });
        }

        if (query) {
            queryBuilder.andWhere('(LOWER(business.name) LIKE LOWER(:query) OR LOWER(business.description) LIKE LOWER(:query))', { query: `%${query}%` });
        }

        // Distance / Proximity Calculation using Haversine Formula (if coordinates provided)
        let hasDistance = false;
        if (latitude && longitude) {
            hasDistance = true;
            const lat = Number(latitude);
            const lng = Number(longitude);
            const rad = radius ? Number(radius) : null;
            
            // Haversine formula in pure SQL for km
            const distanceSql = `(6371 * acos(cos(radians(${lat})) * cos(radians(business.latitude)) * cos(radians(business.longitude) - radians(${lng})) + sin(radians(${lat})) * sin(radians(business.latitude))))`;
            
            queryBuilder.addSelect(`${distanceSql}`, 'distance');
            
            if (rad) {
                queryBuilder.andWhere(`${distanceSql} <= :rad`, { rad });
            }
        }

        // Calculate Ranking Intelligence Score dynamically
        // 20 points for Featured, 10 for Verified, up to 10 for Ratings, up to 25 for Reviews
        const rankingScoreSql = `(
            (CASE WHEN business.isFeatured = true THEN 20 ELSE 0 END) +
            (CASE WHEN vendor.isVerified = true THEN 10 ELSE 0 END) +
            (COALESCE(business.averageRating, 0) * 2) +
            (LEAST(COALESCE(business.totalReviews, 0), 50) * 0.5)
        )`;
        queryBuilder.addSelect(rankingScoreSql, 'ranking_score');

        // Apply sorting based on intelligence or user preference
        if (sortBy === 'distance' && hasDistance) {
            queryBuilder.orderBy('distance', 'ASC');
        } else if (sortBy === 'rating') {
            queryBuilder.orderBy('business.averageRating', 'DESC');
        } else if (sortBy === 'reviews') {
            queryBuilder.orderBy('business.totalReviews', 'DESC');
        } else if (sortBy === 'newest' || params.filter === 'new') {
            queryBuilder.orderBy('business.createdAt', 'DESC');
        } else if (sortBy === 'oldest') {
            queryBuilder.orderBy('business.createdAt', 'ASC');
        } else {
            // 'relevance' or default: Sort by our Ranking Intelligence Score
            queryBuilder.orderBy('ranking_score', 'DESC');
            queryBuilder.addOrderBy('business.createdAt', 'DESC');
        }

        // Pagination
        queryBuilder.take(Number(limit));
        queryBuilder.skip((Number(page) - 1) * Number(limit));

        // When using getManyAndCount with added raw selects (like distance/ranking_score), 
        // typeorm strips the raw columns from getMany(). For now, we will just use it for sorting logic.
        // We can use getRawAndEntities() if we wanted to extract the exact distance per item.
        const { entities, raw } = await queryBuilder.getRawAndEntities();
        const total = await queryBuilder.getCount(); // To get total correctly with distinct rows

        // Optional: Map raw calculated 'distance' back to the entity if needed by the frontend
        if (hasDistance && entities.length) {
            entities.forEach((entity, index) => {
                const rawRow = raw.find(r => r.business_id === entity.id);
                if (rawRow && rawRow.distance) {
                    (entity as any).distance = Math.round(Number(rawRow.distance) * 10) / 10; // 1 decimal place
                }
            });
        }

        return {
            data: entities,
            total,
            page: Number(page),
            limit: Number(limit)
        };
    }

    async create(createDto: Partial<Business>): Promise<Business> {
        // Enforce limits
        const isPaid = createDto.isFeatured === true;
        
        if (!isPaid) {
            // Free plan limits
            if (createDto.galleryImages && createDto.galleryImages.length > 3) {
                createDto.galleryImages = createDto.galleryImages.slice(0, 3);
            }
            if (createDto.serviceCategories && createDto.serviceCategories.length > 1) {
                createDto.serviceCategories = createDto.serviceCategories.slice(0, 1);
            }
            createDto.alternatePhones = null; // Paid only
            createDto.socialLinks = null; // Paid only
            createDto.keywords = null; // Paid only
        } else {
            // Paid plan limits
            if (createDto.serviceCategories && createDto.serviceCategories.length > 4) {
                createDto.serviceCategories = createDto.serviceCategories.slice(0, 4);
            }
            if (createDto.alternatePhones && createDto.alternatePhones.length > 5) {
                createDto.alternatePhones = createDto.alternatePhones.slice(0, 5);
            }
            if (createDto.keywords && createDto.keywords.length > 10) {
                createDto.keywords = createDto.keywords.slice(0, 10);
            }
        }

        const business = this.businessesRepository.create(createDto);
        if (!business.slug && business.name) {
            business.slug = business.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now();
        }
        return this.businessesRepository.save(business);
    }

    async update(id: string, updateDto: Partial<Business>): Promise<Business> {
        const business = await this.findOne(id);
        if (!business) {
            throw new Error('Business not found');
        }

        const isPaid = business.isFeatured || updateDto.isFeatured === true;
        
        if (!isPaid) {
            if (updateDto.galleryImages && updateDto.galleryImages.length > 3) {
                updateDto.galleryImages = updateDto.galleryImages.slice(0, 3);
            }
            if (updateDto.serviceCategories && updateDto.serviceCategories.length > 1) {
                updateDto.serviceCategories = updateDto.serviceCategories.slice(0, 1);
            }
            updateDto.alternatePhones = null;
            updateDto.socialLinks = null;
            updateDto.keywords = null;
        } else {
            if (updateDto.serviceCategories && updateDto.serviceCategories.length > 4) {
                updateDto.serviceCategories = updateDto.serviceCategories.slice(0, 4);
            }
            if (updateDto.alternatePhones && updateDto.alternatePhones.length > 5) {
                updateDto.alternatePhones = updateDto.alternatePhones.slice(0, 5);
            }
            if (updateDto.keywords && updateDto.keywords.length > 10) {
                updateDto.keywords = updateDto.keywords.slice(0, 10);
            }
        }

        Object.assign(business, updateDto);
        return this.businessesRepository.save(business);
    }
}
