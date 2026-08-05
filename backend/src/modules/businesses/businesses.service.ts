import {
    Injectable,
    NotFoundException,
    ForbiddenException,
    BadRequestException,
    ConflictException,
    OnModuleInit,
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
import { BusinessConsentLog } from '../../entities/business-consent-log.entity';
import { ImageViews } from '../../entities/image-views.entity';
import { randomUUID } from 'crypto';
import { AdminActivityGateway } from '../admin/admin-activity.gateway';

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
        @InjectRepository(BusinessConsentLog)
        private consentLogRepository: Repository<BusinessConsentLog>,
        @InjectRepository(ImageViews)
        private imageViewsRepository: Repository<ImageViews>,
        private notificationsService: NotificationsService,
        private searchService: SearchService,
        private demandService: DemandService,
        private geocodingQueueService: GeocodingQueueService,
        private addressConfigService: AddressConfigService,
        private affiliateService: AffiliateService,
        private adminActivityGateway: AdminActivityGateway,
    ) { }

    private async validatePostalForCountry(country?: string, pincode?: string | null): Promise<void> {
        const countryKey = (country || 'Pakistan').trim();
        const valid = await this.addressConfigService.validatePostalCode(countryKey, pincode);
        if (!valid) {
            throw new BadRequestException('Invalid postal code format for the selected country.');
        }
    }

    private normalizeModernPlanFeatures(features: Record<string, unknown> = {}, planName?: string) {
        const raw = features as Record<string, any>;
        const maxCategories = Number(raw.maxCategories ?? 0);
        const derivedMaxSubCategories = maxCategories > 0 ? Math.max(0, maxCategories - 1) : 0;
        let normalizedMaxSubCategories = Number(raw.maxSubCategories ?? derivedMaxSubCategories ?? 0);
        let normalizedMaxListings = Number(raw.maxListings ?? 0);
        
        // Paid plan safety net
        const isPaid = planName && !planName.toLowerCase().includes('free') && !planName.toLowerCase().includes('starter');
        if (isPaid) {
            if (normalizedMaxSubCategories === 0) normalizedMaxSubCategories = 3; // Ensure at least 3 subcategories
            if (normalizedMaxListings <= 1) normalizedMaxListings = 999; // Ensure unlimited listings for paid
            if (Number(raw.maxFaqs ?? 0) === 0) raw.maxFaqs = 10; // Ensure FAQs for paid
            if (Number(raw.maxKeywords ?? 0) === 0) raw.maxKeywords = 20; // Ensure keywords for paid
            if (Number(raw.maxNamedPhoneNumbers ?? raw.maxAdditionalPhones ?? 0) === 0) raw.maxNamedPhoneNumbers = 5; // Ensure phones for paid
        }

        const normalizedMaxImages = isPaid
            ? Number(raw.maxImages ?? 999)
            : 3;

        return {
            ...raw,
            maxListings: normalizedMaxListings,
            maxKeywords: Number(raw.maxKeywords ?? 0),
            maxFaqs: Number(raw.maxFaqs ?? 0),
            maxSubCategories: normalizedMaxSubCategories,
            maxImages: normalizedMaxImages,
            maxNamedPhoneNumbers: Number(raw.maxNamedPhoneNumbers ?? raw.maxAdditionalPhones ?? 0),
            showCustomerNotes:
                raw.showCustomerNotes !== undefined
                    ? !!raw.showCustomerNotes
                    : !!raw.customerNotes,
            canReplyReviews:
                raw.canReplyReviews !== undefined
                    ? !!raw.canReplyReviews
                    : !!raw.replyToReviews,
            canRespondBroadcast:
                raw.canRespondBroadcast !== undefined
                    ? !!raw.canRespondBroadcast
                    : !!raw.respondToBroadcastLeads,
            showChat: raw.showChat !== undefined ? !!raw.showChat : (!!raw.canChat || !!raw.whatsappIntegration),
            showSocialLinks:
                raw.showSocialLinks !== undefined
                    ? !!raw.showSocialLinks
                    : !!raw.socialLinks,
            canCreateAlbums: !!raw.canCreateAlbums,
        };
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
                maxNamedPhoneNumbers: 999,
                canCreateAlbums: true,
                maxSubCategories: 999,
                maxListings: 999,
                maxImages: 999,
                showChat: true,
                showSocialLinks: true,
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

        const rawFeatures = activeNewPlan?.plan?.features || activeSub?.plan?.dashboardFeatures || {};
        const planName = activeNewPlan?.plan?.name || activeSub?.plan?.name || 'free';
        const modern = this.normalizeModernPlanFeatures((rawFeatures as Record<string, unknown>), planName);
        return modern;
    }

    private async sanitizeListingForPublicViewer(listing: Listing, user?: User): Promise<Listing> {
        const isOwner = !!user && listing.vendor?.userId === user.id;
        const isAdmin = !!user && [UserRole.ADMIN, UserRole.SUPERADMIN].includes(user.role as UserRole);

        const features = await this.resolvePlanFeatures(listing.vendorId);
        (listing as any).planFeatures = features;

        if (isOwner || isAdmin) {
            return listing;
        }

        if (Number(features.maxKeywords ?? 0) <= 0) {
            listing.metaKeywords = '';
            listing.searchKeywords = [];
        }

        if (!features.showChat) {
            listing.whatsapp = null as any;
        }

        if (Number(features.maxNamedPhoneNumbers ?? 0) <= 0) {
            listing.namedPhoneNumbers = [];
        }

        if (Number(features.maxFaqs ?? 0) <= 0) {
            listing.faqs = [];
        }

        if (!features.canCreateAlbums) {
            listing.albums = [];
        }

        if (listing.vendor && !features.showSocialLinks) {
            listing.vendor.socialLinks = [];
        }

        return listing;
    }

    private normalizeSocialLinks(
        socialLinks?: Array<{ platform?: string; url?: string; label?: string }>,
    ): Array<{ platform: string; url: string; label?: string }> {
        if (!Array.isArray(socialLinks)) {
            return [];
        }

        return socialLinks
            .filter((link): link is { platform: string; url: string; label?: string } => !!link?.platform?.trim() && !!link?.url?.trim())
            .map((link) => ({
                platform: link.platform.trim(),
                url: link.url.trim(),
                label: link.label?.trim() || undefined,
            }));
    }

    private normalizeNamedPhoneNumbers(
        namedPhoneNumbers?: Array<{ label?: string; number?: string; personName?: string; title?: string }>,
    ): Array<{ label: string; number: string; personName?: string; title?: string }> {
        if (!Array.isArray(namedPhoneNumbers)) {
            return [];
        }

        return namedPhoneNumbers
            .filter((item): item is { label: string; number: string; personName?: string; title?: string } => !!item?.label?.trim() && !!item?.number?.trim())
            .map((item) => ({
                label: item.label.trim(),
                number: item.number.trim(),
                personName: item.personName?.trim() || undefined,
                title: item.title?.trim() || undefined,
            }))
            .slice(0, 5);
    }

    private normalizeSearchKeywords(searchKeywords?: string[]): string[] {
        if (!Array.isArray(searchKeywords)) {
            return [];
        }

        const unique = new Set<string>();
        for (const keyword of searchKeywords) {
            const normalized = (keyword || '').trim();
            if (!normalized) continue;
            unique.add(normalized.slice(0, 40));
            if (unique.size >= 10) break;
        }

        return Array.from(unique);
    }

    private stripPublicSearchVendorDetails(listing: Listing): Listing {
        if (!listing.vendor) {
            return listing;
        }

        (listing.vendor as any).isOnline = listing.vendor.user?.isOnline || false;
        delete (listing.vendor as any).user;
        delete (listing.vendor as any).userId;

        return listing;
    }

    private sanitizeSearchIndexKeywords(listing: Listing, features: Record<string, unknown>): Listing {
        if (Number(features.maxKeywords ?? 0) > 0) {
            return listing;
        }

        const indexedListing = Object.assign(
            Object.create(Object.getPrototypeOf(listing)),
            listing,
        ) as Listing;
        indexedListing.metaKeywords = '';
        indexedListing.searchKeywords = [];
        return indexedListing;
    }

    private enforcePremiumContentLimits(
        dto: {
            metaKeywords?: string;
            searchKeywords?: string[];
            faqs?: { question: string; answer: string }[];
            namedPhoneNumbers?: Array<{ label?: string; number?: string; personName?: string; title?: string }>;
            whatsapp?: string;
            galleryImages?: string[];
        },
        _features: Record<string, unknown>,
    ) {
        const maxKeywords = Number(_features.maxKeywords ?? 0);
        const maxFaqs = Number(_features.maxFaqs ?? 0);
        const maxNamedPhoneNumbers = Number(_features.maxNamedPhoneNumbers ?? 0);
        const maxImages = Number(_features.maxImages ?? 3); // Default to 3 for free plans if undefined

        if (dto.galleryImages && dto.galleryImages.length > maxImages) {
            throw new BadRequestException(
                `Your current plan allows a maximum of ${maxImages} images. Please upgrade to add more.`,
            );
        }

        if (dto.metaKeywords) {
            const keywordCount = dto.metaKeywords
                .split(',')
                .map((k) => k.trim())
                .filter(Boolean).length;
            if (keywordCount > maxKeywords) {
                throw new BadRequestException(
                    `You can save up to ${maxKeywords} keywords per listing.`,
                );
            }
        }

        if (dto.searchKeywords) {
            if (dto.searchKeywords.length > maxKeywords) {
                throw new BadRequestException(
                    `You can save up to ${maxKeywords} search keywords per listing.`,
                );
            }
        }

        if (dto.faqs?.length && dto.faqs.length > maxFaqs) {
            throw new BadRequestException(
                `You can save up to ${maxFaqs} FAQs per listing.`,
            );
        }

        if (dto.namedPhoneNumbers?.length && dto.namedPhoneNumbers.length > maxNamedPhoneNumbers) {
            throw new BadRequestException(
                `You can save up to ${maxNamedPhoneNumbers} named phone numbers per listing.`,
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

    private hasCoordinates(input: {
        latitude?: string | number | null;
        longitude?: string | number | null;
    }) {
        return (
            input.latitude !== undefined &&
            input.latitude !== null &&
            input.latitude !== '' &&
            input.longitude !== undefined &&
            input.longitude !== null &&
            input.longitude !== ''
        );
    }

    private markApproved(listing: Listing, approvedAt?: Date) {
        const approvedOn = approvedAt || listing.approvedAt || new Date();
        listing.status = BusinessStatus.APPROVED;
        listing.approvedAt = approvedOn;
        listing.rejectedAt = null as any;
        listing.rejectionReason = null as any;
        listing.recentUntil = listing.recentUntil || new Date(approvedOn.getTime() + 7 * 24 * 60 * 60 * 1000);
    }

    private markPendingGeocode(listing: Listing) {
        listing.status = BusinessStatus.PENDING_GEOCODE;
        listing.approvedAt = null as any;
        listing.recentUntil = null as any;
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
            await this.listingRepository.query(`
                CREATE EXTENSION IF NOT EXISTS cube;
                CREATE EXTENSION IF NOT EXISTS earthdistance;

                DO $$
                BEGIN
                    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'businesses_status_enum') THEN
                        IF NOT EXISTS (
                            SELECT 1
                            FROM pg_enum e
                            JOIN pg_type t ON t.oid = e.enumtypid
                            WHERE t.typname = 'businesses_status_enum' AND e.enumlabel = 'pending_geocode'
                        ) THEN
                            ALTER TYPE businesses_status_enum ADD VALUE 'pending_geocode';
                        END IF;
                    END IF;
                EXCEPTION
                    WHEN duplicate_object THEN NULL;
                    WHEN others THEN NULL;
                END
                $$;

                ALTER TABLE businesses ADD COLUMN IF NOT EXISTS recent_until TIMESTAMP NULL;
                UPDATE businesses 
                SET recent_until = created_at + INTERVAL '7 days' 
                WHERE recent_until IS NULL;
                
                CREATE INDEX IF NOT EXISTS idx_recent_until ON businesses(recent_until);
                CREATE INDEX IF NOT EXISTS idx_businesses_city ON businesses(city);
                CREATE INDEX IF NOT EXISTS idx_businesses_status ON businesses(status);
                CREATE INDEX IF NOT EXISTS idx_businesses_featured ON businesses(is_featured) WHERE is_featured = true;
                CREATE INDEX IF NOT EXISTS idx_businesses_sponsored ON businesses(is_sponsored) WHERE is_sponsored = true;
                CREATE INDEX IF NOT EXISTS idx_businesses_price_range ON businesses(price_range);
                CREATE INDEX IF NOT EXISTS idx_businesses_category_id ON businesses(category_id);
                
                ALTER TABLE vendors ADD COLUMN IF NOT EXISTS city VARCHAR(100) NULL;
                ALTER TABLE vendors ADD COLUMN IF NOT EXISTS state VARCHAR(100) NULL;
                ALTER TABLE vendors ADD COLUMN IF NOT EXISTS country VARCHAR(100) DEFAULT 'Pakistan';
                ALTER TABLE vendors ADD COLUMN IF NOT EXISTS slug VARCHAR(255) NULL;
                CREATE INDEX IF NOT EXISTS idx_vendors_city ON vendors(city);
                CREATE INDEX IF NOT EXISTS idx_vendors_slug ON vendors(slug);
                
                CREATE TABLE IF NOT EXISTS business_subcategories (
                    business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
                    category_id uuid NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
                    PRIMARY KEY (business_id, category_id)
                );
                CREATE INDEX IF NOT EXISTS idx_business_subcategories_category ON business_subcategories(category_id);
                ALTER TABLE businesses ADD COLUMN IF NOT EXISTS albums JSONB DEFAULT '[]';
                ALTER TABLE businesses ADD COLUMN IF NOT EXISTS named_phone_numbers JSONB DEFAULT '[]';
                ALTER TABLE businesses ADD COLUMN IF NOT EXISTS image_captions JSONB DEFAULT '{}'::jsonb;
                ALTER TABLE businesses ADD COLUMN IF NOT EXISTS contact_person_prefix VARCHAR(10) NULL;
                ALTER TABLE businesses ADD COLUMN IF NOT EXISTS contact_person_title VARCHAR(100) NULL;
                ALTER TABLE businesses ADD COLUMN IF NOT EXISTS business_tagline VARCHAR(200) NULL;
                ALTER TABLE businesses ADD COLUMN IF NOT EXISTS open_247 BOOLEAN DEFAULT false;
                ALTER TABLE users ADD COLUMN IF NOT EXISTS pending_referral_code VARCHAR(32) NULL;
                ALTER TABLE businesses ADD COLUMN IF NOT EXISTS click_count INTEGER DEFAULT 0;
                ALTER TABLE businesses ADD COLUMN IF NOT EXISTS hidden_by_deletion BOOLEAN DEFAULT false;
            `);
        } catch (error) {
            console.error('[BusinessesService] Core schema migration failed:', error);
        }

        // Each new column gets its own try-catch so one failure doesn't block the rest
        const newColumns = [
            'ALTER TABLE businesses ADD COLUMN IF NOT EXISTS search_impressions INTEGER DEFAULT 0',
            'ALTER TABLE businesses ADD COLUMN IF NOT EXISTS converted_leads INTEGER DEFAULT 0',
            'ALTER TABLE businesses ADD COLUMN IF NOT EXISTS click_to_call_count INTEGER DEFAULT 0',
            'ALTER TABLE businesses ADD COLUMN IF NOT EXISTS response_count INTEGER DEFAULT 0',
            'ALTER TABLE businesses ADD COLUMN IF NOT EXISTS follower_history JSONB DEFAULT \'[]\'',
            'ALTER TABLE businesses ADD COLUMN IF NOT EXISTS offer_views INTEGER DEFAULT 0',
            'ALTER TABLE businesses ADD COLUMN IF NOT EXISTS offer_clicks INTEGER DEFAULT 0',
            'ALTER TABLE businesses ADD COLUMN IF NOT EXISTS ad_impressions INTEGER DEFAULT 0',
            'ALTER TABLE businesses ADD COLUMN IF NOT EXISTS ad_clicks INTEGER DEFAULT 0',
            'ALTER TABLE businesses ADD COLUMN IF NOT EXISTS avg_response_time_minutes REAL DEFAULT 0',
            'ALTER TABLE businesses ADD COLUMN IF NOT EXISTS user_submitted_photos JSONB DEFAULT \'[]\'',
        ];

        for (const sql of newColumns) {
            try {
                await this.listingRepository.query(sql);
            } catch (err) {
                console.error(`[BusinessesService] Column migration failed: ${sql}`, err);
            }
        }

        try {
            await this.listingRepository.query(`
                CREATE TABLE IF NOT EXISTS business_consent_logs (
                    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
                    user_id uuid NULL,
                    vendor_id uuid NOT NULL,
                    listing_id uuid NULL,
                    source varchar(32) NOT NULL,
                    accepted_at timestamp NOT NULL,
                    terms_accepted boolean DEFAULT false,
                    privacy_accepted boolean DEFAULT false,
                    moderation_accepted boolean DEFAULT false,
                    accuracy_confirmed boolean DEFAULT false,
                    public_location_consent boolean DEFAULT false,
                    marketing_updates_consent boolean DEFAULT false,
                    terms_version varchar(50) NULL,
                    privacy_version varchar(50) NULL,
                    session_id varchar(120) NULL,
                    device_id varchar(255) NULL,
                    ip_address varchar(120) NULL,
                    retention_until timestamp NOT NULL,
                    payload jsonb DEFAULT '{}'::jsonb,
                    created_at timestamp DEFAULT NOW()
                );
                CREATE INDEX IF NOT EXISTS idx_business_consent_logs_vendor_id ON business_consent_logs(vendor_id);
                CREATE INDEX IF NOT EXISTS idx_business_consent_logs_user_id ON business_consent_logs(user_id);
                CREATE INDEX IF NOT EXISTS idx_business_consent_logs_listing_id ON business_consent_logs(listing_id);
            `);
        } catch (error) {
            console.error('[BusinessesService] Consent logs table creation failed:', error);
        }

        try {
            await this.listingRepository.query(`
                CREATE TABLE IF NOT EXISTS image_views (
                    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
                    listing_id uuid NOT NULL,
                    image_url text NOT NULL,
                    view_count integer DEFAULT 0,
                    created_at timestamp DEFAULT NOW()
                );
                CREATE INDEX IF NOT EXISTS idx_image_views_listing_id ON image_views(listing_id);
                CREATE UNIQUE INDEX IF NOT EXISTS idx_image_views_listing_image ON image_views(listing_id, image_url);
            `);
        } catch (error) {
            console.error('[BusinessesService] Image views table creation failed:', error);
        }

        console.log('[BusinessesService] Database performance indexes auto-sync completed.');
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

        const requiredConsentFields = [
            createBusinessDto.legalConsentTerms,
            createBusinessDto.legalConsentPrivacy,
            createBusinessDto.legalConsentModeration,
            createBusinessDto.legalConsentAccuracy,
            createBusinessDto.legalConsentPublicLocation,
        ];
        const providedGranularConsent = requiredConsentFields.some((value) => value !== undefined);
        if (providedGranularConsent && requiredConsentFields.some((value) => value !== true)) {
            throw new BadRequestException('All required legal consent checkboxes must be accepted before creating a listing.');
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
        
        const planFeaturesRaw =
            (activeNewPlan?.plan?.features as any) ||
            activeSub?.plan?.dashboardFeatures ||
            { maxListings: 1, maxSubCategories: 0 };
        const planName = activeNewPlan?.plan?.name || activeSub?.plan?.name || 'free';
        const planFeatures = this.normalizeModernPlanFeatures(planFeaturesRaw, planName);

        // --- Limit Enforcement ---
        // Enforce listing capacity from the resolved plan instead of a hard one-listing cap.
        const existingCount = await this.listingRepository.count({
            where: { vendorId: vendor.id }
        });

        const maxListings = Math.max(1, Number(planFeatures.maxListings || 1));
        if (existingCount >= maxListings && ![UserRole.ADMIN, UserRole.SUPERADMIN].includes(user.role as UserRole)) {
            throw new BadRequestException(`Your current plan allows a maximum of ${maxListings} listing(s). Please upgrade to add more.`);
        }

        // Check subcategory limits from the resolved plan features.
        const maxSubCategories = Number(planFeatures.maxSubCategories || 0);
        
        if (createBusinessDto.subCategoryIds?.length) {
            if (createBusinessDto.subCategoryIds.length > maxSubCategories && ![UserRole.ADMIN, UserRole.SUPERADMIN].includes(user.role as UserRole)) {
                throw new BadRequestException(`Your current plan allows a maximum of ${maxSubCategories} sub-categories. Please upgrade to add more.`);
            }
        }

        this.enforcePremiumContentLimits(createBusinessDto, planFeatures);

        if (createBusinessDto.images?.length && ![UserRole.ADMIN, UserRole.SUPERADMIN].includes(user.role as UserRole)) {
            const maxImages = Number(planFeatures.maxImages ?? 3);
            if (createBusinessDto.images.length > maxImages) {
                throw new BadRequestException(`Your current plan allows a maximum of ${maxImages} image(s). Please upgrade to add more.`);
            }
        }

        const hasBoostedSub = !!referralPlan || ((activeNewPlan?.plan?.features as any)?.top_ranking);

        const now = new Date();
        const hasCoordinates = this.hasCoordinates(createBusinessDto);
        const normalizedSearchKeywords = this.normalizeSearchKeywords(createBusinessDto.searchKeywords);
        const normalizedNamedPhoneNumbers = this.normalizeNamedPhoneNumbers(createBusinessDto.namedPhoneNumbers);
        const normalizedSocialLinks = this.normalizeSocialLinks(createBusinessDto.socialLinks);
        const normalizedMetaKeywords = normalizedSearchKeywords.length
            ? normalizedSearchKeywords.join(', ')
            : createBusinessDto.metaKeywords;
        const { socialLinks: _socialLinks, ...listingPayload } = createBusinessDto;
        const listing = this.listingRepository.create({
            ...listingPayload,
            searchKeywords: normalizedSearchKeywords,
            metaKeywords: normalizedMetaKeywords,
            namedPhoneNumbers: normalizedNamedPhoneNumbers,
            offerExpiresAt: sanitizedExpiresAt,
            vendorId: vendor.id,
            slug,
            status: BusinessStatus.APPROVED,
            isVerified: false,
            isFeatured: false, // Only Superadmin can set isFeatured via admin panel
            isSponsored: hasBoostedSub,
            approvedAt: now,
            recentUntil: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
            // location: createBusinessDto.latitude && createBusinessDto.longitude ? `POINT(${createBusinessDto.longitude} ${createBusinessDto.latitude})` : null,
            subcategories: createBusinessDto.subCategoryIds?.length ? createBusinessDto.subCategoryIds.map(id => ({ id } as any)) : [],
        });

        const savedListing = await this.listingRepository.save(listing);

        // Auto-sync listing data to vendor profile
        const vendorUpdates: any = {};
        if (createBusinessDto.title && (!vendor.businessName || vendor.businessName.includes("'s Business"))) {
            vendorUpdates.businessName = createBusinessDto.title;
        }
        if (createBusinessDto.phoneNumber) {
            const normalizedPhone = createBusinessDto.phoneNumber.replace(/^0+/, '');
            const phoneCode = createBusinessDto.phoneCode || '+92';
            vendorUpdates.businessPhone = `${phoneCode}${normalizedPhone}`;
        }
        if (createBusinessDto.businessEmail) vendorUpdates.businessEmail = createBusinessDto.businessEmail;
        if (createBusinessDto.address) vendorUpdates.businessAddress = createBusinessDto.address;
        if (createBusinessDto.city) vendorUpdates.city = createBusinessDto.city;
        if (createBusinessDto.state) vendorUpdates.state = createBusinessDto.state;
        if (createBusinessDto.country) vendorUpdates.country = createBusinessDto.country;
        if (createBusinessDto.timezone) vendorUpdates.timezone = createBusinessDto.timezone;
        if (createBusinessDto.description) vendorUpdates.bio = createBusinessDto.description;
        if (createBusinessDto.businessHours) vendorUpdates.businessHours = createBusinessDto.businessHours;
        if (createBusinessDto.socialLinks !== undefined) vendorUpdates.socialLinks = normalizedSocialLinks;
        if (createBusinessDto.logoUrl) vendorUpdates.logoUrl = createBusinessDto.logoUrl;
        if (createBusinessDto.coverImageUrl) vendorUpdates.coverImageUrl = createBusinessDto.coverImageUrl;

        if (Object.keys(vendorUpdates).length > 0) {
            await this.vendorRepository.save({ ...vendor, ...vendorUpdates });
        }

        if (createBusinessDto.legalConsentAccepted) {
            const acceptedAt = createBusinessDto.legalConsentAcceptedAt
                ? new Date(createBusinessDto.legalConsentAcceptedAt)
                : new Date();
            const retentionUntil = new Date(acceptedAt);
            retentionUntil.setFullYear(retentionUntil.getFullYear() + 7);

            await this.consentLogRepository.save(
                this.consentLogRepository.create({
                    id: randomUUID(),
                    userId: user.id,
                    vendorId: vendor.id,
                    listingId: savedListing.id,
                    source: 'listing_create',
                    acceptedAt,
                    termsAccepted: createBusinessDto.legalConsentTerms ?? true,
                    privacyAccepted: createBusinessDto.legalConsentPrivacy ?? true,
                    moderationAccepted: createBusinessDto.legalConsentModeration ?? true,
                    accuracyConfirmed: createBusinessDto.legalConsentAccuracy ?? true,
                    publicLocationConsent: createBusinessDto.legalConsentPublicLocation ?? true,
                    marketingUpdatesConsent: createBusinessDto.legalConsentMarketing ?? false,
                    termsVersion: createBusinessDto.termsVersion || 'v1',
                    privacyVersion: createBusinessDto.privacyVersion || 'v1',
                    sessionId: createBusinessDto.legalConsentSessionId || context?.sessionId || null,
                    deviceId: createBusinessDto.legalConsentDeviceId || context?.deviceId || null,
                    ipAddress: context?.ipAddress || null,
                    retentionUntil,
                    payload: {
                        legalConsentAccepted: true,
                        legalConsentAcceptedAt: createBusinessDto.legalConsentAcceptedAt || acceptedAt.toISOString(),
                        legalConsentTerms: createBusinessDto.legalConsentTerms ?? true,
                        legalConsentPrivacy: createBusinessDto.legalConsentPrivacy ?? true,
                        legalConsentModeration: createBusinessDto.legalConsentModeration ?? true,
                        legalConsentAccuracy: createBusinessDto.legalConsentAccuracy ?? true,
                        legalConsentPublicLocation: createBusinessDto.legalConsentPublicLocation ?? true,
                        legalConsentMarketing: createBusinessDto.legalConsentMarketing ?? false,
                        termsVersion: createBusinessDto.termsVersion || 'v1',
                        privacyVersion: createBusinessDto.privacyVersion || 'v1',
                    },
                }),
            );
        }

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
        this.searchService
            .indexBusiness(this.sanitizeSearchIndexKeywords(result, planFeatures))
            .catch(err => console.error('ES Index Error:', err));

        // Broadcast to admin activity monitor
        this.adminActivityGateway.broadcastActivity(
            'new-business-listing',
            `New business listed: "${result.title}" by ${vendor.businessName}`,
            user.id,
            { businessId: result.id, title: result.title, city: result.city, category: result.category?.name },
        );

        return result;
    }

    /**
     * Get business hours with real-time open/closed status
     */
    async getBusinessHours(id: string) {
        const listing = await this.listingRepository.findOne({
            where: { id },
            select: ['id', 'open247', 'timezone'],
        });

        if (!listing) {
            throw new NotFoundException('Business not found');
        }

        const hours = await this.businessHoursRepository.find({
            where: { businessId: id },
            order: { dayOfWeek: 'ASC' },
        });

        let isOpen = false;

        if (listing.open247) {
            isOpen = true;
        } else if (hours.length > 0) {
            const tz = listing.timezone || 'Asia/Karachi';
            const now = new Date();
            const formatter = new Intl.DateTimeFormat('en-US', {
                timeZone: tz,
                weekday: 'long',
                hour: '2-digit',
                minute: '2-digit',
                hour12: false,
            });

            const parts = formatter.formatToParts(now);
            const currentDay = parts.find((p) => p.type === 'weekday')?.value?.toLowerCase() || '';
            const currentHour = parts.find((p) => p.type === 'hour')?.value || '00';
            const currentMinute = parts.find((p) => p.type === 'minute')?.value || '00';
            const currentTime = `${currentHour}:${currentMinute}`;

            const todayHours = hours.find((h) => h.dayOfWeek === currentDay);
            if (todayHours && todayHours.isOpen && todayHours.openTime && todayHours.closeTime) {
                isOpen = currentTime >= todayHours.openTime && currentTime < todayHours.closeTime;
            }
        }

        return {
            hours,
            open24_7: listing.open247 || false,
            timezone: listing.timezone || 'Asia/Karachi',
            isOpen,
        };
    }

    /**
     * Search suggestions - text-only, no PostGIS, 2-char minimum, returns 8 max
     */
    async getSuggestions(query: string): Promise<string[]> {
        const trimmed = (query || '').trim();
        if (trimmed.length < 2) return [];

        const searchTerm = `%${trimmed}%`;

        const nameResults = await this.listingRepository
            .createQueryBuilder('listing')
            .select('DISTINCT listing.name', 'suggestion')
            .where('listing.status = :status', { status: BusinessStatus.APPROVED })
            .andWhere('listing.hiddenByDeletion = false')
            .andWhere('listing.name ILIKE :term', { term: searchTerm })
            .orderBy('listing.name', 'ASC')
            .limit(4)
            .getRawMany();

        const categoryResults = await this.listingRepository
            .createQueryBuilder('listing')
            .leftJoin('listing.category', 'category')
            .select('DISTINCT category.name', 'suggestion')
            .where('listing.status = :status', { status: BusinessStatus.APPROVED })
            .andWhere('listing.hiddenByDeletion = false')
            .andWhere('category.name ILIKE :term', { term: searchTerm })
            .orderBy('category.name', 'ASC')
            .limit(3)
            .getRawMany();

        const cityResults = await this.listingRepository
            .createQueryBuilder('listing')
            .select('DISTINCT listing.city', 'suggestion')
            .where('listing.status = :status', { status: BusinessStatus.APPROVED })
            .andWhere('listing.hiddenByDeletion = false')
            .andWhere('listing.city ILIKE :term', { term: searchTerm })
            .andWhere('listing.city IS NOT NULL')
            .orderBy('listing.city', 'ASC')
            .limit(3)
            .getRawMany();

        const seen = new Set<string>();
        const results: string[] = [];

        for (const r of [...nameResults, ...categoryResults, ...cityResults]) {
            const val = r.suggestion;
            if (val && !seen.has(val.toLowerCase())) {
                seen.add(val.toLowerCase());
                results.push(val);
            }
            if (results.length >= 8) break;
        }

        return results;
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
            country,
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
            .leftJoinAndSelect('listing.subcategories', 'subcategories')
            .leftJoinAndSelect('listing.vendor', 'vendor')
            .leftJoinAndSelect('vendor.user', 'user')
            .leftJoinAndSelect('listing.businessHours', 'businessHours')
            .leftJoinAndSelect('listing.businessAmenities', 'businessAmenities')
            .leftJoinAndSelect('businessAmenities.amenity', 'amenity')
            .where('listing.status = :status', { status: BusinessStatus.APPROVED })
            .andWhere('listing.hiddenByDeletion = false')
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
            // Text search fallback — matches name, description, category name, keywords, and vendor business name
            const searchTerms = searchDto.query.toLowerCase().split(' ').filter(term => term.length > 0);
            for (let i = 0; i < searchTerms.length; i++) {
                const term = searchTerms[i];
                const paramName = `searchTerm${i}`;
                queryBuilder.andWhere(
                    new Brackets((innerQb) => {
                        innerQb.where(`"listing"."name" ILIKE :${paramName}`)
                            .orWhere(`"listing"."description" ILIKE :${paramName}`)
                            .orWhere(`"listing"."meta_keywords" ILIKE :${paramName}`)
                            .orWhere(`"listing"."search_keywords"::text ILIKE :${paramName}`)
                            .orWhere(`"vendor"."business_name" ILIKE :${paramName}`)
                            .orWhere(`"category"."name" ILIKE :${paramName}`)
                            .orWhere(`"category"."slug" ILIKE :${paramName}`);
                    }),
                    { [paramName]: `%${term}%` }
                );
            }
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

        // Country filter
        if (country) {
            queryBuilder.andWhere('listing.country ILIKE :country', {
                country: `%${country}%`,
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

        // Business Type filter
        if (searchDto.businessType) {
            queryBuilder.andWhere('listing.businessType @> :businessType', {
                businessType: JSON.stringify([searchDto.businessType]),
            });
        }

        // Distance Filter & Selection using PostGIS with earth_distance fallback
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
                    return `EXISTS (${subQuery})`;
                })
                .orWhere('listing.totalLeads > 0');
            }));
        }

        if (searchDto.experience) {
            const currentYear = new Date().getFullYear();
            queryBuilder.andWhere('listing.yearEstablished IS NOT NULL AND :currentYear - listing.yearEstablished >= 5', { currentYear });
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

        // Open Now filter — timezone-aware
        if (openNow) {
            // Use business's own timezone if set, otherwise fallback to server timezone
            // Note: FMDay removes padding spaces in TO_CHAR
            queryBuilder.andWhere(new Brackets((qb) => {
                qb.where(
                    `businessHours.dayOfWeek = LOWER(TO_CHAR(NOW() AT TIME ZONE COALESCE("listing"."timezone", 'UTC'), 'FMDay'))`
                )
                .andWhere('businessHours.isOpen = :isOpen', { isOpen: true })
                .andWhere(
                    `TO_CHAR(NOW() AT TIME ZONE COALESCE("listing"."timezone", 'UTC'), 'HH24:MI') BETWEEN businessHours.openTime AND businessHours.closeTime`
                );
            }));
        }

        // Sorting
        // 100-point weighted scoring for relevance (DB fallback)
        if (filter === 'new' || (sortBy as any) === 'newest' || sortBy === SearchSortBy.NEWEST) {
            queryBuilder
                .addOrderBy('listing.createdAt', 'DESC')
                .addOrderBy('listing.isSponsored', 'DESC')
                .addOrderBy('listing.isFeatured', 'DESC')
                .addOrderBy('listing.averageRating', 'DESC');
        } else if (sortBy === SearchSortBy.DISTANCE && latitude && longitude) {
            queryBuilder.addOrderBy('distance_meters', 'ASC');
        } else if (sortBy === SearchSortBy.RATING) {
            queryBuilder.addOrderBy('listing.averageRating', 'DESC');
        } else if (sortBy === SearchSortBy.MOST_REVIEWED) {
            queryBuilder.addOrderBy('listing.totalReviews', 'DESC');
        } else if (sortBy === SearchSortBy.MOST_CONTACTED) {
            queryBuilder.addOrderBy('listing.totalLeads', 'DESC');
        } else if (searchDto.query) {
            // 100-point weighted relevance scoring
            const textWeight = searchDto.query ? 35 : 0;
            const verifiedWeight = 4;
            const featuredWeight = 4;
            const freshnessWeight = 10;
            const ratingWeight = 10;
            const reviewsWeight = 8;
            const profileWeight = 6;

            const scoreParts: string[] = [];

            // Text relevance (35pts) — exact name match > partial name > description > keywords
            if (searchDto.query) {
                scoreParts.push(
                    `CASE WHEN "listing"."name" ILIKE :exactName THEN ${textWeight}`
                    + ` WHEN "listing"."name" ILIKE :nameContains THEN ${Math.round(textWeight * 0.7)}`
                    + ` WHEN "listing"."description" ILIKE :queryLike THEN ${Math.round(textWeight * 0.4)}`
                    + ` WHEN "listing"."search_keywords"::text ILIKE :queryLike THEN ${Math.round(textWeight * 0.3)}`
                    + ` WHEN "listing"."meta_keywords" ILIKE :queryLike THEN ${Math.round(textWeight * 0.2)}`
                    + ` WHEN "vendor"."business_name" ILIKE :queryLike THEN ${Math.round(textWeight * 0.15)}`
                    + ` WHEN "category"."name" ILIKE :queryLike THEN ${Math.round(textWeight * 0.1)}`
                    + ' ELSE 0 END'
                );
                queryBuilder.setParameter('exactName', searchDto.query);
                queryBuilder.setParameter('nameContains', `%${searchDto.query}%`);
                queryBuilder.setParameter('queryLike', `%${searchDto.query}%`);
            }

            // Verified (4pts)
            scoreParts.push(
                `CASE WHEN "listing"."is_verified" = true THEN ${verifiedWeight} ELSE 0 END`
            );

            // Featured (4pts)
            scoreParts.push(
                `CASE WHEN "listing"."is_featured" = true THEN ${featuredWeight} ELSE 0 END`
            );

            // Freshness (10pts) — newer = higher score, decay over 30 days
            scoreParts.push(
                `CASE WHEN "listing"."recent_until" > NOW() THEN ${freshnessWeight}`
                + ` WHEN "listing"."created_at" > NOW() - INTERVAL '7 days' THEN ${Math.round(freshnessWeight * 0.8)}`
                + ` WHEN "listing"."created_at" > NOW() - INTERVAL '30 days' THEN ${Math.round(freshnessWeight * 0.4)}`
                + ' ELSE 0 END'
            );

            // Rating (10pts) — scaled 0-5 to 0-10
            scoreParts.push(
                `COALESCE("listing"."average_rating", 0) * 2`
            );

            // Reviews (8pts) — log-scale, max at 50 reviews
            scoreParts.push(
                `LEAST(COALESCE("listing"."total_reviews", 0) * 0.16, ${reviewsWeight})`
            );

            // Profile completeness (6pts)
            scoreParts.push(
                `(CASE WHEN "listing"."description" IS NOT NULL AND LENGTH("listing"."description") > 50 THEN 2 ELSE 0 END`
                + ` + CASE WHEN "listing"."logo_url" IS NOT NULL THEN 1.5 ELSE 0 END`
                + ` + CASE WHEN "listing"."cover_image_url" IS NOT NULL THEN 1.5 ELSE 0 END`
                + ` + CASE WHEN "listing"."address" IS NOT NULL THEN 1 ELSE 0 END)`
            );

            // Sponsored boost (5pts)
            scoreParts.push(
                `CASE WHEN "listing"."is_sponsored" = true THEN 5 ELSE 0 END`
            );

            // Admin manual ranking boost (up to 10pts)
            scoreParts.push(
                `LEAST(COALESCE("listing"."manual_ranking_boost", 0), 10)`
            );

            const totalScore = scoreParts.length > 0
                ? scoreParts.join(' + ')
                : '0';

            queryBuilder.addSelect(`(${totalScore})`, 'relevance_score');
            queryBuilder.addOrderBy('relevance_score', 'DESC');
            queryBuilder.addOrderBy('listing.averageRating', 'DESC');
        } else {
            // No query — default sort
            queryBuilder
                .addOrderBy('listing.isSponsored', 'DESC')
                .addOrderBy('listing.isFeatured', 'DESC')
                .addOrderBy('listing.createdAt', 'DESC')
                .addOrderBy('listing.averageRating', 'DESC');
        }

        try {
            // Get total count
            const total = await queryBuilder.getCount();

            // Get paginated results
            const listings = await queryBuilder.skip(skip).take(limit).getRawAndEntities();

            // Map and format results
            const results = await Promise.all(listings.entities.map(async (entity) => {
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
                const sanitized = await this.sanitizeListingForPublicViewer(result);
                return this.stripPublicSearchVendorDetails(sanitized);
            }));

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
                'subcategories',
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
        if (listing.status !== BusinessStatus.APPROVED || listing.hiddenByDeletion) {
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
            // Increment offer views if listing has an active offer
            if (listing.hasOffer && listing.offerTitle && (!listing.offerExpiresAt || new Date(listing.offerExpiresAt) > new Date())) {
                await this.listingRepository.increment({ id }, 'offerViews', 1);
                listing.offerViews = (listing.offerViews || 0) + 1;
            }
        }

        if (listing.vendor && listing.vendor.user) {
            (listing.vendor as any).isOnline = listing.vendor.user.isOnline || false;
        }

        return this.sanitizeListingForPublicViewer(listing, user);
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
                    'subcategories',
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

            // Fetch new columns that may not be in TypeORM metadata
            try {
                const extraCols = await this.listingRepository.query(
                    `SELECT search_impressions, click_to_call_count, converted_leads, offer_views, offer_clicks,
                            ad_impressions, ad_clicks, avg_response_time_minutes, response_count,
                            follower_history, user_submitted_photos, contact_person_prefix
                     FROM businesses WHERE id = $1`, [listing.id]
                );
                if (extraCols?.[0]) {
                    const e = extraCols[0];
                    (listing as any).searchImpressions = e.search_impressions;
                    (listing as any).clickToCallCount = e.click_to_call_count;
                    (listing as any).convertedLeads = e.converted_leads;
                    (listing as any).offerViews = e.offer_views;
                    (listing as any).offerClicks = e.offer_clicks;
                    (listing as any).adImpressions = e.ad_impressions;
                    (listing as any).adClicks = e.ad_clicks;
                    (listing as any).avgResponseTimeMinutes = e.avg_response_time_minutes;
                    (listing as any).responseCount = e.response_count;
                    (listing as any).followerHistory = e.follower_history;
                    (listing as any).userSubmittedPhotos = e.user_submitted_photos;
                    (listing as any).contactPersonPrefix = e.contact_person_prefix;
                }
            } catch (e) {
                log(`findBySlug: ${slug} - Extra columns fetch failed: ${(e as any)?.message}`);
            }

            const isPubliclyVisible = listing.status === BusinessStatus.APPROVED && !listing.hiddenByDeletion;
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
                // Increment offer views if listing has an active offer
                if (listing.hasOffer && listing.offerTitle && (!listing.offerExpiresAt || new Date(listing.offerExpiresAt) > new Date())) {
                    await this.listingRepository.increment({ id: listing.id }, 'offerViews', 1);
                    listing.offerViews = (listing.offerViews || 0) + 1;
                }
            }

            if (listing.vendor && listing.vendor.user) {
                (listing.vendor as any).isOnline = listing.vendor.user.isOnline || false;
            }

            log(`findBySlug: ${slug} - SUCCESS`);
            const sanitized = await this.sanitizeListingForPublicViewer(listing, user);

            // Convert entity to plain object so dynamically-added columns survive JSON serialization
            // TypeORM entity class-transformer may strip properties not in runtime metadata
            const plain: any = JSON.parse(JSON.stringify(sanitized));
            plain.searchImpressions = (sanitized as any).searchImpressions ?? 0;
            plain.clickToCallCount = (sanitized as any).clickToCallCount ?? 0;
            plain.convertedLeads = (sanitized as any).convertedLeads ?? 0;
            plain.offerViews = (sanitized as any).offerViews ?? 0;
            plain.offerClicks = (sanitized as any).offerClicks ?? 0;
            plain.adImpressions = (sanitized as any).adImpressions ?? 0;
            plain.adClicks = (sanitized as any).adClicks ?? 0;
            plain.avgResponseTimeMinutes = (sanitized as any).avgResponseTimeMinutes ?? 0;
            plain.responseCount = (sanitized as any).responseCount ?? 0;
            plain.followerHistory = (sanitized as any).followerHistory ?? [];
            plain.userSubmittedPhotos = (sanitized as any).userSubmittedPhotos ?? [];
            plain.contactPersonPrefix = (sanitized as any).contactPersonPrefix ?? null;

            return plain;
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
            const planFeatures = await this.resolvePlanFeatures(listing.vendor.id, user);
            const maxSubCategories = Number(planFeatures.maxSubCategories || 0);

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

        if (updateBusinessDto.images !== undefined && ![UserRole.ADMIN, UserRole.SUPERADMIN].includes(user.role as UserRole)) {
            const maxImages = Number(planFeatures.maxImages ?? 3);
            if (updateBusinessDto.images.length > maxImages) {
                throw new BadRequestException(`Your current plan allows a maximum of ${maxImages} image(s). Please upgrade to add more.`);
            }
        }

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
            'website', 'address', 'addressLine2', 'landmark', 'city', 'state', 'pincode', 'latitude', 'longitude',
            'logoUrl', 'coverImageUrl', 'images', 'imageCaptions', 'namedPhoneNumbers', 'metaTitle', 'metaDescription',
            'metaKeywords', 'hasOffer', 'offerTitle', 'offerDescription', 'offerBadge',
            'offerExpiresAt', 'offerBannerUrl', 'faqs', 'businessTagline', 'contactPersonPrefix', 'contactPersonTitle', 'open247', 'searchKeywords'
        ];

        textFields.forEach(field => {
            if (updateBusinessDto[field] !== undefined) {
                if (field === 'namedPhoneNumbers') {
                    listing.namedPhoneNumbers = this.normalizeNamedPhoneNumbers(updateBusinessDto.namedPhoneNumbers);
                    return;
                }
                if (field === 'searchKeywords') {
                    listing.searchKeywords = this.normalizeSearchKeywords(updateBusinessDto.searchKeywords);
                    listing.metaKeywords = listing.searchKeywords.join(', ');
                    return;
                }
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
        const {
            businessHours: _,
            amenityIds: __,
            subCategoryIds: ___,
            socialLinks: ____,
            namedPhoneNumbers: _____,
            searchKeywords: ______,
            ...updateData
        } = updateBusinessDto;

        // removed markPendingGeocode

        await this.listingRepository.save(listing);
        log('Listing saved to database');

        if (updateBusinessDto.socialLinks !== undefined) {
            listing.vendor.socialLinks = this.normalizeSocialLinks(updateBusinessDto.socialLinks);
            await this.vendorRepository.save(listing.vendor);
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
        this.searchService
            .indexBusiness(this.sanitizeSearchIndexKeywords(updatedListing, planFeatures))
            .catch(err => console.error('ES Update Error:', err));

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
        if (listing.vendor.userId !== user.id && user.role !== UserRole.ADMIN && user.role !== UserRole.SUPERADMIN) {
            throw new ForbiddenException('Unauthorized access');
        }

        await this.listingRepository.remove(listing);

        // Remove from Elasticsearch
        this.searchService.remove(id).catch(err => console.error('ES Remove Error:', err));
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
                'subcategories',
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
                hiddenByDeletion: false,
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

    async setRankingBoost(id: string, boost: number): Promise<{ success: boolean; boost: number }> {
        const listing = await this.listingRepository.findOne({ where: { id } });
        if (!listing) throw new NotFoundException('Listing not found');

        // Clamp boost between -10 and 10
        const clampedBoost = Math.max(-10, Math.min(10, Math.round(boost)));
        listing.manualRankingBoost = clampedBoost;
        await this.listingRepository.save(listing);

        return { success: true, boost: clampedBoost };
    }

    async findDuplicateBusinesses() {
        const allListings = await this.listingRepository.find({
            where: { hiddenByDeletion: false },
            select: ['id', 'title', 'phone', 'address', 'city', 'categoryId', 'vendorId', 'createdAt', 'totalViews', 'status'],
            order: { createdAt: 'DESC' },
        });

        const clusters: { reason: string; businesses: typeof allListings }[] = [];

        const phoneGroups = new Map<string, typeof allListings>();
        for (const listing of allListings) {
            if (!listing.phone) continue;
            const normalizedPhone = listing.phone.replace(/[\s\-\(\)]/g, '');
            if (!phoneGroups.has(normalizedPhone)) {
                phoneGroups.set(normalizedPhone, []);
            }
            phoneGroups.get(normalizedPhone)!.push(listing);
        }
        for (const [phone, group] of phoneGroups) {
            if (group.length > 1) {
                clusters.push({ reason: `Same phone: ${phone}`, businesses: group });
            }
        }

        const addrCatGroups = new Map<string, typeof allListings>();
        for (const listing of allListings) {
            if (!listing.address || !listing.categoryId) continue;
            const key = `${listing.address.toLowerCase().trim()}|${listing.categoryId}`;
            if (!addrCatGroups.has(key)) {
                addrCatGroups.set(key, []);
            }
            addrCatGroups.get(key)!.push(listing);
        }
        for (const [, group] of addrCatGroups) {
            if (group.length > 1) {
                clusters.push({ reason: `Same address + category`, businesses: group });
            }
        }

        const titleGroups: typeof allListings[] = [];
        const used = new Set<string>();
        for (let i = 0; i < allListings.length; i++) {
            if (used.has(allListings[i].id)) continue;
            const group = [allListings[i]];
            const t1 = allListings[i].title.toLowerCase().trim();
            for (let j = i + 1; j < allListings.length; j++) {
                if (used.has(allListings[j].id)) continue;
                const t2 = allListings[j].title.toLowerCase().trim();
                if (t1 === t2 || (t1.length > 3 && t2.includes(t1)) || (t2.length > 3 && t1.includes(t2))) {
                    group.push(allListings[j]);
                    used.add(allListings[j].id);
                }
            }
            if (group.length > 1) {
                used.add(allListings[i].id);
                titleGroups.push(group);
            }
        }
        for (const group of titleGroups) {
            clusters.push({ reason: `Similar business name`, businesses: group });
        }

        return clusters;
    }

    async getKeywordAnalytics(vendorId: string) {
        const listings = await this.listingRepository.find({
            where: { vendorId, hiddenByDeletion: false },
            select: ['id', 'searchKeywords', 'totalViews', 'metaKeywords'],
        });

        const keywordMap = new Map<string, { keyword: string; impressions: number; listings: string[] }>();

        for (const listing of listings) {
            const kws = listing.searchKeywords?.length
                ? listing.searchKeywords
                : listing.metaKeywords
                    ? listing.metaKeywords.split(',').map(k => k.trim()).filter(Boolean)
                    : [];

            for (const kw of kws) {
                const normalized = kw.toLowerCase().trim();
                if (!normalized) continue;
                if (!keywordMap.has(normalized)) {
                    keywordMap.set(normalized, { keyword: normalized, impressions: 0, listings: [] });
                }
                const entry = keywordMap.get(normalized)!;
                entry.impressions += Math.round((listing.totalViews || 0) / Math.max(kws.length, 1));
                entry.listings.push(listing.id);
            }
        }

        return Array.from(keywordMap.values()).sort((a, b) => b.impressions - a.impressions);
    }

    async submitUserPhoto(businessId: string, user: User, dto: { url: string; caption?: string }): Promise<Listing> {
        const listing = await this.listingRepository.findOne({ where: { id: businessId } });
        if (!listing) throw new NotFoundException('Business not found');

        const photo = {
            id: randomUUID(),
            url: dto.url,
            userId: user.id,
            userName: user.fullName || 'Anonymous',
            caption: dto.caption || '',
            isApproved: false,
            submittedAt: new Date().toISOString(),
        };

        listing.userSubmittedPhotos = [...(listing.userSubmittedPhotos || []), photo];
        return this.listingRepository.save(listing);
    }

    async getUserPhotos(businessId: string, approvedOnly = true): Promise<any[]> {
        const listing = await this.listingRepository.findOne({ where: { id: businessId } });
        if (!listing) throw new NotFoundException('Business not found');
        const photos = listing.userSubmittedPhotos || [];
        return approvedOnly ? photos.filter((p) => p.isApproved) : photos;
    }

    async approveUserPhoto(businessId: string, photoId: string): Promise<Listing> {
        const listing = await this.listingRepository.findOne({ where: { id: businessId } });
        if (!listing) throw new NotFoundException('Business not found');
        const photos = listing.userSubmittedPhotos || [];
        const idx = photos.findIndex((p) => p.id === photoId);
        if (idx === -1) throw new NotFoundException('Photo not found');
        photos[idx].isApproved = true;
        listing.userSubmittedPhotos = photos;
        return this.listingRepository.save(listing);
    }

    async rejectUserPhoto(businessId: string, photoId: string): Promise<Listing> {
        const listing = await this.listingRepository.findOne({ where: { id: businessId } });
        if (!listing) throw new NotFoundException('Business not found');
        listing.userSubmittedPhotos = (listing.userSubmittedPhotos || []).filter((p) => p.id !== photoId);
        return this.listingRepository.save(listing);
    }

    async trackOfferClick(businessId: string): Promise<void> {
        await this.listingRepository.increment({ id: businessId }, 'offerClicks', 1);
    }

    async trackAdClick(businessId: string): Promise<void> {
        await this.listingRepository.increment({ id: businessId }, 'adClicks', 1);
    }

    async trackContact(businessId: string): Promise<void> {
        await this.listingRepository.increment({ id: businessId }, 'clickToCallCount', 1);
        await this.listingRepository.increment({ id: businessId }, 'totalLeads', 1);
    }

    async trackConversion(businessId: string): Promise<void> {
        await this.listingRepository.increment({ id: businessId }, 'convertedLeads', 1);
    }

    async trackImageView(businessId: string, imageUrl: string): Promise<{ viewCount: number }> {
        const result = await this.imageViewsRepository.query(
            `INSERT INTO image_views (listing_id, image_url, view_count)
             VALUES ($1, $2, 1)
             ON CONFLICT (listing_id, image_url)
             DO UPDATE SET view_count = image_views.view_count + 1
             RETURNING view_count`,
            [businessId, imageUrl],
        );
        return { viewCount: result[0]?.view_count ?? 1 };
    }

    async getImageViews(businessId: string): Promise<{ imageUrl: string; viewCount: number }[]> {
        const rows = await this.imageViewsRepository.find({
            where: { listingId: businessId },
            order: { viewCount: 'DESC' },
        });
        return rows.map((r) => ({ imageUrl: r.imageUrl, viewCount: r.viewCount }));
    }

    async trackImageViews(businessId: string, imageUrls: string[]): Promise<void> {
        if (!imageUrls?.length) return;
        for (const url of imageUrls) {
            await this.trackImageView(businessId, url);
        }
    }

    // ---------------------------------------------------------------------------
    // Nearby Amenities (OpenStreetMap Overpass API)
    // ---------------------------------------------------------------------------

    private readonly overpassCache = new Map<string, { data: any; expiresAt: number }>();
    private readonly OVERPASS_CACHE_TTL = 60 * 60 * 1000; // 1 hour

    private readonly CATEGORY_TAG_MAP: Record<string, { key: string; values: string[] }> = {
        hospital: { key: 'amenity', values: ['hospital'] },
        school: { key: 'amenity', values: ['school'] },
        park: { key: 'leisure', values: ['park'] },
        pharmacy: { key: 'amenity', values: ['pharmacy'] },
        restaurant: { key: 'amenity', values: ['restaurant'] },
        gas_station: { key: 'amenity', values: ['fuel'] },
        atm: { key: 'amenity', values: ['atm'] },
        supermarket: { key: 'shop', values: ['supermarket'] },
    };

    async getNearbyAmenities(
        id: string,
        radius: number,
        categories: string[],
    ): Promise<{ category: string; name: string; distance: number; lat: number; lng: number }[]> {
        const listing = await this.listingRepository.findOne({
            where: { id },
            select: ['id', 'latitude', 'longitude'],
        });

        if (!listing) {
            throw new NotFoundException('Business not found');
        }

        if (!listing.latitude || !listing.longitude) {
            throw new BadRequestException('Business does not have location coordinates');
        }

        const lat = Number(listing.latitude);
        const lng = Number(listing.longitude);
        const clampedRadius = Math.min(Math.max(radius, 100), 50000); // 100m–50km

        // Check cache
        const sortedCategories = [...categories].sort();
        const cacheKey = `${lat}:${lng}:${clampedRadius}:${sortedCategories.join(',')}`;
        const cached = this.overpassCache.get(cacheKey);
        if (cached && cached.expiresAt > Date.now()) {
            return cached.data;
        }

        // Build Overpass query grouped by tag key
        const tagGroups = new Map<string, string[]>();
        for (const cat of categories) {
            const mapping = this.CATEGORY_TAG_MAP[cat];
            if (!mapping) continue;
            if (!tagGroups.has(mapping.key)) tagGroups.set(mapping.key, []);
            for (const v of mapping.values) {
                if (!tagGroups.get(mapping.key)!.includes(v)) {
                    tagGroups.get(mapping.key)!.push(v);
                }
            }
        }

        if (tagGroups.size === 0) {
            return [];
        }

        const clauses: string[] = [];
        for (const [key, values] of tagGroups) {
            clauses.push(`node["${key}"~"${values.join('|')}"](around:${clampedRadius},${lat},${lng});`);
        }

        const query = `[out:json][timeout:10];(${clauses.join('')});out body;`;

        try {
            const response = await fetch('https://overpass-api.de/api/interpreter', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Accept': 'application/json',
                    'User-Agent': 'NampataBusinessDirectory/1.0',
                },
                body: `data=${encodeURIComponent(query)}`,
                signal: AbortSignal.timeout(15000),
            });

            if (!response.ok) {
                throw new Error(`Overpass API returned ${response.status}`);
            }

            const data = await response.json();
            const elements: any[] = data.elements || [];

            const reverseTagMap = new Map<string, string>();
            for (const [cat, mapping] of Object.entries(this.CATEGORY_TAG_MAP)) {
                for (const v of mapping.values) {
                    reverseTagMap.set(`${mapping.key}=${v}`, cat);
                }
            }

            const results = elements
                .filter((el) => el.lat != null && el.lon != null)
                .map((el) => {
                    let detectedCategory = 'unknown';
                    for (const [tagKey, tagValue] of Object.entries(el.tags || {})) {
                        const key = `${tagKey}=${tagValue}`;
                        if (reverseTagMap.has(key)) {
                            detectedCategory = reverseTagMap.get(key)!;
                            break;
                        }
                    }
                    return {
                        category: detectedCategory,
                        name: el.tags?.name || el.tags?.['name:en'] || 'Unnamed',
                        distance: calculateDistance(lat, lng, el.lat, el.lon),
                        lat: el.lat,
                        lng: el.lon,
                    };
                })
                .sort((a, b) => a.distance - b.distance);

            // Cache results
            this.overpassCache.set(cacheKey, {
                data: results,
                expiresAt: Date.now() + this.OVERPASS_CACHE_TTL,
            });

            return results;
        } catch (error: any) {
            if (error.name === 'TimeoutError' || error.name === 'AbortError') {
                throw new BadRequestException('Nearby amenities request timed out. Please try again later.');
            }
            throw new BadRequestException(`Failed to fetch nearby amenities: ${error.message}`);
        }
    }
}
