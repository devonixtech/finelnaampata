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
import { PricingPlan } from './pricing-plan.entity';
import { Listing } from './business.entity';

export enum ActivePlanStatus {
    ACTIVE = 'active',
    EXPIRED = 'expired',
    CANCELLED = 'cancelled',
}

@Entity('active_plans')
@Index(['vendorId', 'status'])
@Index(['targetId', 'status'])
export class ActivePlan {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'vendor_id', type: 'uuid', nullable: true })
    vendorId: string;

    @Column({ name: 'plan_id', type: 'uuid', nullable: true })
    planId: string;

    @Column({ name: 'target_id', type: 'uuid', nullable: true })
    targetId: string; // The specific listing, offer, or event being promoted

    @Column({
        type: 'enum',
        enum: ActivePlanStatus,
        default: ActivePlanStatus.ACTIVE,
    })
    status: ActivePlanStatus;

    @Column({ name: 'start_date', type: 'timestamp', nullable: true })
    startDate: Date;

    @Column({ name: 'end_date', type: 'timestamp', nullable: true })
    endDate: Date;

    @Column({ name: 'amount_paid', type: 'decimal', precision: 10, scale: 2, nullable: true })
    amountPaid: number;

    @Column({ name: 'transaction_id', nullable: true, length: 255 })
    transactionId: string;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;

    // Relations
    @ManyToOne(() => Vendor, (vendor) => vendor.activePlans)
    @JoinColumn({ name: 'vendor_id' })
    vendor: Vendor;

    @ManyToOne(() => PricingPlan, (plan) => plan.activePlans, { nullable: true })
    @JoinColumn({ name: 'plan_id' })
    plan: PricingPlan;

    // Optional target listing (if appropriate for the plan type)
    @ManyToOne(() => Listing, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'target_id' })
    target: Listing;
}
