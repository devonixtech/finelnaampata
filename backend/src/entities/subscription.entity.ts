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
} from 'typeorm';
import { Vendor } from './vendor.entity';
import { SubscriptionPlan } from './subscription-plan.entity';
import { Transaction } from './transaction.entity';

export enum SubscriptionStatus {
    ACTIVE = 'active',
    CANCELLED = 'cancelled',
    EXPIRED = 'expired',
    SUSPENDED = 'suspended',
}

@Entity('subscriptions')
export class Subscription {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'vendor_id', type: 'uuid', nullable: true })
    @Index()
    vendorId: string;

    @Column({ name: 'plan_id', type: 'uuid', nullable: true })
    @Index()
    planId: string;

    @Column({
        type: 'enum',
        enum: SubscriptionStatus,
        default: SubscriptionStatus.ACTIVE,
    })
    @Index()
    status: SubscriptionStatus;

    // Billing
    @Column({ name: 'start_date', type: 'date', nullable: true })
    startDate: Date;

    @Column({ name: 'end_date', type: 'date', nullable: true })
    @Index()
    endDate: Date;

    @Column({ name: 'auto_renew', default: true })
    autoRenew: boolean;

    // Payment
    @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
    amount: number;

    @Column({ length: 3, default: 'INR' })
    currency: string;

    // Metadata
    @Column({ name: 'cancelled_at', nullable: true, type: 'timestamp' })
    cancelledAt: Date;

    @Column({ name: 'cancellation_reason', nullable: true, type: 'text' })
    cancellationReason: string;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;

    // Relations
    @ManyToOne(() => Vendor, (vendor) => vendor.subscriptions)
    @JoinColumn({ name: 'vendor_id' })
    vendor: Vendor;

    @ManyToOne(() => SubscriptionPlan, (plan) => plan.subscriptions, { onDelete: 'SET NULL', nullable: true })
    @JoinColumn({ name: 'plan_id' })
    plan: SubscriptionPlan;

    @OneToMany(() => Transaction, (transaction) => transaction.subscription)
    transactions: Transaction[];
}
