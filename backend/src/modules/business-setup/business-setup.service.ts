import { Injectable, Logger, BadRequestException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Subscription, SubscriptionStatus } from '../../entities/subscription.entity';
import { SubscriptionPlan } from '../../entities/subscription-plan.entity';
import { ActivePlan, ActivePlanStatus } from '../../entities/active-plan.entity';
import { MoreThan, Repository } from 'typeorm';
import { BusinessQuestion } from '../../entities/business-question.entity';
import { VendorAttribute } from '../../entities/vendor-attribute.entity';
import { Vendor } from '../../entities/vendor.entity';
import { Listing } from '../../entities/business.entity';
import { BusinessConsentLog } from '../../entities/business-consent-log.entity';
import { SaveAnswersDto } from './dto/save-answers.dto';
import { DuplicateCheckDto } from './dto/duplicate-check.dto';
import { normalizeGlobalPhone } from '../../common/utils/phone.util';
import { BUSINESS_QUESTIONS_SEED } from './business-questions.seed';
import { randomUUID } from 'crypto';

@Injectable()
export class BusinessSetupService implements OnModuleInit {
    private readonly logger = new Logger(BusinessSetupService.name);
    private static readonly DOC3_CATEGORY_ORDER: string[] = [
        'Business Type',
        'Core Business Nature',
        'Operational Structure',
        'Who Do You Serve',
        'Contact Details',
        'Business Hours',
        'Business Description',
        'Experience & Team',
        'Website & Social Media',
        'Keywords',
        'FAQs',
        'Logo & Cover Image',
        'Amenities & Facilities',
        'Industry Sub-Type',
        'Business Opportunities & Expansion',
        'Map Confirmation',
    ];

    constructor(
        @InjectRepository(BusinessQuestion)
        private questionRepository: Repository<BusinessQuestion>,
        @InjectRepository(VendorAttribute)
        private attributeRepository: Repository<VendorAttribute>,
        @InjectRepository(Vendor)
        private vendorRepository: Repository<Vendor>,
        @InjectRepository(Listing)
        private listingRepository: Repository<Listing>,
        @InjectRepository(Subscription)
        private subscriptionRepository: Repository<Subscription>,
        @InjectRepository(SubscriptionPlan)
        private subscriptionPlanRepository: Repository<SubscriptionPlan>,
        @InjectRepository(ActivePlan)
        private activePlanRepository: Repository<ActivePlan>,
        @InjectRepository(BusinessConsentLog)
        private consentLogRepository: Repository<BusinessConsentLog>,
    ) { }

