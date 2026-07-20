import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { Affiliate } from './affiliate.entity';

export enum PayoutStatus {
    PENDING = 'pending',
    APPROVED = 'approved',
    REJECTED = 'rejected',
    PAID = 'paid',
}

@Entity('payouts')
export class Payout {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'affiliate_id', type: 'uuid', nullable: true })
    affiliateId: string;

    @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
    amount: number;

    @Column({ name: 'payment_method', length: 50, nullable: true })
    paymentMethod: string;

    @Column({ name: 'payment_details', type: 'text', nullable: true })
    paymentDetails: string;

    @Column({
        type: 'enum',
        enum: PayoutStatus,
        default: PayoutStatus.PENDING,
    })
    status: PayoutStatus;

    @Column({ name: 'admin_notes', type: 'text', nullable: true })
    adminNotes: string;

    @Column({ name: 'processed_at', type: 'timestamp', nullable: true })
    processedAt: Date;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;

    // Relations
    @ManyToOne(() => Affiliate, (affiliate) => affiliate.payouts)
    @JoinColumn({ name: 'affiliate_id' })
    affiliate: Affiliate;
}
