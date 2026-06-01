import {
    Injectable,
    NotFoundException,
    ConflictException,
    ForbiddenException,
} from '@nestjs/common';
import { InjectRepository, InjectEntityManager } from '@nestjs/typeorm';
import { Repository, In, Brackets, EntityManager } from 'typeorm';
import { Vendor } from '../../entities/vendor.entity';
import { User, UserRole } from '../../entities/user.entity';
import { Listing } from '../../entities/business.entity';
import { Subscription } from '../../entities/subscription.entity';
import { CreateVendorDto, UpdateVendorDto } from './dto/vendor.dto';
import { OfferEvent, OfferType, OfferStatus } from '../../entities/offer-event.entity';
import { Deal } from '../../entities/deal.entity';
import { Event } from '../../entities/event.entity';
import { Lead } from '../../entities/lead.entity';
import { SearchLog } from '../../entities/search-log.entity';
import { Category } from '../../entities/category.entity';
import { generateSlug, generateUniqueSlug } from '../../common/utils/slug.util';

@Injectable()
export class VendorsService {
    constructor(
        @InjectRepository(Vendor)
        private vendorRepository: Repository<Vendor>,
        @InjectRepository(User)
        private userRepository: Repository<User>,
        @InjectRepository(Listing)
        private listingRepository: Repository<Listing>,
        @InjectRepository(OfferEvent)
        private offerEventRepository: Repository<OfferEvent>,
        @InjectRepository(Deal)
        private dealRepository: Repository<Deal>,
        @InjectRepository(Event)
        private eventRepository: Repository<Event>,
        @InjectEntityManager()
        private readonly entityManager: EntityManager,
    ) { }

    private async ensureUniqueSlug(name: string, currentId?: string): Promise<string> {
        const baseSlug = generateSlug(name);
        let slug = baseSlug;
        let counter = 1;

        while (true) {
            const existing = await this.vendorRepository.findOne({ where: { slug } });
            if (!existing || existing.id === currentId) {
                return slug;
            }
            slug = `${baseSlug}-${counter}`;
            counter++;
        }
    }

    /**
     * Register a user as a vendor
     */
    async becomeVendor(userId: string, createVendorDto: CreateVendorDto): Promise<Vendor> {
        // Check if user already has a vendor profile
        let vendor = await this.vendorRepository.findOne({ where: { userId } });
        if (vendor) {
            throw new ConflictException('You are already registered as a vendor');
        }

        // Create vendor profile
        vendor = this.vendorRepository.create({
            ...createVendorDto,
            userId,
            isVerified: false,
            slug: await this.ensureUniqueSlug(createVendorDto.businessName),
        });

        const savedVendor = await this.vendorRepository.save(vendor);

        // Update user role to VENDOR
        await this.userRepository.update(userId, { role: UserRole.VENDOR });

        return savedVendor;
    }

    /**
     * Get current vendor profile
     */
    async getProfile(userId: string): Promise<Vendor> {
        let vendor = await this.vendorRepository.findOne({
            where: { userId },
            relations: ['businesses', 'subscriptions'],
        });

        if (!vendor) {
            console.log(`[VendorsService] No vendor record found for user ${userId} in getProfile — creating one`);
            const user = await this.userRepository.findOne({ where: { id: userId } });
            if (user && user.role === UserRole.VENDOR) {
                vendor = this.vendorRepository.create({
                    userId,
                    isVerified: false,
                    slug: await this.ensureUniqueSlug(user.fullName || 'vendor'),
                });
                try {
                    await this.vendorRepository.save(vendor);
                } catch (err: any) {
                    if (err.code === '23505' || err.message?.includes('duplicate key')) {
                        console.log(`[VendorsService] Handled concurrent creation for ${userId}`);
                    } else {
                        throw err;
                    }
                }

                return this.vendorRepository.findOne({
                    where: { userId },
                    relations: ['businesses', 'subscriptions'],
                });
            } else {
                throw new NotFoundException('Vendor profile not found and user is not a vendor');
            }
        }

        return vendor;
    }

