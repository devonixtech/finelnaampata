import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    OneToOne,
    JoinColumn,
    OneToMany,
    Index,
} from 'typeorm';
import { User } from './user.entity';
import { AffiliateReferral } from './referral.entity';
import { Payout } from './payout.entity';

export enum AffiliateStatus {
    ACTIVE = 'active',
    SUSPENDED = 'suspended',
    PENDING = 'pending',
}

export enum KycStatus {
    NONE = 'none',
    PENDING = 'pending',
    APPROVED = 'approved',
    REJECTED = 'rejected',
}

@Entity('affiliates')
export class Affiliate {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'user_id', nullable: true })
    @Index({ unique: true })
    userId: string;

    @Column({ name: 'referral_code', unique: true, nullable: true })
    @Index()
    referralCode: string;

    @Column({ name: 'total_earnings', type: 'decimal', precision: 10, scale: 2, default: 0 })
    totalEarnings: number;

    @Column({ name: 'total_withdrawals', type: 'decimal', precision: 10, scale: 2, default: 0 })
    totalWithdrawals: number;

    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    balance: number;

    @Column({ name: 'balance_held', type: 'decimal', precision: 10, scale: 2, default: 0 })
    balanceHeld: number;

    @Column({ name: 'referral_hold_days', type: 'int', default: 30 })
    referralHoldDays: number;

    @Column({ name: 'hold_until', type: 'timestamp', nullable: true })
    holdUntil: Date;

    @Column({ default: 'active' })
    status: string;

    @Column({ name: 'admin_approved', default: false })
    adminApproved: boolean;

    @Column({ name: 'admin_approved_at', type: 'timestamp', nullable: true })
    adminApprovedAt: Date;

    @Column({ name: 'admin_approved_by', nullable: true })
    adminApprovedBy: string;

    @Column({ name: 'kyc_status', default: 'none' })
    kycStatus: string;

    @Column({ name: 'kyc_document_url', nullable: true })
    kycDocumentUrl: string;

    @Column({ name: 'kyc_submitted_at', type: 'timestamp', nullable: true })
    kycSubmittedAt: Date;

    @Column({ name: 'kyc_reviewed_at', type: 'timestamp', nullable: true })
    kycReviewedAt: Date;

    @Column({ name: 'kyc_reviewed_by', nullable: true })
    kycReviewedBy: string;

    @Column({ nullable: true })
    address: string;

    @Column({ name: 'nic_number', nullable: true })
    nicNumber: string;

    @Column({ name: 'ip_address', nullable: true })
    ipAddress: string;

    @Column({ name: 'user_agent', type: 'text', nullable: true })
    userAgent: string;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;

    // Relations
    @OneToOne(() => User, (user) => user.affiliate)
    @JoinColumn({ name: 'user_id' })
    user: User;

    @OneToMany(() => AffiliateReferral, (referral) => referral.affiliate)
    referrals: AffiliateReferral[];

    @OneToMany(() => Payout, (payout) => payout.affiliate)
    payouts: Payout[];
}
