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
import { Exclude } from 'class-transformer';
import { Listing } from './business.entity';
import { User } from './user.entity';
import { ReviewHelpfulVote } from './review-helpful-vote.entity';
import { ReviewReply } from './review-reply.entity';

@Entity('reviews')
export class Review {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'business_id', type: 'uuid', nullable: true })
    @Index()
    businessId: string;

    @Column({ name: 'user_id', type: 'uuid', nullable: true })
    @Index()
    userId: string;

    @Column({ type: 'int', nullable: true })
    @Index()
    rating: number;

    @Column({ nullable: true })
    title: string;

    @Column({ nullable: true, type: 'text' })
    comment: string;

    @Column({ type: 'jsonb', default: '[]' })
    images: string[];

    @Column({ name: 'helpful_count', default: 0 })
    helpfulCount: number;

    @Column({ name: 'is_verified_purchase', default: false })
    isVerifiedPurchase: boolean;

    @Column({ name: 'is_approved', default: true })
    @Index()
    isApproved: boolean;

    @Column({ name: 'is_suspicious', default: false })
    @Index()
    isSuspicious: boolean;

    @Column({ name: 'suspicion_score', type: 'float', default: 0 })
    suspicionScore: number;

    @Column({ name: 'suspicion_reason', nullable: true, type: 'text' })
    suspicionReason: string;

    @Column({ name: 'ip_address', nullable: true })
    @Index()
    ipAddress: string;

    @Column({ name: 'vendor_response', nullable: true, type: 'text' })
    vendorResponse: string;

    @Column({ name: 'vendor_response_at', nullable: true, type: 'timestamp' })
    vendorResponseAt: Date;

    @CreateDateColumn({ name: 'created_at' })
    @Index()
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;

    // Relations
    @ManyToOne(() => Listing, (listing) => listing.reviews)
    @JoinColumn({ name: 'business_id' })
    business: Listing;

    @ManyToOne(() => User, (user) => user.reviews)
    @JoinColumn({ name: 'user_id' })
    user: User;

    @OneToMany(() => ReviewHelpfulVote, (vote) => vote.review)
    helpfulVotes: ReviewHelpfulVote[];

    @OneToMany(() => ReviewReply, (reply) => reply.review)
    replies: ReviewReply[];
}
