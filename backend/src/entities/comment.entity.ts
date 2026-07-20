import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    OneToOne,
    JoinColumn,
    Index,
} from 'typeorm';
import { User } from './user.entity';
import { Listing } from './business.entity';
import { CommentReply } from './comment-reply.entity';

export enum CommentStatus {
    VISIBLE = 'visible',
    HIDDEN = 'hidden',
    FLAGGED = 'flagged',
}

@Entity('comments')
export class Comment {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'user_id', nullable: true })
    @Index()
    userId: string;

    @Column({ name: 'business_id', nullable: true })
    @Index()
    businessId: string;

    @Column({ type: 'text', nullable: true })
    content: string;

    @Column({ type: 'int', nullable: true })
    rating: number;

    @Column({
        type: 'enum',
        enum: CommentStatus,
        default: CommentStatus.VISIBLE,
    })
    status: CommentStatus;

    @CreateDateColumn({ name: 'created_at' })
    @Index()
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;

    // Relations
    @ManyToOne(() => User, (user) => user.comments)
    @JoinColumn({ name: 'user_id' })
    user: User;

    @ManyToOne(() => Listing, (listing) => listing.comments)
    @JoinColumn({ name: 'business_id' })
    business: Listing;

    @OneToOne(() => CommentReply, (reply) => reply.comment)
    reply: CommentReply;
}
