import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    OneToMany,
    JoinColumn,
    Index,
    BeforeInsert,
    BeforeUpdate,
} from 'typeorm';
import { Vendor } from './vendor.entity';
import { Listing } from './business.entity';
import { SavedOfferEvent } from './saved-offer-event.entity';

export enum OfferType {
    OFFER = 'offer',
    EVENT = 'event',
    PAGE = 'page',
}

export enum OfferStatus {
    SCHEDULED = 'scheduled',
    ACTIVE = 'active',
    EXPIRED = 'expired',
}

@Entity('offer_events')
export class OfferEvent {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'vendor_id', type: 'uuid', nullable: true })
    @Index()
    vendorId: string;

    @Column({ name: 'business_id', type: 'uuid', nullable: true })
    @Index()
    businessId: string;

    @Column({ nullable: true })
    title: string;

    @Column({ nullable: true, type: 'text' })
    description: string;

    @Column({
        type: 'enum',
        enum: OfferType,
        default: OfferType.OFFER,
    })
    type: OfferType;

    @Column({ name: 'offer_badge', nullable: true })
    offerBadge: string;

    @Column({ name: 'image_url', nullable: true })
    imageUrl: string;

    @Column({ name: 'start_date', type: 'timestamp', nullable: true })
    startDate: Date;

    @Column({ name: 'end_date', type: 'timestamp', nullable: true })
    endDate: Date;

    @Column({ name: 'expiry_date', type: 'timestamp', nullable: true })
    expiryDate: Date;

    @Column({
        type: 'enum',
        enum: OfferStatus,
        default: OfferStatus.ACTIVE,
    })
    @Index()
    status: OfferStatus;

    @Column({ name: 'is_active', default: true })
    isActive: boolean;

    @Column({ name: 'is_featured', default: false })
    @Index()
    isFeatured: boolean;

    @Column({ name: 'featured_until', type: 'timestamp', nullable: true })
    featuredUntil: Date;

    @Column({ type: 'jsonb', default: '[]' })
    @Index()
    placements: string[];

    @Column({ type: 'jsonb', nullable: true, default: '[]' })
    highlights: string[];

    @Column({ type: 'jsonb', nullable: true, default: '[]' })
    terms: string[];

    @Column({ name: 'pricing_id', type: 'uuid', nullable: true })
    @Index()
    pricingId: string;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;

    // Relations
    @ManyToOne(() => Vendor, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'vendor_id' })
    vendor: Vendor;

    @ManyToOne(() => Listing, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'business_id' })
    business: Listing;

    @OneToMany(() => SavedOfferEvent, (saved) => saved.offerEvent)
    savedByUsers: SavedOfferEvent[];

    // Auto-compute status based on dates
    @BeforeInsert()
    @BeforeUpdate()
    computeStatus() {
        const now = new Date();
        const start = this.startDate ? new Date(this.startDate) : null;
        const expiry = this.expiryDate ? new Date(this.expiryDate) : null;
        const end = this.endDate ? new Date(this.endDate) : null;

        if (start && now < start) {
            this.status = OfferStatus.SCHEDULED;
        } else if ((expiry && now > expiry) || (end && now > end)) {
            this.status = OfferStatus.EXPIRED;
        } else {
            this.status = OfferStatus.ACTIVE;
        }
    }
}
