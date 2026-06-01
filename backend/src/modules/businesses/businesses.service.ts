import {
    Injectable,
    NotFoundException,
    ForbiddenException,
    BadRequestException,
    ConflictException,
    OnModuleInit,
    Optional,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, Not, Brackets, Like, MoreThan } from 'typeorm';
import { Listing, BusinessStatus } from '../../entities/business.entity';
import { BusinessHours, DayOfWeek } from '../../entities/business-hours.entity';
import { BusinessAmenity } from '../../entities/business-amenity.entity';
import { Amenity } from '../../entities/amenity.entity';
import { Category, CategoryStatus } from '../../entities/category.entity';
import { Vendor } from '../../entities/vendor.entity';
import { User, UserRole } from '../../entities/user.entity';
import { AddressConfigService } from '../address/address-config.service';
import { ActivePlan, ActivePlanStatus } from '../../entities/active-plan.entity';
import { Subscription, SubscriptionStatus } from '../../entities/subscription.entity';
import { SubscriptionPlan, SubscriptionPlanType } from '../../entities/subscription-plan.entity';
import { CreateBusinessDto } from './dto/create-business.dto';
import { UpdateBusinessDto } from './dto/update-business.dto';
import { SearchBusinessDto, SearchSortBy } from './dto/search-business.dto';
import {
    createPaginatedResponse,
    calculateSkip,
} from '../../common/utils/pagination.util';
import { generateSlug, generateUniqueSlug } from '../../common/utils/slug.util';
import { calculateDistance } from '../../common/utils/geolocation.util';
import { NotificationsService, NotificationType } from '../notifications/notifications.service';
import { SearchService } from '../search/search.service';
import { DemandService } from '../demand/demand.service';
import { GeocodingQueueService } from './geocoding-queue.service';
import { AffiliateService } from '../affiliate/affiliate.service';
import { SearchLocationService } from '../location/search-location.service';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class BusinessesService implements OnModuleInit {
    constructor(
        @InjectRepository(Listing)
        private listingRepository: Repository<Listing>,
        @InjectRepository(BusinessHours)
        private businessHoursRepository: Repository<BusinessHours>,
        @InjectRepository(BusinessAmenity)
        private businessAmenityRepository: Repository<BusinessAmenity>,
        @InjectRepository(Amenity)
        private amenityRepository: Repository<Amenity>,
        @InjectRepository(Category)
        private categoryRepository: Repository<Category>,
        @InjectRepository(Vendor)
        private vendorRepository: Repository<Vendor>,
        @InjectRepository(User)
        private userRepository: Repository<User>,
        @InjectRepository(ActivePlan)
        private activePlanRepository: Repository<ActivePlan>,
        @InjectRepository(Subscription)
        private subscriptionRepository: Repository<Subscription>,
        @InjectRepository(SubscriptionPlan)
        private subscriptionPlanRepository: Repository<SubscriptionPlan>,
        private notificationsService: NotificationsService,
        private searchService: SearchService,
        private demandService: DemandService,
        private geocodingQueueService: GeocodingQueueService,
        private searchLocationService: SearchLocationService,
        private addressConfigService: AddressConfigService,
        private affiliateService: AffiliateService,
        @Optional() @InjectQueue('search-cache-invalidation')
        private searchCacheInvalidationQueue?: Queue,
    ) { }

    private async validatePostalForCountry(country?: string, pincode?: string | null): Promise<void> {
        const countryKey = (country || 'Pakistan').trim();
        const valid = await this.addressConfigService.validatePostalCode(countryKey, pincode);
        if (!valid) {
            throw new BadRequestException('Invalid postal code format for the selected country.');
        }
    }

    private async assignFreePlanToVendor(vendorId: string): Promise<void> {
        const freePlan = await this.subscriptionPlanRepository.findOne({
            where: { planType: SubscriptionPlanType.FREE, isActive: true },
        });
        if (!freePlan) return;

        const existing = await this.subscriptionRepository.findOne({
            where: { vendorId, planId: freePlan.id, status: SubscriptionStatus.ACTIVE },
        });
        if (existing) return;

        const now = new Date();
        const endDate = new Date(now);
        endDate.setFullYear(now.getFullYear() + 10);

        await this.subscriptionRepository.save(
            this.subscriptionRepository.create({
                vendorId,
                planId: freePlan.id,
                status: SubscriptionStatus.ACTIVE,
                startDate: now,
                endDate,
                amount: 0,
                autoRenew: false,
            }),
        );
    }

    /** Unified signup: any user can list a business — provision vendor profile on first listing. */
    private async ensureVendorForUser(user: User): Promise<Vendor> {
        let vendor = await this.vendorRepository.findOne({
            where: { userId: user.id },
            relations: ['subscriptions'],
        });

        if (vendor) return vendor;

        vendor = await this.vendorRepository.save(
            this.vendorRepository.create({
                userId: user.id,
                businessName: `${user.fullName}'s Business`,
                businessPhone: user.phone,
                isVerified: false,
            }),
        );

        await this.assignFreePlanToVendor(vendor.id);

        if (user.role === UserRole.USER) {
            await this.userRepository.update(user.id, { role: UserRole.VENDOR });
            user.role = UserRole.VENDOR;
        }

        if (user.pendingReferralCode) {
            try {
                await this.affiliateService.applyReferralCode(user.id, user.pendingReferralCode);
                await this.userRepository.update(user.id, { pendingReferralCode: null });
            } catch (err: any) {
                // Non-blocking — invalid/expired referral should not block listing
                console.warn(`[BusinessesService] Referral apply skipped: ${err.message}`);
            }
        }

        return vendor;
    }

    private async resolvePlanFeatures(vendorId: string, user?: User) {
        if (user && [UserRole.ADMIN, UserRole.SUPERADMIN].includes(user.role as UserRole)) {
            return {
                maxKeywords: 999,
                maxFaqs: 999,
                canCreateAlbums: true,
                maxSubCategories: 999,
                maxListings: 999,
            };
        }

        const [activeSub, activeNewPlan] = await Promise.all([
            this.subscriptionRepository.findOne({
                where: { vendorId, status: SubscriptionStatus.ACTIVE, endDate: MoreThan(new Date()) },
                relations: ['plan'],
            }),
            this.activePlanRepository.findOne({
                where: { vendorId, status: ActivePlanStatus.ACTIVE, endDate: MoreThan(new Date()) },
                relations: ['plan'],
            }),
        ]);

        const legacy = activeSub?.plan?.dashboardFeatures || {};
        const modern = (activeNewPlan?.plan?.features as Record<string, unknown>) || {};
        return { ...legacy, ...modern };
    }

    private enforcePremiumContentLimits(
        dto: { metaKeywords?: string; searchKeywords?: string[]; faqs?: { question: string; answer: string }[] },
        features: Record<string, unknown>,
    ) {
        const maxKeywords = Number(features.maxKeywords ?? 0);
        const maxFaqs = Number(features.maxFaqs ?? 0);

        if (dto.metaKeywords) {
            const keywordCount = dto.metaKeywords
                .split(',')
                .map((k) => k.trim())
                .filter(Boolean).length;
            if (keywordCount > maxKeywords) {
                throw new BadRequestException(
                    `Your plan allows up to ${maxKeywords} keywords. Please upgrade to add more.`,
                );
            }
        }

        if (dto.searchKeywords) {
            if (dto.searchKeywords.length > maxKeywords) {
                throw new BadRequestException(
                    `Your plan allows up to ${maxKeywords} search keywords. Please upgrade to add more.`,
                );
            }
        }

        if (dto.faqs?.length && dto.faqs.length > maxFaqs) {
            throw new BadRequestException(
                `Your plan allows up to ${maxFaqs} FAQs. Please upgrade to add more.`,
            );
        }
    }

    private enforceLegalConsent(dto: { legalConsentAccepted?: boolean }) {
        if (!dto.legalConsentAccepted) {
            throw new BadRequestException(
                'You must accept the Terms & Conditions and Privacy Policy before creating a listing.',
            );
        }
    }

    private async assertCanManageAlbums(vendorId: string, user: User) {
        const features = await this.resolvePlanFeatures(vendorId, user);
        if (!features.canCreateAlbums) {
            throw new ForbiddenException('Photo albums are available on paid plans only. Please upgrade your subscription.');
        }
    }
    private isPostgisAvailable = false;

    async onModuleInit() {
        // Check PostGIS availability
        try {
            const res = await this.listingRepository.query("SELECT 1 FROM pg_extension WHERE extname = 'postgis'");
            this.isPostgisAvailable = res.length > 0;
            console.log(`[BusinessesService] PostGIS availability checked: ${this.isPostgisAvailable}`);
        } catch (e) {
            this.isPostgisAvailable = false;
        }

        // Backfill logic for recent_until and performance indexes
        try {
            const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;
            // Native query is faster for schema updates
            await this.listingRepository.query(`
                CREATE EXTENSION IF NOT EXISTS cube;
                CREATE EXTENSION IF NOT EXISTS earthdistance;

                ALTER TABLE businesses ADD COLUMN IF NOT EXISTS recent_until TIMESTAMP NULL;
                UPDATE businesses 
                SET recent_until = created_at + INTERVAL '7 days' 
                WHERE recent_until IS NULL;
                
                -- Performance Indexes
                CREATE INDEX IF NOT EXISTS idx_recent_until ON businesses(recent_until);
                CREATE INDEX IF NOT EXISTS idx_businesses_city ON businesses(city);
                CREATE INDEX IF NOT EXISTS idx_businesses_status ON businesses(status);
                CREATE INDEX IF NOT EXISTS idx_businesses_featured ON businesses(is_featured) WHERE is_featured = true;
                CREATE INDEX IF NOT EXISTS idx_businesses_sponsored ON businesses(is_sponsored) WHERE is_sponsored = true;
                CREATE INDEX IF NOT EXISTS idx_businesses_price_range ON businesses(price_range);
                CREATE INDEX IF NOT EXISTS idx_businesses_category_id ON businesses(category_id);
                
                -- Ensure vendors table has missing columns and indexes
                ALTER TABLE vendors ADD COLUMN IF NOT EXISTS city VARCHAR(100) NULL;
                ALTER TABLE vendors ADD COLUMN IF NOT EXISTS state VARCHAR(100) NULL;
                ALTER TABLE vendors ADD COLUMN IF NOT EXISTS country VARCHAR(100) DEFAULT 'Pakistan';
                ALTER TABLE vendors ADD COLUMN IF NOT EXISTS slug VARCHAR(255) NULL;
                CREATE INDEX IF NOT EXISTS idx_vendors_city ON vendors(city);
                CREATE INDEX IF NOT EXISTS idx_vendors_slug ON vendors(slug);
                
                -- Support multiple sub-categories
                CREATE TABLE IF NOT EXISTS business_subcategories (
                    business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
                    category_id uuid NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
                    PRIMARY KEY (business_id, category_id)
                );
                CREATE INDEX IF NOT EXISTS idx_business_subcategories_category ON business_subcategories(category_id);
                ALTER TABLE businesses ADD COLUMN IF NOT EXISTS albums JSONB DEFAULT '[]';
                ALTER TABLE users ADD COLUMN IF NOT EXISTS pending_referral_code VARCHAR(32) NULL;
            `);
            console.log('[BusinessesService] Database performance indexes auto-sync completed.');
        } catch (error) {
            console.error('[BusinessesService] Database optimization failed:', error);
        }
    }

    /**
     * Create a new listing
     */
    async create(
        createBusinessDto: CreateBusinessDto,
        user: User,
        context?: { ipAddress?: string; sessionId?: string; deviceId?: string },
    ): Promise<Listing> {
        await this.validatePostalForCountry(createBusinessDto.country, createBusinessDto.pincode);
        this.enforceLegalConsent(createBusinessDto);

        // Find or create vendor profile (unified account — regular users can list a business)
        let vendor = await this.vendorRepository.findOne({
            where: { userId: user.id },
            relations: ['subscriptions'],
        });

        if (!vendor) {
            if ([UserRole.ADMIN, UserRole.SUPERADMIN].includes(user.role as UserRole)) {
                vendor = await this.vendorRepository.save(
                    this.vendorRepository.create({
                        userId: user.id,
                        businessName: `${user.fullName}'s Business`,
                        businessPhone: user.phone,
                        isVerified: true,
                    }),
                );
            } else {
                vendor = await this.ensureVendorForUser(user);
            }
        }

        // Verify category exists or handle suggestion
        let category = null;
        if (createBusinessDto.categoryId) {
            category = await this.categoryRepository.findOne({
                where: { id: createBusinessDto.categoryId },
            });

            if (!category) {
                throw new NotFoundException('Category not found');
            }

            if (category.status !== CategoryStatus.ACTIVE) {
                throw new BadRequestException('Invalid category: selected category is disabled');
            }
        } else if (!createBusinessDto.suggestedCategoryName) {
            throw new BadRequestException('Either categoryId or suggestedCategoryName must be provided');
        }

        // Generate unique slug
        const slug = generateUniqueSlug(createBusinessDto.title);

        // Sanitize offerExpiresAt to prevent invalid date errors
        let sanitizedExpiresAt = createBusinessDto.offerExpiresAt;
        if (
            sanitizedExpiresAt === '' || 
            sanitizedExpiresAt === null || 
            (typeof sanitizedExpiresAt === 'string' && (sanitizedExpiresAt.includes('NaN') || sanitizedExpiresAt.includes('Invalid')))
        ) {
            sanitizedExpiresAt = null as any;
        }

        // NEW: Check for ANY active featured/boosted plan (Unified Subscription Engine)
        const [activeSub, activeNewPlan, referralPlan] = await Promise.all([
            this.subscriptionRepository.findOne({
                where: { vendorId: vendor.id, status: SubscriptionStatus.ACTIVE, endDate: MoreThan(new Date()) },
                relations: ['plan']
            }),
            this.activePlanRepository.findOne({
                where: { vendorId: vendor.id, status: ActivePlanStatus.ACTIVE, endDate: MoreThan(new Date()) },
                relations: ['plan']
            }),
            // Check if their vendor profile is verified or they have an active referral plan
            this.activePlanRepository.findOne({
                where: [
                    { vendorId: vendor.id, status: ActivePlanStatus.ACTIVE, transactionId: Like('%REFERRAL%') },
                    { vendorId: vendor.id, status: ActivePlanStatus.ACTIVE, transactionId: 'MANUAL_REWARD_REPAIR' }
                ]
            })
        ]);
        
        // --- Limit Enforcement ---
        // Get limits from features. Priority: ActivePlan (New Engine) -> Subscription (Old Engine) -> Default (Free: 1)
        const planFeatures = (activeNewPlan?.plan?.features as any) || activeSub?.plan?.dashboardFeatures || { maxListings: 1, maxSubCategories: 0 };
        const maxListings = planFeatures.maxListings || 1;
        const maxSubCategories = planFeatures.maxSubCategories || 0;
        
        // Count existing listings
        const existingCount = await this.listingRepository.count({
            where: { vendorId: vendor.id }
        });
        
        if (existingCount >= maxListings && ![UserRole.ADMIN, UserRole.SUPERADMIN].includes(user.role as UserRole)) {
            throw new BadRequestException(`Business listing limit reached (${maxListings}). Please upgrade your plan to add more businesses.`);
        }

        // Check subcategory limits
        if (createBusinessDto.subCategoryIds?.length) {
            if (createBusinessDto.subCategoryIds.length > maxSubCategories && ![UserRole.ADMIN, UserRole.SUPERADMIN].includes(user.role as UserRole)) {
                throw new BadRequestException(`Your current plan allows a maximum of ${maxSubCategories} sub-categories. Please upgrade to add more.`);
            }
        }

        this.enforcePremiumContentLimits(createBusinessDto, planFeatures);
        
        // Image limit check bypassed to allow free tier saving premium features
        // -------------------------

        const hasFeaturedSub = (activeSub?.plan?.isFeatured) || ((activeNewPlan?.plan?.features as any)?.isFeatured);
        const hasBoostedSub = !!referralPlan || ((activeNewPlan?.plan?.features as any)?.top_ranking);

        // Auto-approve new listings — no manual admin queue
        const now = new Date();
        const listing = this.listingRepository.create({
            ...createBusinessDto,
            offerExpiresAt: sanitizedExpiresAt,
            vendorId: vendor.id,
            slug,
            status: BusinessStatus.APPROVED,
            isVerified: false,
            isFeatured: hasFeaturedSub || !!referralPlan,
            isSponsored: hasBoostedSub,
            approvedAt: now,
            recentUntil: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), // 7 days recent window
            location: createBusinessDto.latitude && createBusinessDto.longitude ? `POINT(${createBusinessDto.longitude} ${createBusinessDto.latitude})` : null,
            subcategories: createBusinessDto.subCategoryIds?.length ? createBusinessDto.subCategoryIds.map(id => ({ id } as any)) : [],
        });

        const savedListing = await this.listingRepository.save(listing);

        // If coordinates are missing, enqueue for geocoding
        if ((!savedListing.latitude || !savedListing.longitude) && savedListing.address) {
            await this.geocodingQueueService.enqueue({
                listingId: savedListing.id,
                address: savedListing.address,
                city: savedListing.city,
                country: savedListing.country,
            }).catch(err => console.error('Geocoding enqueue error:', err));
        }

        // Create business hours if provided
        if (createBusinessDto.businessHours?.length) {
            const hours = createBusinessDto.businessHours.map((hour) =>
                this.businessHoursRepository.create({
                    businessId: savedListing.id,
                    ...hour,
                }),
            );
            await this.businessHoursRepository.save(hours);
        }

        // Create business amenities if provided
        if (createBusinessDto.amenityIds?.length) {
            const amenities = createBusinessDto.amenityIds.map((amenityId) =>
                this.businessAmenityRepository.create({
                    businessId: savedListing.id,
                    amenityId,
                }),
            );
            await this.businessAmenityRepository.save(amenities);
        }

        // Return fully populated listing
        const result = await this.findOne(savedListing.id, user);

        // Notify Admin if there's a suggested category
        if (createBusinessDto.suggestedCategoryName) {
            this.notificationsService.notifyAdmin({
                title: '🆕 New Category Suggestion',
                message: `Vendor "${vendor.businessName}" suggested a new category: "${createBusinessDto.suggestedCategoryName}" for their listing "${result.title}".`,
                type: NotificationType.SYSTEM_UPDATE,
                data: { businessId: result.id, suggestedCategory: createBusinessDto.suggestedCategoryName },
            }).catch(() => {/* non-blocking */ });
        }

        // Index in Elasticsearch (async, don't wait to complete to return response)
        this.searchService.indexBusiness(result).catch(err => console.error('ES Index Error:', err));

        // Queue cache invalidation
        this.searchCacheInvalidationQueue.add('invalidate', { 
            city: result.city, 
            categorySlug: result.category?.slug 
        }).catch(err => console.error('Cache invalidation queue error:', err));

        return result;
    }

    /**
     * Search businesses with filters and geo-location
     */
    async search(searchDto: SearchBusinessDto) {
        const {
            page = 1,
            limit = 20,
            latitude,
            longitude,
            radius,
            city,
            categoryId,
            categorySlug,
            minRating,
            priceRange,
            featuredOnly,
            verifiedOnly,
            openNow,
            sortBy,
            userId,
            filter,
        } = searchDto;
        const skip = calculateSkip(page, limit);

        // Quick Filters
        const isFeaturedFilter = filter === 'featured' || featuredOnly;
        const isNewFilter = filter === 'new';

        // Async Search Logging - Log any significant search intent
        if (searchDto.query || city || categorySlug || categoryId || (latitude && longitude)) {
            this.demandService.logSearch({
                keyword: searchDto.query || categorySlug || '',
                city: city || searchDto.city,
                categorySlug: categorySlug as string,
                latitude,
                longitude,
                userId,
            }).catch(err => console.error('[BusinessesService] Analytics log error:', err));
        }

        // Elasticsearch Integration: Get IDs for high-relevance results
        let esIds: string[] | null = null;
        if (searchDto.query && this.searchService.isAvailable()) {
            try {
                esIds = await this.searchService.searchIds(
                    searchDto.query,
                    searchDto.city,
                    searchDto.categorySlug,
                    100, // Fetch top 100 for filtering
                );
            } catch (err) {
                console.error('[BusinessesService] Elasticsearch search error:', err);
            }
        }

        const queryBuilder = this.listingRepository
            .createQueryBuilder('listing')
            .leftJoinAndSelect('listing.category', 'category')
            .leftJoinAndSelect('listing.vendor', 'vendor')
            .leftJoinAndSelect('vendor.user', 'user')
            .leftJoinAndSelect('listing.businessHours', 'businessHours')
            .leftJoinAndSelect('listing.businessAmenities', 'businessAmenities')
            .leftJoinAndSelect('businessAmenities.amenity', 'amenity')
            .where('listing.status = :status', { status: BusinessStatus.APPROVED })
            .andWhere('user.deletion_scheduled_at IS NULL');

        // Apply Search Results from Elasticsearch or fallback to ILIKE
        if (esIds && esIds.length > 0) {
            queryBuilder.andWhere('listing.id IN (:...esIds)', { esIds });
            // If relevance sorting requested, use ES order
            if (sortBy === SearchSortBy.RELEVANCE) {
                // Ensure IDs are properly quoted for the SQL array
                const quotedIds = esIds.map(id => `'${id}'`).join(',');
                queryBuilder.orderBy(`array_position(ARRAY[${quotedIds}]::uuid[], listing.id)`, 'ASC');
            }
        } else if (searchDto.query) {
            // Text search fallback — matches title, description and vendor/admin-added search keywords
            const searchTerms = searchDto.query.toLowerCase().split(' ').filter(term => term.length > 0);
            queryBuilder.andWhere(new Brackets((qb) => {
                for (let i = 0; i < searchTerms.length; i++) {
                    const term = searchTerms[i];
                    qb.andWhere(
                        new Brackets((innerQb) => {
                            innerQb.where(`"listing"."name" ILIKE :term${i}`)
                                .orWhere(`"listing"."description" ILIKE :term${i}`)
                                .orWhere(`"listing"."meta_keywords" ILIKE :term${i}`)
                                .orWhere(`"listing"."search_keywords"::text ILIKE :term${i}`)
                                .orWhere(`"vendor"."business_name" ILIKE :term${i}`);
                        }),
                        { [`term${i}`]: `%${term}%` }
                    );
                }
            }));
        }

        // Category filter
        if (searchDto.categoryId) {
            queryBuilder.andWhere('category.id = :categoryId', {
                categoryId: searchDto.categoryId,
            });
        }

        if (searchDto.categorySlug) {
            queryBuilder.andWhere('category.slug = :categorySlug', {
                categorySlug: searchDto.categorySlug,
            });
        }

        // City filter
        if (city) {
            queryBuilder.andWhere('listing.city ILIKE :city', {
                city: `%${city}%`,
            });
        }

        // Rating filter
        if (minRating) {
            queryBuilder.andWhere('listing.averageRating >= :minRating', {
                minRating,
            });
        }

        // Price range filter
        if (priceRange) {
            queryBuilder.andWhere('listing.priceRange = :priceRange', {
                priceRange,
            });
        }

        // Featured only
        if (isFeaturedFilter) {
            queryBuilder.andWhere('listing.isFeatured = :featured', { featured: true });
        }
        if (isNewFilter) {
            const now = new Date();
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            
            // Priority: recentUntil > NOW() OR (recentUntil IS NULL AND createdAt >= 7 days ago)
            queryBuilder.andWhere(new Brackets((qb) => {
                qb.where('listing.recentUntil > :now', { now })
                  .orWhere(new Brackets((inner) => {
                      inner.where('listing.recentUntil IS NULL')
                           .andWhere('listing.createdAt >= :sevenDaysAgo', { sevenDaysAgo });
                  }));
            }));
        }
        if (verifiedOnly) {
            queryBuilder.andWhere('listing.isVerified = :verified', { verified: true });
        }

        // Distance Filter & Selection using PostGIS or earthdistance fallback
        if (latitude && longitude) {
            if (this.isPostgisAvailable) {
                queryBuilder.addSelect(
                    `ST_Distance(listing.location, ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography)`,
                    'distance_meters'
                );
                if (radius) {
                    const radiusMeters = radius * 1000;
                    queryBuilder.andWhere(
                        `ST_DWithin(listing.location, ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography, :radiusMeters)`,
                        { radiusMeters }
                    );
                }
            } else {
                queryBuilder.addSelect(
                    `earth_distance(ll_to_earth(listing.latitude, listing.longitude), ll_to_earth(:lat, :lng))`,
                    'distance_meters'
                );
                queryBuilder.andWhere('listing.latitude IS NOT NULL AND listing.longitude IS NOT NULL');
                if (radius) {
                    const radiusMeters = radius * 1000;
                    queryBuilder.andWhere(
                        `earth_distance(ll_to_earth(listing.latitude, listing.longitude), ll_to_earth(:lat, :lng)) <= :radiusMeters`,
                        { radiusMeters }
                    );
                }
            }
            queryBuilder.setParameter('lat', latitude);
            queryBuilder.setParameter('lng', longitude);
        }

        // Advanced Filters
        if (searchDto.onlineNow) {
            queryBuilder.andWhere('user.isOnline = :isOnline', { isOnline: true });
        }

        if (searchDto.fastResponse) {
            // "Fast Response" = Vendors who have replied to broadcast job leads
            // If No response yet, we fallback to businesses with totalLeads > 0 as a loose indicator
            queryBuilder.andWhere(new Brackets(qb => {
                qb.where(sq => {
                    const subQuery = sq.subQuery()
                        .select('1')
                        .from('job_lead_responses', 'jlr')
                        .where('jlr.vendor_id = vendor.id')
                        .getQuery();
                    return `EXISTS ${subQuery}`;
                })
                .orWhere('listing.totalLeads > 0');
            }));
        }

        if (searchDto.experience) {
            // "Experienced" listings are those that have been on the platform for at least 1 week
            const oneWeekAgo = new Date();
            oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
            queryBuilder.andWhere('listing.createdAt <= :oneWeekAgo', { oneWeekAgo });
        }

        if (searchDto.mostContacted) {
            // "Most Contacted" = Businesses with active work chats (conversations) 
            // Fallback to high totalViews if no conversation data exists in Railway yet
            queryBuilder.andWhere(new Brackets(qb => {
                qb.where(sq => {
                    const subQuery = sq.subQuery()
                        .select('1')
                        .from('chat_conversations', 'cc')
                        .where('cc.business_id = listing.id')
                        .getQuery();
                    return `EXISTS ${subQuery}`;
                })
                .orWhere('listing.totalViews > 5'); // Relaxed threshold for visibility
            }));
            // Sort by leads and views
            queryBuilder.addOrderBy('listing.totalLeads', 'DESC');
            queryBuilder.addOrderBy('listing.totalViews', 'DESC');
        }

        // Open Now filter
        if (openNow) {
            const now = new Date();
            const day = now
                .toLocaleDateString('en-US', { weekday: 'long' })
                .toLowerCase();
            const time = now.toLocaleTimeString('en-US', {
                hour12: false,
                hour: '2-digit',
                minute: '2-digit',
            });

            // Using existing 'businessHours' join from line 302
            queryBuilder
                .andWhere('businessHours.dayOfWeek = :day', { day })
                .andWhere('businessHours.isOpen = :isOpen', { isOpen: true })
                .andWhere(':time BETWEEN businessHours.openTime AND businessHours.closeTime', {
                    time,
                });
        }

        // Sorting
        // 1) Keyword boost: if the query matches a vendor's metaKeywords, rank that listing first
        if (searchDto.query) {
            queryBuilder.addSelect(
                'CASE WHEN "listing"."search_keywords"::text ILIKE :queryBoost THEN 0 WHEN "listing"."meta_keywords" ILIKE :queryBoost THEN 1 ELSE 2 END',
                'boost',
            );
            queryBuilder.setParameter('queryBoost', `%${searchDto.query}%`);
            queryBuilder.addOrderBy('boost', 'ASC');
        }

        // 2) Secondary sort (user-selected or default relevance)
        if (filter === 'new' || (sortBy as any) === 'newest' || sortBy === SearchSortBy.NEWEST) {
            // For "New" sort, we prioritize createdAt above all else (after query boost if present)
            queryBuilder
                .addOrderBy('listing.createdAt', 'DESC')
                .addOrderBy('listing.isSponsored', 'DESC')
                .addOrderBy('listing.isFeatured', 'DESC')
                .addOrderBy('listing.averageRating', 'DESC');
        } else {
            switch (sortBy) {
                case SearchSortBy.DISTANCE:
                    if (latitude && longitude) {
                        queryBuilder.addOrderBy('distance_meters', 'ASC');
                    }
                    break;
                case SearchSortBy.RATING:
                    queryBuilder.addOrderBy('listing.averageRating', 'DESC');
                    break;
                default:
                    // Relevance (sponsored > featured > newest > rating)
                    queryBuilder
                        .addOrderBy('listing.isSponsored', 'DESC')
                        .addOrderBy('listing.isFeatured', 'DESC')
                        .addOrderBy('listing.createdAt', 'DESC')
                        .addOrderBy('listing.averageRating', 'DESC');
            }
        }

        try {
            // Get total count
            const total = await queryBuilder.getCount();

            // Get paginated results
            const listings = await queryBuilder.skip(skip).take(limit).getRawAndEntities();

            // Map and format results
            const results = listings.entities.map((entity) => {
                // Find matching raw record to get the custom selected distance_meters value
                const raw = listings.raw.find(r => r.listing_id === entity.id);
                const distanceMeters = raw ? parseFloat(raw.distance_meters) : undefined;
                
                const result: any = {
                    ...entity,
                    distance: distanceMeters !== undefined && !isNaN(distanceMeters) ? Number((distanceMeters / 1000).toFixed(2)) : undefined,
                };
                if (result.vendor && result.vendor.user) {
                    result.vendor.isOnline = result.vendor.user.isOnline || false;
                }
                return result;
            });

            return createPaginatedResponse(results, page, limit, total);
        } catch (error: any) {
            const fs = require('fs');
            const path = require('path');
            fs.appendFileSync(path.join(process.cwd(), 'permanent_error_log.txt'), `[Search ERROR] ${new Date().toISOString()}: ${error.message}\nStack: ${error.stack}\nDetails: ${JSON.stringify(error)}\n\n`);
            throw error;
        }
    }

    /**
     * Get listing by ID
     */
    async findOne(id: string, user?: User): Promise<Listing> {
        const listing = await this.listingRepository.findOne({
            where: { id },
            relations: [
                'category',
                'vendor',
                'vendor.user',
                'businessHours',
                'businessAmenities',
                'businessAmenities.amenity',
                'reviews',
                'reviews.user',
            ],
        });

        if (!listing) {
            throw new NotFoundException('Listing not found');
        }

        // Only allow public viewing of APPROVED listings
        // Owners and Admins can view regardless of status
        if (listing.status !== BusinessStatus.APPROVED) {
            const isOwner = user && listing.vendor && listing.vendor.userId === user.id;
            const isAdmin = user && (user.role === UserRole.ADMIN || user.role === UserRole.SUPERADMIN);

            if (!isOwner && !isAdmin) {
                throw new NotFoundException('Listing not found');
            }
        }

        // Only count views from non-owners (skip vendor self-views)
        const isOwnerView = user && listing.vendor?.user?.id === user.id;
        if (!isOwnerView) {
            await this.listingRepository.increment({ id }, 'totalViews', 1);
            listing.totalViews = (listing.totalViews || 0) + 1;
        }

        if (listing.vendor && listing.vendor.user) {
            (listing.vendor as any).isOnline = listing.vendor.user.isOnline || false;
        }

        return listing;
    }

    /**
     * Get listing by slug
     */
    async findBySlug(slug: string, user?: User): Promise<Listing> {
        const log = (msg: string) => {
            const fs = require('fs');
            const path = require('path');
            const logFile = path.join(process.cwd(), 'debug_logs.txt');
            fs.appendFileSync(logFile, `[${new Date().toISOString()}] ${msg}\n`);
        };

        log(`findBySlug: ${slug} (User: ${user?.email || 'Public'})`);

        try {
            const listing = await this.listingRepository.findOne({
                where: { slug },
                relations: [
                    'category',
                    'vendor',
                    'vendor.user',
                    'businessHours',
                    'businessAmenities',
                    'businessAmenities.amenity',
                    'reviews',
                    'reviews.user',
                ],
            });

            if (!listing) {
                log(`findBySlug: ${slug} - NOT FOUND IN DB`);
                throw new NotFoundException('Listing not found');
            }

            log(`findBySlug: ${slug} - Found in DB. Status: ${listing.status}`);

            const isPubliclyVisible = listing.status === BusinessStatus.APPROVED;
            if (!isPubliclyVisible) {
                const isOwner = user && listing.vendor && listing.vendor.userId === user.id;
                const isAdmin = user && (user.role === UserRole.ADMIN || user.role === UserRole.SUPERADMIN);

                if (!isOwner && !isAdmin) {
                    log(`findBySlug: ${slug} - HIDDEN (Status: ${listing.status}, IsOwner: ${!!isOwner}, IsAdmin: ${!!isAdmin})`);
                    throw new NotFoundException('Listing not found');
                }
            }

            // Only count views from non-owners
            const isOwner = user && listing.vendor?.user?.id === user.id;
            if (!isOwner) {
                await this.listingRepository.increment({ id: listing.id }, 'totalViews', 1);
                listing.totalViews = (listing.totalViews || 0) + 1;
            }

            if (listing.vendor && listing.vendor.user) {
                (listing.vendor as any).isOnline = listing.vendor.user.isOnline || false;
            }

            log(`findBySlug: ${slug} - SUCCESS`);
            return listing;
        } catch (error: any) {
            log(`findBySlug: ${slug} - ERROR: ${error.message}\n${error.stack}`);
            throw error;
        }
    }

    /**
     * Update listing
     */
    async update(
        id: string,
        updateBusinessDto: UpdateBusinessDto,
        user: User,
    ): Promise<Listing> {
        const log = (msg: string) => {
            const fs = require('fs');
            const path = require('path');
            const logFile = path.join(process.cwd(), 'debug_logs.txt');
            fs.appendFileSync(logFile, `[${new Date().toISOString()}] UPDATE BUSINESS ${id}: ${msg}\n`);
        };

        const listing = await this.listingRepository.findOne({
            where: { id },
            relations: ['vendor'],
        });

        if (!listing) {
            throw new NotFoundException('Listing not found');
        }

        log(`Current User: ${user.id}, Owner: ${listing.vendor.userId}`);

        // Only owner or admin can update
        if (listing.vendor.userId !== user.id && user.role !== UserRole.ADMIN && user.role !== UserRole.SUPERADMIN) {
            throw new ForbiddenException('You do not have permission to update this listing');
        }

        const countryForPostal = updateBusinessDto.country ?? listing.country;
        const pincodeForPostal = updateBusinessDto.pincode !== undefined ? updateBusinessDto.pincode : listing.pincode;
        if (updateBusinessDto.pincode !== undefined || updateBusinessDto.country !== undefined) {
            await this.validatePostalForCountry(countryForPostal, pincodeForPostal);
        }

        if (updateBusinessDto.subCategoryIds !== undefined) {
            const [activeSub, activeNewPlan] = await Promise.all([
                this.subscriptionRepository.findOne({
                    where: { vendorId: listing.vendor.id, status: SubscriptionStatus.ACTIVE, endDate: MoreThan(new Date()) },
                    relations: ['plan']
                }),
                this.activePlanRepository.findOne({
                    where: { vendorId: listing.vendor.id, status: ActivePlanStatus.ACTIVE, endDate: MoreThan(new Date()) },
                    relations: ['plan']
                })
            ]);
            
            const planFeatures = (activeNewPlan?.plan?.features as any) || activeSub?.plan?.dashboardFeatures || { maxSubCategories: 0 };
            const maxSubCategories = planFeatures.maxSubCategories || 0;

            if (updateBusinessDto.subCategoryIds.length > maxSubCategories && ![UserRole.ADMIN, UserRole.SUPERADMIN].includes(user.role as UserRole)) {
                throw new BadRequestException(`Your current plan allows a maximum of ${maxSubCategories} sub-categories. Please upgrade to add more.`);
            }

            listing.subcategories = updateBusinessDto.subCategoryIds.map(id => ({ id } as any));
        }

        const planFeatures = await this.resolvePlanFeatures(listing.vendor.id, user);
        this.enforcePremiumContentLimits(updateBusinessDto, planFeatures);

        if (updateBusinessDto.amenityIds) {
            log(`Amenity IDs count: ${updateBusinessDto.amenityIds.length}`);
        }

        // --- Image Limit Enforcement for Update ---
        // Image limit check bypassed to allow free tier saving premium features
        // -------------------------

        const oldSlug = listing.slug;

        // Map basic fields
        if (updateBusinessDto.title && updateBusinessDto.title !== listing.title) {
            listing.title = updateBusinessDto.title;
            listing.slug = generateUniqueSlug(updateBusinessDto.title);
            log(`Title changed to: ${listing.title}, Slug to: ${listing.slug}`);
        }

        if (updateBusinessDto.categoryId && updateBusinessDto.categoryId !== listing.categoryId) {
            listing.categoryId = updateBusinessDto.categoryId;
        }

        // Update basic text fields
        const textFields = [
            'description', 'shortDescription', 'email', 'phone', 'whatsapp',
            'website', 'address', 'addressLine2', 'city', 'state', 'pincode', 'latitude', 'longitude',
            'logoUrl', 'coverImageUrl', 'images', 'metaTitle', 'metaDescription',
            'metaKeywords', 'hasOffer', 'offerTitle', 'offerDescription', 'offerBadge',
            'offerExpiresAt', 'offerBannerUrl', 'faqs'
        ];

        textFields.forEach(field => {
            if (updateBusinessDto[field] !== undefined) {
                listing[field] = updateBusinessDto[field];
            }
        });

        // Update amenities if provided
        if (updateBusinessDto.amenityIds) {
            log('Updating amenities joins...');
            await this.businessAmenityRepository.delete({ businessId: id });
            
            if (updateBusinessDto.amenityIds.length > 0) {
                const amenities = updateBusinessDto.amenityIds.map((amenityId) =>
                    this.businessAmenityRepository.create({
                        businessId: id,
                        amenityId,
                    }),
                );
                await this.businessAmenityRepository.save(amenities);
                log(`Saved ${amenities.length} amenity records`);
            } else {
                log('Cleared all amenities (empty array received)');
            }
        }

        // Handle Business Hours
        if (updateBusinessDto.businessHours) {
            log('Updating business hours...');
            await this.businessHoursRepository.delete({ businessId: id });
            const hours = updateBusinessDto.businessHours.map((hour) =>
                this.businessHoursRepository.create({
                    businessId: id,
                    ...hour,
                }),
            );
            await this.businessHoursRepository.save(hours);
        }

        // Remove nested objects from update
        const { businessHours: _, amenityIds: __, subCategoryIds: ___, ...updateData } = updateBusinessDto;

        // Sanitize offerExpiresAt to prevent invalid date errors
        if (
            updateData.offerExpiresAt === '' || 
            updateData.offerExpiresAt === null || 
            (typeof updateData.offerExpiresAt === 'string' && (updateData.offerExpiresAt.includes('NaN') || updateData.offerExpiresAt.includes('Invalid')))
        ) {
            updateData.offerExpiresAt = null as any;
        }

        // Apply updates to the listing object
        Object.assign(listing, updateData);

        if (listing.latitude && listing.longitude) {
            listing.location = `POINT(${listing.longitude} ${listing.latitude})`;
        } else {
            listing.location = null as any;
        }

        await this.listingRepository.save(listing);
        log('Listing saved to database');

        // Invalidate cache via BullMQ worker
        if (listing.city) {
            this.searchCacheInvalidationQueue.add('invalidate', {
                city: listing.city,
                categorySlug: listing.category?.slug,
            }).catch(err => console.error('Cache invalidation queue error:', err));
        }

        if ((!listing.latitude || !listing.longitude) && listing.address) {
            await this.geocodingQueueService.enqueue({
                listingId: listing.id,
                address: listing.address,
                city: listing.city,
                country: listing.country,
            }).catch(err => console.error('Geocoding enqueue error:', err));
        }

        const updatedListing = await this.findOne(id, user);

        // Update in Elasticsearch
        this.searchService.indexBusiness(updatedListing).catch(err => console.error('ES Update Error:', err));

        return updatedListing;
    }

    /**
     * Delete listing
     */
    async remove(id: string, user: User): Promise<void> {
        const listing = await this.listingRepository.findOne({
            where: { id },
            relations: ['vendor'],
        });

        if (!listing) {
            throw new NotFoundException('Listing not found');
        }

        // Check ownership - Reinforcing filtering as requested
        if (listing.vendor.userId !== user.id && user.role !== UserRole.ADMIN) {
            throw new ForbiddenException('Unauthorized access');
        }

        await this.listingRepository.remove(listing);

        // Remove from Elasticsearch
        this.searchService.remove(id).catch(err => console.error('ES Remove Error:', err));

        // Queue cache invalidation
        if (listing.city) {
            this.searchCacheInvalidationQueue.add('invalidate', {
                city: listing.city,
                categorySlug: listing.category?.slug,
            }).catch(err => console.error('Cache invalidation queue error:', err));
        }
    }

    /**
     * Get vendor's listings
     */
    async getVendorBusinesses(userId: string, page = 1, limit = 20) {
        const vendor = await this.vendorRepository.findOne({
            where: { userId },
        });

        if (!vendor) {
            throw new NotFoundException('Vendor not found');
        }

        const skip = calculateSkip(page, limit);

        const [listings, total] = await this.listingRepository.findAndCount({
            where: { vendorId: vendor.id },
            relations: [
                'category',
                'businessHours',
                'businessAmenities',
                'businessAmenities.amenity'
            ],
            order: { createdAt: 'DESC' },
            skip,
            take: limit,
        });

        return createPaginatedResponse(listings, page, limit, total);
    }

    /**
     * Get similar listings (same category)
     */
    async getSimilar(idOrSlug: string, limit = 4): Promise<Listing[]> {
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);

        let listing;

        if (isUuid) {
            listing = await this.listingRepository.findOne({
                where: { id: idOrSlug },
                select: ['id', 'categoryId'],
            });
        } else {
            listing = await this.listingRepository.findOne({
                where: { slug: idOrSlug },
                select: ['id', 'categoryId'],
            });
        }

        if (!listing) {
            throw new NotFoundException('Listing not found');
        }

        return this.listingRepository.find({
            where: {
                categoryId: listing.categoryId,
                id: Not(listing.id), // Exclude current listing
                status: BusinessStatus.APPROVED,
            },
            take: Number(limit),
        });
    }

    /**
     * Update listing image URL
     */
    async updateImage(id: string, imageUrl: string, user: User): Promise<Listing> {
        const listing = await this.listingRepository.findOne({
            where: { id },
            relations: ['vendor'],
        });

        if (!listing) {
            throw new NotFoundException('Listing not found');
        }

        // Check ownership
        if (listing.vendor.userId !== user.id && user.role !== UserRole.ADMIN) {
            throw new ForbiddenException('Unauthorized access');
        }

        listing.coverImageUrl = imageUrl;
        await this.listingRepository.save(listing);

        return this.findOne(id);
    }

    /**
     * Get all available amenities
     */
    async getAllAmenities(): Promise<Amenity[]> {
        return this.amenityRepository.find({
            order: { name: 'ASC' },
        });
    }

    /**
     * Create a new amenity
     */
    async createAmenity(name: string, icon?: string): Promise<Amenity> {
        const existing = await this.amenityRepository.findOne({
            where: { name },
        });

        if (existing) {
            return existing;
        }

        const amenity = this.amenityRepository.create({
            name,
            icon: icon || 'Sparkles',
        });

        return this.amenityRepository.save(amenity);
    }

    /**
     * Get a lightweight snapshot of a listing (for cache invalidation before update/delete)
     */
    async getListingSnapshot(id: string): Promise<Listing | null> {
        return this.listingRepository.findOne({
            where: { id },
            relations: ['category'],
        });
    }

    // ---------------------------------------------------------------------------
    // Albums (paid plans only — stored as JSON on listing)
    // ---------------------------------------------------------------------------

    private async getOwnedListing(id: string, user: User): Promise<Listing> {
        const listing = await this.listingRepository.findOne({
            where: { id },
            relations: ['vendor'],
        });
        if (!listing) throw new NotFoundException('Listing not found');
        if (
            listing.vendor.userId !== user.id &&
            user.role !== UserRole.ADMIN &&
            user.role !== UserRole.SUPERADMIN
        ) {
            throw new ForbiddenException('You do not have permission to manage this listing');
        }
        return listing;
    }

    async getAlbums(id: string, user: User): Promise<any[]> {
        const listing = await this.getOwnedListing(id, user);
        await this.assertCanManageAlbums(listing.vendorId, user);
        return listing.albums || [];
    }

    async createAlbum(id: string, user: User, name: string): Promise<any> {
        const listing = await this.getOwnedListing(id, user);
        await this.assertCanManageAlbums(listing.vendorId, user);
        const album = { id: Date.now().toString(), name, images: [], createdAt: new Date().toISOString() };
        listing.albums = [...(listing.albums || []), album];
        await this.listingRepository.save(listing);
        return album;
    }

    async renameAlbum(id: string, albumId: string, user: User, name: string): Promise<any> {
        const listing = await this.getOwnedListing(id, user);
        await this.assertCanManageAlbums(listing.vendorId, user);
        listing.albums = (listing.albums || []).map((a) => (a.id === albumId ? { ...a, name } : a));
        await this.listingRepository.save(listing);
        return listing.albums.find((a) => a.id === albumId);
    }

    async deleteAlbum(id: string, albumId: string, user: User): Promise<void> {
        const listing = await this.getOwnedListing(id, user);
        await this.assertCanManageAlbums(listing.vendorId, user);
        listing.albums = (listing.albums || []).filter((a) => a.id !== albumId);
        await this.listingRepository.save(listing);
    }

    async upsertAlbumImages(id: string, albumId: string, user: User, images: any[]): Promise<any> {
        const listing = await this.getOwnedListing(id, user);
        await this.assertCanManageAlbums(listing.vendorId, user);
        listing.albums = (listing.albums || []).map((a) => (a.id === albumId ? { ...a, images } : a));
        await this.listingRepository.save(listing);
        return listing.albums.find((a) => a.id === albumId);
    }
}
