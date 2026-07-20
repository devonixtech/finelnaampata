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
import { Exclude } from 'class-transformer';
import { Review } from './review.entity';
import { User } from './user.entity';

@Entity('review_replies')
export class ReviewReply {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'review_id', type: 'uuid', nullable: true })
    @Index()
    reviewId: string;

    @Column({ name: 'user_id', type: 'uuid', nullable: true })
    @Index()
    userId: string;

    @Column({ type: 'text', nullable: true })
    content: string;

    @Column({ name: 'is_approved', default: true })
    @Index()
    isApproved: boolean;

    @CreateDateColumn({ name: 'created_at' })
    @Index()
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;

    // Relations
    @Exclude()
    @ManyToOne(() => Review, (review) => review.replies, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'review_id' })
    review: Review;

    @ManyToOne(() => User, (user) => user.reviewReplies)
    @JoinColumn({ name: 'user_id' })
    user: User;
}
