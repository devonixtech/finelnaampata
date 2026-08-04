import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn
} from 'typeorm';
import { Affiliate } from './affiliate.entity';
import { User } from './user.entity';

export enum CommissionStatus {
    PENDING = 'pending',           // Initial state (in 30 day wait period)
    PENDING_APPROVAL = 'pending_approval', // 30 days passed, waiting for manual admin approval
    APPROVED = 'approved',         // Approved by admin, ready to be paid
    REJECTED = 'rejected',         // Rejected by admin
    PAID = 'paid',                 // Payment sent to affiliate
    REVERSED = 'reversed'          // Reversed due to refund/chargeback
}

@Entity('commissions')
export class Commission {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'affiliate_id', type: 'uuid' })
    affiliateId: string;

    @ManyToOne(() => Affiliate, affiliate => affiliate.commissions)
    @JoinColumn({ name: 'affiliate_id' })
    affiliate: Affiliate;

    @Column({ name: 'referred_user_id', type: 'uuid' })
    referredUserId: string;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'referred_user_id' })
    referredUser: User;

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    amount: number;

    @Column({
        type: 'varchar',
        length: 20,
        default: CommissionStatus.PENDING
    })
    status: CommissionStatus;

    @Column({ name: 'eligible_at', type: 'timestamp' })
    eligibleAt: Date;

    @Column({ name: 'ip_address', nullable: true, length: 45 })
    ipAddress: string;

    @Column({ name: 'device_id', nullable: true, length: 255 })
    deviceId: string;

    @Column({ name: 'admin_notes', nullable: true, type: 'text' })
    adminNotes: string;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}
