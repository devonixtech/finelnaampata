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
import { Subscription } from './subscription.entity';
import { Vendor } from './vendor.entity';

export enum PaymentStatus {
    PENDING = 'pending',
    COMPLETED = 'completed',
    FAILED = 'failed',
    REFUNDED = 'refunded',
}

@Entity('transactions')
export class Transaction {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'subscription_id', type: 'uuid', nullable: true })
    @Index()
    subscriptionId: string;

    @Column({ name: 'vendor_id', type: 'uuid', nullable: true })
    @Index()
    vendorId: string;

    // Payment Details
    @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
    amount: number;

    @Column({ length: 3, default: 'PKR' })
    currency: string;

    @Column({ name: 'payment_method', nullable: true, length: 50 })
    paymentMethod: string;

    @Column({ name: 'payment_gateway', nullable: true, length: 50 })
    paymentGateway: string;

    @Column({ name: 'gateway_transaction_id', nullable: true, length: 255 })
    gatewayTransactionId: string;

    @Column({ name: 'stripe_session_id', nullable: true, length: 255 })
    stripeSessionId: string;

    // Status
    @Column({
        type: 'enum',
        enum: PaymentStatus,
        default: PaymentStatus.PENDING,
    })
    @Index()
    status: PaymentStatus;

    // Invoice
    @Column({ name: 'invoice_number', nullable: true, unique: true, length: 255 })
    @Index()
    invoiceNumber: string;

    @Column({ name: 'invoice_url', nullable: true, type: 'text' })
    invoiceUrl: string;

    // Metadata
    @Column({ nullable: true, type: 'jsonb' })
    metadata: Record<string, any>;

    // Timestamps
    @Column({ name: 'paid_at', nullable: true, type: 'timestamp' })
    paidAt: Date;

    @Column({ name: 'failed_at', nullable: true, type: 'timestamp' })
    failedAt: Date;

    @Column({ name: 'refunded_at', nullable: true, type: 'timestamp' })
    refundedAt: Date;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;

    // Relations
    @ManyToOne(() => Subscription, (subscription) => subscription.transactions)
    @JoinColumn({ name: 'subscription_id' })
    subscription: Subscription;

    @ManyToOne(() => Vendor, (vendor) => vendor.transactions)
    @JoinColumn({ name: 'vendor_id' })
    vendor: Vendor;
}
