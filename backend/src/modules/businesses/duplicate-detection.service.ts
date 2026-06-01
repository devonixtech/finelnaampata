import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Listing } from '../../entities/business.entity';
import { CreateBusinessDto } from './dto/create-business.dto';
import { normalizeGlobalPhone } from '../../common/utils/phone.util';

type DuplicateSignalResult = {
    matches: number;
    signals: Array<'gps' | 'name' | 'phone' | 'address'>;
    candidateIds: string[];
};

@Injectable()
export class DuplicateDetectionService {
    private readonly logger = new Logger(DuplicateDetectionService.name);

    constructor(
        @InjectRepository(Listing)
        private readonly listingRepository: Repository<Listing>,
    ) {}

    async detect(createBusinessDto: CreateBusinessDto, vendorId: string): Promise<DuplicateSignalResult> {
        const normalizedPhone = normalizeGlobalPhone(createBusinessDto.phone) || createBusinessDto.phone;
        const normalizedAddress = `${createBusinessDto.address || ''} ${createBusinessDto.city || ''} ${createBusinessDto.state || ''}`.trim();

        const signals = new Set<'gps' | 'name' | 'phone' | 'address'>();
        const candidateIdsSet = new Set<string>();

        // 1. Phone match query (exact)
        if (normalizedPhone) {
            const phoneMatches = await this.listingRepository
                .createQueryBuilder('listing')
                .select('listing.id')
                .where('listing.phone = :phone AND listing.vendorId != :vendorId', { phone: normalizedPhone, vendorId })
                .getMany();

            if (phoneMatches.length > 0) {
                signals.add('phone');
                phoneMatches.forEach(m => candidateIdsSet.add(m.id));
            }
        }

        // 2. Coordinates match query (within 10m using PostGIS with earthdistance fallback)
        if (createBusinessDto.latitude && createBusinessDto.longitude) {
            try {
                const gpsMatches = await this.listingRepository
                    .createQueryBuilder('listing')
                    .select('listing.id')
                    .where('listing.vendorId != :vendorId', { vendorId })
                    .andWhere(
                        `ST_DWithin(
                            listing.location,
                            ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography,
                            10
                        )`,
                        { lat: Number(createBusinessDto.latitude), lng: Number(createBusinessDto.longitude) }
                    )
                    .getMany();

                if (gpsMatches.length > 0) {
                    signals.add('gps');
                    gpsMatches.forEach(m => candidateIdsSet.add(m.id));
                }
            } catch (err) {
                // Fallback to earthdistance if PostGIS is not available
                try {
                    const gpsMatches = await this.listingRepository
                        .createQueryBuilder('listing')
                        .select('listing.id')
                        .where('listing.vendorId != :vendorId', { vendorId })
                        .andWhere('listing.latitude IS NOT NULL AND listing.longitude IS NOT NULL')
                        .andWhere(
                            'earth_distance(ll_to_earth(listing.latitude, listing.longitude), ll_to_earth(:lat, :lng)) <= 10',
                            { lat: Number(createBusinessDto.latitude), lng: Number(createBusinessDto.longitude) }
                        )
                        .getMany();

                    if (gpsMatches.length > 0) {
                        signals.add('gps');
                        gpsMatches.forEach(m => candidateIdsSet.add(m.id));
                    }
                } catch (fallbackErr) {
                    this.logger.error('Failed both ST_DWithin and earthdistance queries: ' + fallbackErr.message);
                }
            }
        }

        // 3. Name similarity query (80%+) using pg_trgm similarity function
        if (createBusinessDto.title) {
            const nameMatches = await this.listingRepository
                .createQueryBuilder('listing')
                .select('listing.id')
                .where('listing.vendorId != :vendorId', { vendorId })
                .andWhere('similarity(listing.title, :title) >= 0.8', { title: createBusinessDto.title })
                .getMany();

            if (nameMatches.length > 0) {
                signals.add('name');
                nameMatches.forEach(m => candidateIdsSet.add(m.id));
            }
        }

        // 4. Address similarity query (85%+) using pg_trgm similarity function
        if (normalizedAddress) {
            const addressMatches = await this.listingRepository
                .createQueryBuilder('listing')
                .select('listing.id')
                .where('listing.vendorId != :vendorId', { vendorId })
                .andWhere(
                    `similarity(
                        LOWER(CONCAT(COALESCE(listing.address, ''), ' ', COALESCE(listing.city, ''), ' ', COALESCE(listing.state, ''))),
                        LOWER(:address)
                    ) >= 0.85`,
                    { address: normalizedAddress }
                )
                .getMany();

            if (addressMatches.length > 0) {
                signals.add('address');
                addressMatches.forEach(m => candidateIdsSet.add(m.id));
            }
        }

        const candidateIds = Array.from(candidateIdsSet);
        const result: DuplicateSignalResult = {
            matches: signals.size,
            signals: Array.from(signals),
            candidateIds,
        };

        if (result.matches >= 2) {
            this.logger.warn(
                `Potential duplicate listing detected with ${result.matches} signals (${result.signals.join(', ')})`,
            );
        }

        return result;
    }
}
