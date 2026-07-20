import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
    Index,
    BeforeInsert,
    BeforeUpdate,
} from 'typeorm';
import { Vendor } from './vendor.entity';
import { Listing } from './business.entity';

export enum DealStatus {
    SCHEDULED = 'scheduled',
    ACTIVE = 'active',
    EXPIRED = 'expired',
}

@Entity('deals')
export class Deal {
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
        type: 'varchar',
        length: 50,
        default: DealStatus.ACTIVE,
    })
    @Index()
    status: DealStatus;

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

    // Auto-compute status based on dates
    @BeforeInsert()
    @BeforeUpdate()
    computeStatus() {
        const now = new Date();
        const start = this.startDate ? new Date(this.startDate) : null;
        const expiry = this.expiryDate ? new Date(this.expiryDate) : null;
        const end = this.endDate ? new Date(this.endDate) : null;

        if (start && now < start) {
            this.status = DealStatus.SCHEDULED;
        } else if ((expiry && now > expiry) || (end && now > end)) {
            this.status = DealStatus.EXPIRED;
        } else {
            this.status = DealStatus.ACTIVE;
        }
    }
}