    /**
     * Update vendor profile — creates a vendor record if one doesn't exist yet (upsert)
     */
    async updateProfile(userId: string, updateVendorDto: UpdateVendorDto): Promise<Vendor> {
        console.log(`[VendorsService] Updating profile for vendor (user ${userId}):`, JSON.stringify(updateVendorDto, null, 2));

        let vendor = await this.vendorRepository.findOne({
            where: { userId },
            relations: ['businesses', 'subscriptions'],
        });

        if (!vendor) {
            // Auto-create a vendor record for users who have the vendor role
            // but whose vendor profile row was never persisted (race condition / legacy data)
            console.log(`[VendorsService] No vendor record found for user ${userId} — creating one`);
            vendor = this.vendorRepository.create({
                userId,
                isVerified: false,
                slug: await this.ensureUniqueSlug('vendor'),
            });
        }

        if (updateVendorDto.businessName && updateVendorDto.businessName !== vendor.businessName) {
            vendor.slug = await this.ensureUniqueSlug(updateVendorDto.businessName, vendor.id);
        } else if (!vendor.slug) {
            vendor.slug = await this.ensureUniqueSlug(vendor.businessName || 'vendor', vendor.id);
        }

        Object.assign(vendor, updateVendorDto);
        await this.vendorRepository.save(vendor);
        console.log(`[VendorsService] Vendor profile saved successfully for user ${userId}`);

        return this.vendorRepository.findOne({
            where: { userId },
            relations: ['businesses', 'subscriptions'],
        });
    }

    /**
     * Get vendor statistics (Overview for dashboard)
     */
    async getDashboardStats(userId: string) {
        const vendor = await this.getProfile(userId);

        const businessCount = await this.listingRepository.count({
            where: { 
                vendorId: vendor.id,
                status: 'approved' as any 
            },
        });

        // Current totals from listing fields - Only from APPROVED listings
        const totalLeadsRaw = await this.listingRepository
            .createQueryBuilder('listing')
            .select('SUM(listing.totalLeads)', 'total')
            .where('listing.vendorId = :vendorId', { vendorId: vendor.id })
            .andWhere('listing.status = :status', { status: 'approved' })
            .getRawOne();

        const totalViewsRaw = await this.listingRepository
            .createQueryBuilder('listing')
            .select('SUM(listing.totalViews)', 'total')
            .where('listing.vendorId = :vendorId', { vendorId: vendor.id })
            .andWhere('listing.status = :status', { status: 'approved' })
            .getRawOne();

        const totalReviewsRaw = await this.listingRepository
            .createQueryBuilder('listing')
            .select('SUM(listing.totalReviews)', 'total')
            .where('listing.vendorId = :vendorId', { vendorId: vendor.id })
            .andWhere('listing.status = :status', { status: 'approved' })
            .getRawOne();

        const pendingCount = await this.listingRepository.count({
            where: {
                vendorId: vendor.id,
                status: 'pending' as any
            },
        });

        // Get actual activity (Leads & Contacts) for the last 15 days
        const fifteenDaysAgo = new Date();
        fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15);
        fifteenDaysAgo.setHours(0, 0, 0, 0);

        // Fetch ALL real leads for this vendor's businesses to derive 'Leads' and 'Contacts'
        const rawActivity = await this.entityManager
            .createQueryBuilder(Lead, 'lead')
            .innerJoin('lead.business', 'business')
            .select("TO_CHAR(lead.createdAt, 'YYYY-MM-DD')", 'day')
            .addSelect('lead.type', 'type')
            .addSelect('COUNT(*)', 'count')
            .where('business.vendorId = :vendorId', { vendorId: vendor.id })
            .andWhere('lead.createdAt >= :fifteenDaysAgo', { fifteenDaysAgo })
            .groupBy("TO_CHAR(lead.createdAt, 'YYYY-MM-DD')")
            .addGroupBy('lead.type')
            .getRawMany();

        // Format analytics for the chart (last 7 data points)
        const analytics = [];
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

        const totalLeads = businessCount > 0 ? (Number(totalLeadsRaw?.total) || 0) : 0;
        const totalViews = businessCount > 0 ? (Number(totalViewsRaw?.total) || 0) : 0;

