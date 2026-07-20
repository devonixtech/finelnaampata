import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    ManyToOne,
    JoinColumn,
    Index,
} from 'typeorm';
import { Affiliate } from './affiliate.entity';
import { User } from './user.entity';

export enum ReferralType {
    SUBSCRIPTION = 'subscription',
    SIGNUP = 'signup',
}

export enum ReferralStatus {
    PENDING = 'pending',
    CONVERTED = 'converted',
    EXPIRED = 'expired',
}

@Entity('affiliate_referrals')
export class AffiliateReferral {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'affiliate_id', nullable: true })
    @Index()
    affiliateId: string;

    @Column({ name: 'referred_user_id', nullable: true })
    @Index()
    referredUserId: string;

    @Column({
        type: 'enum',
        enum: ReferralType,
        nullable: true,
    })
    type: ReferralType;

    @Column({
        type: 'enum',
        enum: ReferralStatus,
        default: ReferralStatus.PENDING,
    })
    status: ReferralStatus;

    @Column({ name: 'commission_amount', type: 'decimal', precision: 10, scale: 2, default: 0 })
    commissionAmount: number;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    // Relations
    @ManyToOne(() => Affiliate, (affiliate) => affiliate.referrals)
    @JoinColumn({ name: 'affiliate_id' })
    affiliate: Affiliate;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'referred_user_id' })
    referredUser: User;
}
