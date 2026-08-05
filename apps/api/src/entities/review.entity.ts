import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { Business } from './business.entity';
import { User } from './user.entity';

@Entity('reviews')
export class Review {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'business_id', type: 'uuid' })
    businessId: string;

    @ManyToOne(() => Business)
    @JoinColumn({ name: 'business_id' })
    business: Business;

    @Column({ name: 'user_id', type: 'uuid' })
    userId: string;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'user_id' })
    user: User;

    @Column({ type: 'integer' })
    rating: number;

    @Column({ type: 'varchar', length: 255, nullable: true })
    title: string;

    @Column({ type: 'text', nullable: true })
    comment: string;

    @Column({ type: 'jsonb', nullable: true })
    images: any;

    @Column({ name: 'is_verified', default: false })
    isVerified: boolean;

    @Column({ name: 'is_approved', default: false })
    isApproved: boolean;

    @Column({ name: 'is_suspicious', default: false })
    isSuspicious: boolean;

    @Column({ name: 'suspicion_score', type: 'integer', default: 0 })
    suspicionScore: number;

    @Column({ name: 'suspicion_reason', type: 'text', nullable: true })
    suspicionReason: string;

    @Column({ name: 'helpful_count', default: 0 })
    helpfulCount: number;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @Column({ name: 'ip_address', nullable: true, length: 45 })
    ipAddress: string;

    @Column({ name: 'device_id', nullable: true, length: 255 })
    deviceId: string;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}