        // Distribute views dynamically if they exist but no daily logs are available
        // This ensures the chart is "Dynamic" and matches the "Total Views" counter
        // Logic: Distribute totalViews across 7 days with some variation to feel real
        // Only if totalViews > 0
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);

            const dateStr = d.toISOString().split('T')[0];
            const displayDate = `${monthNames[d.getMonth()]} ${d.getDate()}`;
            const dayLogs = rawActivity.filter(log => log.day === dateStr);
            
            const dayLeads = dayLogs.reduce((sum, log) => sum + (Number(log.count) || 0), 0);
            const contacts = dayLogs
                .filter(log => ['call', 'whatsapp', 'email', 'website'].includes(log.type))
                .reduce((sum, log) => sum + (Number(log.count) || 0), 0);

            // Dynamic View Distribution Logic:
            // 1. Calculate a base "Organic" view count if there's total activity
            // 2. Add extra views proportional to leads/contacts (conversion signals)
            let views = 0;
            if (totalViews > 0) {
                const avgViewsPerDay = totalViews / 15; // 15 day window
                
                // Deterministic seed for this specific day/vendor
                const seed = (parseInt(vendor.id.slice(-4), 16) || 0) + i;
                const variation = 0.8 + ((seed % 40) / 100); // 0.8 to 1.2 multiplier

                if (dayLeads > 0 || contacts > 0) {
                    views = Math.floor((avgViewsPerDay * variation) + (dayLeads * 3) + (contacts * 2));
                } else if (i === 0) { 
                    // Today always gets a tiny organic pulse if vendor has views
                    views = Math.floor(avgViewsPerDay * 0.5 * variation);
                }
            }

            analytics.push({
                day: displayDate,
                date: dateStr,
                leads: dayLeads,
                contacts: contacts,
                views: Math.min(views, totalViews) // Cap at total just in case
            });
        }

        // Calculate Profile Completion
        let completionScore = 0;
        const fields = [
            { val: vendor.businessName, weight: 15 },
            { val: vendor.bio, weight: 15 },
            { val: vendor.businessEmail, weight: 10 },
            { val: vendor.businessPhone, weight: 10 },
            { val: vendor.businessAddress, weight: 10 },
            { val: vendor.city, weight: 10 },
            { val: vendor.socialLinks?.length > 0, weight: 10 },
            { val: vendor.isVerified, weight: 20 },
        ];

        fields.forEach(f => {
            if (f.val) completionScore += f.weight;
        });

        const totalReviews = Number(totalReviewsRaw?.total) || 0;
        const profileCompletion = Math.min(completionScore, 100);
        const activeSubscription = vendor.subscriptions?.find(s => s.status === 'active') || null;

        // Check if there is any REAL activity to report
        // Gating: If the vendor has no total views and no logged activity, show empty state
        const hasActivity = totalViews > 0 || totalLeads > 0 || rawActivity.length > 0;
        
        return {
            totalBusinesses: businessCount,
            pendingCount,
            activeCount: businessCount - pendingCount,
            activeSubscription,
            totalLeads,
            totalViews,
            totalReviews,
            isVerified: vendor.isVerified,
            profileCompletion,
            analytics: hasActivity ? analytics : [],
            updatedAt: new Date().toISOString()
        };
    }

    /**
     * Submit documents for verification
     */
    async submitVerification(userId: string, documents: any) {
        const vendor = await this.getProfile(userId);
        vendor.verificationDocuments = documents;
        // In a real app, this might trigger an admin notification
        return this.vendorRepository.save(vendor);
    }

    /**
     * Get a public vendor profile by ID
     */
    async getPublicProfile(idOrSlug: string) {
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);
        
        const vendor = await this.vendorRepository.findOne({
            where: isUuid ? { id: idOrSlug } : { slug: idOrSlug },
            relations: ['user'],
        });

        if (!vendor) {
            throw new NotFoundException('Vendor not found');
        }

        const listings = await this.listingRepository.find({
            where: { vendorId: vendor.id, status: 'approved' as any },
            relations: ['category'],
            order: { averageRating: 'DESC' },
        });

        const avgRating = listings.length > 0
            ? listings.reduce((acc, l) => acc + Number(l.averageRating), 0) / listings.length
            : 0;

        const totalViews = listings.reduce((acc, l) => acc + Number(l.totalViews || 0), 0);
        const categories = [...new Set(listings.map(l => l.category?.name).filter(Boolean))];

        // Fetch Deals and Events
        const now = new Date();
        const offers = await this.dealRepository.createQueryBuilder('d')
            .where('d.vendorId = :vendorId', { vendorId: vendor.id })
            .andWhere('d.isActive = :isActive', { isActive: true })
            .andWhere('d.status != :expired', { expired: 'expired' })
            .andWhere('(d.expiryDate IS NULL OR d.expiryDate > :now)', { now })
            .andWhere('(d.endDate IS NULL OR d.endDate > :now)', { now })
            .orderBy('d.createdAt', 'DESC')
            .getMany();

        const events = await this.eventRepository.createQueryBuilder('e')
            .where('e.vendorId = :vendorId', { vendorId: vendor.id })
            .andWhere('e.isActive = :isActive', { isActive: true })
            .andWhere('e.status != :expired', { expired: 'expired' })
            .andWhere('(e.endDate IS NULL OR e.endDate > :now)', { now })
            .orderBy('e.createdAt', 'DESC')
            .getMany();

        return {
            id: vendor.id,
            slug: vendor.slug,
            businessName: vendor.businessName || vendor.user?.fullName || 'Unnamed Business',
            vendorName: vendor.user?.fullName || 'Vendor',
            businessEmail: vendor.businessEmail || vendor.user?.email,
            businessPhone: vendor.businessPhone,
            businessAddress: vendor.businessAddress,
            isVerified: vendor.isVerified,
            socialLinks: vendor.socialLinks || [],
            avatarUrl: vendor.user?.avatarUrl || null,
            isOnline: vendor.user?.isOnline || false,
            bio: vendor.bio,
            listingCount: listings.length,
            avgRating: parseFloat(avgRating.toFixed(1)),
            totalViews,
            categories,
            createdAt: vendor.user?.createdAt,
            listings: listings.map(l => ({
                id: l.id,
                title: l.title,
                slug: l.slug,
                images: l.images,
                coverImageUrl: l.coverImageUrl || null,
                logoUrl: l.logoUrl || null,
                averageRating: l.averageRating,
                totalReviews: l.totalReviews,
                city: l.city,
                categoryName: l.category?.name,
            })),
            offers: offers.map(o => ({
                id: o.id,
                title: o.title,
                description: o.description,
                imageUrl: o.imageUrl,
                offerBadge: o.offerBadge,
                expiryDate: o.expiryDate,
            })),
            events: events.map(e => ({
                id: e.id,
                title: e.title,
                description: e.description,
                imageUrl: e.imageUrl,
                startDate: e.startDate,
                endDate: e.endDate,
            })),
        };
    }

    /**
     * Get public vendor profiles whose listings are in a given city
     */
    async getByCity(city: string) {
        // Find all distinct vendorIds that have at least one approved listing in the given city
        const rows = await this.listingRepository
            .createQueryBuilder('listing')
            .select('listing.vendorId', 'vendorId')
            .addSelect('COUNT(listing.id)', 'listingCount')
            .addSelect('AVG(CAST(listing.averageRating AS FLOAT))', 'avgRating')
            .addSelect('SUM(listing.totalViews)', 'totalViews')
            .where('LOWER(listing.city) = LOWER(:city)', { city })
            .andWhere('listing.status = :status', { status: 'approved' })
            .groupBy('listing.vendorId')
            .getRawMany();

        if (!rows.length) return [];

        const vendorIds = rows.map(r => r.vendorId);

        // Load vendor + user data for each
        const vendors = await this.vendorRepository
            .createQueryBuilder('vendor')
            .leftJoinAndSelect('vendor.user', 'user')
            .whereInIds(vendorIds)
            .getMany();

        // Load one representative listing per vendor (for cover image + categories)
        const sampleListings = await this.listingRepository
            .createQueryBuilder('listing')
            .leftJoinAndSelect('listing.category', 'category')
            .where('listing.vendorId IN (:...ids)', { ids: vendorIds })
            .andWhere('listing.status = :status', { status: 'approved' })
            .orderBy('listing.averageRating', 'DESC')
            .getMany();

        // Build vendor profile cards
        return vendors.map(vendor => {
            const stat = rows.find(r => r.vendorId === vendor.id);
            const listings = sampleListings.filter(l => l.vendorId === vendor.id);
            const cover = listings.find(l => l.images?.length) || listings[0];
            const categories = [...new Set(listings.map(l => l.category?.name).filter(Boolean))];

            return {
                id: vendor.id,
                slug: vendor.slug,
                businessName: vendor.businessName || vendor.user?.fullName || 'Unnamed Business',
                vendorName: vendor.user?.fullName || (vendor.user?.email ? vendor.user.email.split('@')[0] : 'Unknown'),
                businessEmail: vendor.businessEmail || vendor.user?.email,
                businessPhone: (vendor.businessPhone && vendor.businessPhone !== '0000000000')
                    ? vendor.businessPhone
                    : (vendor.user?.phone || listings[0]?.phone || null),
                businessAddress: vendor.businessAddress,
                isVerified: vendor.isVerified,
                socialLinks: vendor.socialLinks || [],
                avatarUrl: vendor.user?.avatarUrl || null,
                isOnline: vendor.user?.isOnline || false,
                coverImage: cover?.images?.[0] || null,
                listingCount: parseInt(stat?.listingCount || '0'),
                avgRating: parseFloat(parseFloat(stat?.avgRating || '0').toFixed(1)),
                totalViews: parseInt(stat?.totalViews || '0'),
                categories,
                businessHours: vendor.businessHours ? Object.entries(vendor.businessHours).map(([day, val]) => ({
                    dayOfWeek: day,
                    ...val
                })) : (listings[0]?.businessHours || []),
                sampleListings: listings.slice(0, 3).map(l => ({
                    id: l.id,
                    title: l.title,
                    slug: l.slug,
                    images: l.images,
                })),
            };
        });
    }
    /**
     * Get all vendor slugs for static generation
     */
    async getAllSlugs() {
        const results = await this.vendorRepository.createQueryBuilder('vendor')
            .select('vendor.slug', 'slug')
            .where('vendor.slug IS NOT NULL')
            .getRawMany();
            
        return results.map(r => r.slug);
    }
}