    async onModuleInit() {
        try {
            await this.consentLogRepository.query(`
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

            await this.questionRepository
                .createQueryBuilder()
                .update(BusinessQuestion)
                .set({ category: 'Amenities & Facilities' })
                .where('category IN (:...legacy)', { legacy: ['Payment Methods', 'Service Mode', 'Business Features'] })
                .execute();

            let created = 0;
            let updated = 0;
            for (const q of BUSINESS_QUESTIONS_SEED) {
                const existing = await this.questionRepository.findOne({
                    where: { category: q.category },
                });
                if (existing) {
                    existing.question = q.question;
                    existing.options = q.options;
                    existing.order = q.order;
                    existing.isActive = true;
                    await this.questionRepository.save(existing);
                    updated++;
                } else {
                    await this.questionRepository.save(
                        this.questionRepository.create({
                            category: q.category,
                            question: q.question,
                            options: q.options,
                            order: q.order,
                            isActive: true,
                        }),
                    );
                    created++;
                }
            }
            this.logger.log(
                `Business questions synced from doc seed (${created} created, ${updated} updated)`,
            );
        } catch (err) {
            this.logger.warn(`Business questions seed skipped: ${(err as Error).message}`);
        }
    }

    private normalizeModernPlanFeatures(features: Record<string, unknown> = {}) {
        const raw = features as Record<string, any>;
        const maxCategories = Number(raw.maxCategories ?? 0);
        const derivedMaxSubCategories = maxCategories > 0 ? Math.max(0, maxCategories - 1) : 0;
        const normalizedMaxSubCategories = Number(raw.maxSubCategories ?? derivedMaxSubCategories ?? 0);
        const paidFallbackSubCategories =
            Number(raw.maxListings || 0) > 1 && normalizedMaxSubCategories <= 0 && maxCategories <= 0
                ? 3
                : normalizedMaxSubCategories;

        return {
            ...raw,
            maxListings: Number(raw.maxListings || 0) <= 1 ? 999 : Number(raw.maxListings || 0),
            maxSubCategories: paidFallbackSubCategories,
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
        };
    }

    private async resolvePlanFeatures(vendorId: string) {
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
        const modern = this.normalizeModernPlanFeatures((activeNewPlan?.plan?.features as Record<string, unknown>) || {});
        return { ...legacy, ...modern };
    }

    private normalizeText(value?: string | null): string {
        return (value || '')
            .toLowerCase()
            .normalize('NFKD')
            .replace(/[^\w\s]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
    }

    private similarity(a: string, b: string): number {
        if (!a || !b) return 0;
        if (a === b) return 1;
        const aTokens = new Set(a.split(' '));
        const bTokens = new Set(b.split(' '));
        const intersection = [...aTokens].filter((x) => bTokens.has(x)).length;
        const union = new Set([...aTokens, ...bTokens]).size;
        return union > 0 ? intersection / union : 0;
    }

    async getQuestions(): Promise<BusinessQuestion[]> {
        const questions = await this.questionRepository.find({
            where: { isActive: true },
            order: { order: 'ASC', category: 'ASC' },
        });

        if (questions.length === 0) {
            this.logger.log('No questions found in database, returning fallbacks.');
            // Doc3 fallback questions for structured multi-select steps.
            return [
                {
                    id: 'type-1',
                    category: 'Business Type',
                    question: 'Where does your business operate?',
                    options: ['Physical Location', 'Home-Based Business', 'Online / Digital Only', 'On-Site at Client Location', 'Mobile Unit'],
                    isActive: true,
                    order: 1,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
                {
                    id: 'nature-1',
                    category: 'Core Business Nature',
                    question: 'What does your business primarily do?',
                    options: ['We sell physical products', 'We sell digital products', 'We provide in-person services', 'We provide online or remote services', 'We offer delivery to customers'],
                    isActive: true,
                    order: 2,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
                {
                    id: 'ops-1',
                    category: 'Operational Structure',
                    question: 'How does your business operate?',
                    options: ['Manufacturer', 'Retailer', 'Wholesaler', 'Distributor', 'Consulting / Advisory', 'Repair & Maintenance', 'Individual / Freelancer', 'Private Company'],
                    isActive: true,
                    order: 3,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
                {
                    id: 'serve-1',
                    category: 'Who Do You Serve',
                    question: 'Who are your primary customers?',
                    options: ['B2C - Individual Consumers', 'B2B - Other Businesses', 'B2G - Government & Public Sector', 'D2C - Direct to Consumer', 'Wholesale Buyers', 'International Clients'],
                    isActive: true,
                    order: 4,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
                {
                    id: 'social-1',
                    category: 'Website & Social Media',
                    question: 'Where else can customers find you online?',
                    options: ['Website', 'Facebook', 'Instagram', 'YouTube', 'LinkedIn', 'TikTok', 'X / Twitter', 'Pinterest', 'Snapchat'],
                    isActive: true,
                    order: 8,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
                {
                    id: 'contact-1',
                    category: 'Contact Details',
                    question: 'How can customers reach you?',
                    options: ['Primary Phone', 'WhatsApp Number', 'Additional Phone Numbers (up to 5 on paid plan)', 'Business Email', 'Website URL'],
                    isActive: true,
                    order: 5,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
                {
                    id: 'hours-1',
                    category: 'Business Hours',
                    question: 'When are you open?',
                    options: ['Monday Open', 'Tuesday Open', 'Wednesday Open', 'Thursday Open', 'Friday Open', 'Saturday Open', 'Sunday Open', 'Open 24/7'],
                    isActive: true,
                    order: 6,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
                {
                    id: 'desc-1',
                    category: 'Business Description',
                    question: 'Tell customers about your business',
                    options: ['Business Description Added', 'Business Languages Added'],
                    isActive: true,
                    order: 7,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
                {
                    id: 'team-1',
                    category: 'Experience & Team',
                    question: 'Tell us about your business maturity and team size',
                    options: ['Year Established Added', 'Just Me (Solo)', '2-5 Employees', '6-10 Employees', '11-25 Employees', '26-50 Employees', '51+ Employees'],
                    isActive: true,
                    order: 8,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
                {
                    id: 'keywords-1',
                    category: 'Keywords',
                    question: 'Add keywords that describe your business',
                    options: ['Local Service', 'Professional', 'Trusted', 'Affordable', 'Emergency', 'Premium', 'Family Friendly', 'Fast Response', 'Certified', '24/7'],
                    isActive: true,
                    order: 10,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
                {
                    id: 'faqs-1',
                    category: 'FAQs',
                    question: 'Add FAQs to help customers quickly',
                    options: ['Pricing FAQ Added', 'Service Area FAQ Added', 'Opening Hours FAQ Added', 'Appointment FAQ Added', 'Payment Methods FAQ Added'],
                    isActive: true,
                    order: 11,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
                {
                    id: 'media-1',
                    category: 'Logo & Cover Image',
                    question: 'Upload profile media for your business',
                    options: ['Logo (Recommended 400x400)', 'Cover Image (Recommended 1200x400)', 'Gallery Images Added', 'Album Grouping Enabled'],
                    isActive: true,
                    order: 12,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
                {
                    id: 'amenities-1',
                    category: 'Amenities & Facilities',
                    question: 'What does your location offer?',
                    options: ['Physical Location', 'Online Business', 'Delivery Available', '24/7 Open', 'Free Wi-Fi', 'Parking Available', 'Wheelchair Accessible', 'Female Staff Available', 'Home Service', 'In-store / Studio', 'Online / Virtual', 'Emergency Services', 'Cash Accepted', 'Card Accepted', 'Bank Transfer', 'Mobile Wallet', 'Online Payment'],
                    isActive: true,
                    order: 13,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
                {
                    id: 'industry-1',
                    category: 'Industry Sub-Type',
                    question: 'Does your business fall into specialised sectors?',
                    options: ['Factory', 'Manufacturing Unit', 'Industrial Supplier', 'Warehouse', 'Seed Store', 'Dairy Farm', 'Poultry Farm', 'Agricultural Equipment'],
                    isActive: true,
                    order: 14,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
                {
                    id: 'expansion-1',
                    category: 'Business Opportunities & Expansion',
                    question: 'Do you offer expansion or partnership opportunities?',
                    options: ['Franchise Opportunities', 'Dealers / Resellers Needed', 'Importer / Exporter', 'Local Service Area', 'National Service Area', 'International Service Area'],
                    isActive: true,
                    order: 15,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
                {
                    id: 'map-1',
                    category: 'Map Confirmation',
                    question: 'Confirm your location on map',
                    options: ['Pin Confirmed'],
                    isActive: true,
                    order: 16,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                }
            ] as BusinessQuestion[];
        }

        // Normalize legacy category names so Payment Methods / Service Mode
        // remain part of the consolidated Amenities & Facilities step.
        const normalized = questions.map((q) => {
            if (q.category === 'Payment Methods' || q.category === 'Service Mode') {
                return { ...q, category: 'Amenities & Facilities' };
            }
            return q;
        });

        // Preserve strict Doc3 step ordering for categories, then question order.
        const orderMap = new Map(
            BusinessSetupService.DOC3_CATEGORY_ORDER.map((cat, idx) => [cat, idx]),
        );
        return normalized.sort((a, b) => {
            const aOrder = orderMap.get(a.category) ?? Number.MAX_SAFE_INTEGER;
            const bOrder = orderMap.get(b.category) ?? Number.MAX_SAFE_INTEGER;
            if (aOrder !== bOrder) return aOrder - bOrder;
            return (a.order || 0) - (b.order || 0);
        });
    }

    async getSetupStatus(userId: string): Promise<{ isCompleted: boolean; answers: Record<string, string[]> }> {
        const vendor = await this.vendorRepository.findOne({ where: { userId } });
        if (!vendor) return { isCompleted: false, answers: {} };

        const savedAttributes = await this.attributeRepository.find({ where: { vendorId: vendor.id } });
        
        const answers: Record<string, string[]> = {};
        savedAttributes.forEach(attr => {
            if (!answers[attr.attributeKey]) {
                answers[attr.attributeKey] = [];
            }
            answers[attr.attributeKey].push(attr.attributeValue);
        });

        // Doc3: setup completion requires required legal consent as well.
        // Keep existing minimum answered-attributes guard to avoid false positives.
        const categories = new Set<string>();
        savedAttributes.forEach(attr => {
            if (!['city', 'state', 'country'].includes(attr.attributeKey)) {
                categories.add(attr.attributeKey);
            }
        });

        const hasRequiredConsent = savedAttributes.some((attr) =>
            attr.attributeKey === 'legalConsentAccepted' && String(attr.attributeValue).toLowerCase() === 'true'
        );

        return { 
            isCompleted: categories.size >= 3 && hasRequiredConsent,
            answers 
        };
    }

    async saveAnswers(
        userId: string,
        dto: SaveAnswersDto,
        requestMeta?: { ipAddress?: string },
    ): Promise<{ success: boolean }> {
        const vendor = await this.vendorRepository.findOne({ where: { userId } });
        if (!vendor) {
            throw new BadRequestException('Vendor profile not found');
        }

        const { answers } = dto;
        const vendorId = vendor.id;
        const normalizedAnswers: Record<string, string | string[]> = { ...answers };

        const features = await this.resolvePlanFeatures(vendorId);
        const maxKeywords = Number(features.maxKeywords ?? 0);
        const maxFaqs = Number(features.maxFaqs ?? 0);

        const keywordValues = normalizedAnswers.metaKeywords;
        const keywordCount = Array.isArray(keywordValues)
            ? keywordValues.filter(Boolean).length
            : String(keywordValues || '').split(',').map((k) => k.trim()).filter(Boolean).length;
        if (keywordCount > maxKeywords) {
            throw new BadRequestException(`Your plan allows up to ${maxKeywords} keywords. Please upgrade to add more.`);
        }

        const faqRaw = normalizedAnswers.faqs?.[0] || normalizedAnswers.faqs;
        if (faqRaw) {
            try {
                const parsed = typeof faqRaw === 'string' ? JSON.parse(faqRaw) : faqRaw;
                if (Array.isArray(parsed) && parsed.length > maxFaqs) {
                    throw new BadRequestException(`Your plan allows up to ${maxFaqs} FAQs. Please upgrade to add more.`);
                }
            } catch (err) {
                if (err instanceof BadRequestException) throw err;
            }
        }

        // Legal requirement: capture IP at consent submit time from trusted request context.
        if (
            String((answers as any).legalConsentTerms?.[0] || (answers as any).legalConsentTerms || '').toLowerCase() === 'true' &&
            requestMeta?.ipAddress
        ) {
            normalizedAnswers.legalConsentIpAddress = [requestMeta.ipAddress];
        }

        // Atomic update: Delete old answers for the keys being updated and insert new ones
        // In a real production system, you might want to wrap this in a transaction
        for (const [key, value] of Object.entries(normalizedAnswers)) {
            // Delete existing for this key
            await this.attributeRepository.delete({ vendorId, attributeKey: key });

            // Insert new ones
            if (Array.isArray(value)) {
                const attributes = value.map(val => this.attributeRepository.create({
                    vendorId,
                    attributeKey: key,
                    attributeValue: val,
                }));
                await this.attributeRepository.save(attributes);
            } else if (value) {
                const attribute = this.attributeRepository.create({
                    vendorId,
                    attributeKey: key,
                    attributeValue: value,
                });
                await this.attributeRepository.save(attribute);
            }
        }

        const legalConsentAccepted = String(
            (normalizedAnswers as any).legalConsentAccepted?.[0] ||
            (normalizedAnswers as any).legalConsentAccepted ||
            ''
        ).toLowerCase() === 'true';

        if (legalConsentAccepted) {
            const acceptedAtValue =
                (normalizedAnswers as any).legalConsentAcceptedAt?.[0] ||
                (normalizedAnswers as any).legalConsentAcceptedAt;
            const acceptedAt = acceptedAtValue ? new Date(String(acceptedAtValue)) : new Date();
            const retentionUntil = new Date(acceptedAt);
            retentionUntil.setFullYear(retentionUntil.getFullYear() + 7);

            await this.consentLogRepository.save(
                this.consentLogRepository.create({
                    userId,
                    vendorId,
                    listingId: null,
                    source: 'business_setup',
                    acceptedAt,
                    termsAccepted: String((normalizedAnswers as any).legalConsentTerms?.[0] || (normalizedAnswers as any).legalConsentTerms || '').toLowerCase() === 'true',
                    privacyAccepted: String((normalizedAnswers as any).legalConsentPrivacy?.[0] || (normalizedAnswers as any).legalConsentPrivacy || '').toLowerCase() === 'true',
                    moderationAccepted: String((normalizedAnswers as any).legalConsentModeration?.[0] || (normalizedAnswers as any).legalConsentModeration || '').toLowerCase() === 'true',
                    accuracyConfirmed: String((normalizedAnswers as any).legalConsentAccuracy?.[0] || (normalizedAnswers as any).legalConsentAccuracy || '').toLowerCase() === 'true',
                    publicLocationConsent: String((normalizedAnswers as any).legalConsentPublicLocation?.[0] || (normalizedAnswers as any).legalConsentPublicLocation || '').toLowerCase() === 'true',
                    marketingUpdatesConsent: String((normalizedAnswers as any).legalConsentMarketing?.[0] || (normalizedAnswers as any).legalConsentMarketing || '').toLowerCase() === 'true',
                    termsVersion: String((normalizedAnswers as any).termsVersion?.[0] || (normalizedAnswers as any).termsVersion || 'v1'),
                    privacyVersion: String((normalizedAnswers as any).privacyVersion?.[0] || (normalizedAnswers as any).privacyVersion || 'v1'),
                    sessionId: String((normalizedAnswers as any).legalConsentSessionId?.[0] || (normalizedAnswers as any).legalConsentSessionId || ''),
                    deviceId: String((normalizedAnswers as any).legalConsentDeviceId?.[0] || (normalizedAnswers as any).legalConsentDeviceId || ''),
                    ipAddress: String((normalizedAnswers as any).legalConsentIpAddress?.[0] || (normalizedAnswers as any).legalConsentIpAddress || requestMeta?.ipAddress || ''),
                    retentionUntil,
                    payload: normalizedAnswers,
                }),
            );
        }

        return { success: true };
    }

    async checkDuplicate(userId: string, dto: DuplicateCheckDto): Promise<{
        showPrompt: boolean;
        signals: Array<'gps' | 'name' | 'phone' | 'address'>;
        matchCount: number;
    }> {
        const vendor = await this.vendorRepository.findOne({ where: { userId } });
        if (!vendor) {
            throw new BadRequestException('Vendor profile not found');
        }

        const signals = new Set<'gps' | 'name' | 'phone' | 'address'>();
        const normalizedPhone = normalizeGlobalPhone(dto.phone) || dto.phone;

        // 1. Phone — exact match (fast index lookup)
        if (normalizedPhone) {
            const phoneRows = await this.listingRepository
                .createQueryBuilder('l')
                .select('l.id')
                .where('l.phone = :phone AND l.vendorId != :vendorId', {
                    phone: normalizedPhone,
                    id: randomUUID(),
                    vendorId: vendor.id,
                })
                .limit(1)
                .getMany();
            if (phoneRows.length > 0) signals.add('phone');
        }

        // 2. GPS — PostGIS ST_DWithin within 10 metres (with earthdistance fallback)
        if (dto.latitude && dto.longitude) {
            try {
                const gpsRows = await this.listingRepository
                    .createQueryBuilder('l')
                    .select('l.id')
                    .where('l.vendorId != :vendorId', { vendorId: vendor.id })
                    .andWhere(
                        `l.location IS NOT NULL AND ST_DWithin(
                            l.location::geography,
                            ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography,
                            10
                        )`,
                        { lat: Number(dto.latitude), lng: Number(dto.longitude) },
                    )
                    .limit(1)
                    .getMany();
                if (gpsRows.length > 0) signals.add('gps');
            } catch (err) {
                // PostGIS not available — fallback to earthdistance
                try {
                    const gpsRows = await this.listingRepository
                        .createQueryBuilder('l')
                        .select('l.id')
                        .where('l.vendorId != :vendorId', { vendorId: vendor.id })
                        .andWhere('l.latitude IS NOT NULL AND l.longitude IS NOT NULL')
                        .andWhere(
                            'earth_distance(ll_to_earth(l.latitude, l.longitude), ll_to_earth(:lat, :lng)) <= 10',
                            { lat: Number(dto.latitude), lng: Number(dto.longitude) }
                        )
                        .limit(1)
                        .getMany();
                    if (gpsRows.length > 0) signals.add('gps');
                } catch (fallbackErr) {
                    // silently ignore if both fail
                }
            }
        }

        // 3. Name similarity — pg_trgm (80%+), fallback to JS Jaccard if pg_trgm unavailable
        if (dto.businessName) {
            try {
                const nameRows = await this.listingRepository
                    .createQueryBuilder('l')
                    .select('l.id')
                    .where('l.vendorId != :vendorId', { vendorId: vendor.id })
                    .andWhere('similarity(l.title, :name) >= 0.8', { name: dto.businessName })
                    .limit(1)
                    .getMany();
                if (nameRows.length > 0) signals.add('name');
            } catch {
                // Fallback: JS Jaccard
                const normalizedName = this.normalizeText(dto.businessName);
                const sample = await this.listingRepository.find({
                    where: dto.city ? { city: dto.city } : undefined,
                    take: 150,
                });
                if (sample.some(c => c.vendorId !== vendor.id && this.similarity(normalizedName, this.normalizeText(c.title)) >= 0.8)) {
                    signals.add('name');
                }
            }
        }

        // 4. Address similarity — pg_trgm (85%+), fallback to JS Jaccard
        const normalizedAddr = `${dto.address || ''} ${dto.city || ''} ${dto.state || ''}`.trim();
        if (normalizedAddr) {
            try {
                const addrRows = await this.listingRepository
                    .createQueryBuilder('l')
                    .select('l.id')
                    .where('l.vendorId != :vendorId', { vendorId: vendor.id })
                    .andWhere(
                        `similarity(
                            LOWER(CONCAT(COALESCE(l.address,''), ' ', COALESCE(l.city,''), ' ', COALESCE(l.state,''))),
                            LOWER(:addr)
                        ) >= 0.85`,
                        { addr: normalizedAddr },
                    )
                    .limit(1)
                    .getMany();
                if (addrRows.length > 0) signals.add('address');
            } catch {
                // Fallback: JS Jaccard
                const normalizedAddrNorm = this.normalizeText(normalizedAddr);
                const sample = await this.listingRepository.find({
                    where: dto.city ? { city: dto.city } : undefined,
                    take: 150,
                });
                if (sample.some(c =>
                    c.vendorId !== vendor.id &&
                    this.similarity(normalizedAddrNorm, this.normalizeText(`${c.address || ''} ${c.city || ''} ${c.state || ''}`)) >= 0.85,
                )) {
                    signals.add('address');
                }
            }
        }

        const matchCount = signals.size;
        return {
            showPrompt: matchCount >= 2,
            signals: Array.from(signals),
            matchCount,
        };
    }
}
