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

    @Column({ default: 'active' })
    status: string;

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
