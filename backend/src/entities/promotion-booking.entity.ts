import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
    Index,
} from 'typeorm';
import { Vendor } from './vendor.entity';
import { OfferEvent, OfferType } from './offer-event.entity';
import { Deal } from './deal.entity';
import { Event } from './event.entity';

export enum BookingStatus {
    PENDING = 'pending',
    ACTIVE = 'active',
    EXPIRED = 'expired',
    CANCELLED = 'cancelled',
}

@Entity('promotion_bookings')
export class PromotionBooking {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'vendor_id', type: 'uuid' })
    @Index()
    vendorId: string;

    @Column({ name: 'offer_event_id', type: 'uuid', nullable: true })
    @Index()
    offerEventId: string;

    @Column({ name: 'deal_id', type: 'uuid', nullable: true })
    @Index()
    dealId: string;

    @Column({ name: 'event_id', type: 'uuid', nullable: true })
    @Index()
    eventId: string;

    @Column({
        type: 'enum',
        enum: OfferType,
        default: OfferType.OFFER,
    })
    type: OfferType;

    @Column({ type: 'jsonb', default: '[]' })
    placements: string[]; // e.g., ['homepage', 'category']

    @Column({ name: 'start_time', type: 'timestamp' })
    startTime: Date;

    @Column({ name: 'end_time', type: 'timestamp' })
    endTime: Date;

    @Column({ name: 'duration_hours', type: 'int' })
    durationHours: number;

    @Column({ name: 'total_price', type: 'decimal', precision: 10, scale: 2 })
    totalPrice: number;

    @Column({
        type: 'enum',
        enum: BookingStatus,
        default: BookingStatus.PENDING,
    })
    @Index()
    status: BookingStatus;

    @Column({ name: 'stripe_session_id', nullable: true })
    stripeSessionId: string;

    @Column({ name: 'payment_intent_id', nullable: true })
    paymentIntentId: string;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;

    // Relations
    @ManyToOne(() => Vendor, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'vendor_id' })
    vendor: Vendor;

    @ManyToOne(() => OfferEvent, { onDelete: 'CASCADE', nullable: true })
    @JoinColumn({ name: 'offer_event_id' })
    offerEvent: OfferEvent;

    @ManyToOne(() => Deal, { onDelete: 'CASCADE', nullable: true })
    @JoinColumn({ name: 'deal_id' })
    deal: Deal;

    @ManyToOne(() => Event, { onDelete: 'CASCADE', nullable: true })
    @JoinColumn({ name: 'event_id' })
    event: Event;
}
