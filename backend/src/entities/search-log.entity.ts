import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    ManyToOne,
    JoinColumn,
    Index,
} from 'typeorm';
import { User } from './user.entity';

@Entity('search_logs')
export class SearchLog {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ nullable: true })
    @Index()
    keyword: string;

    @Column({ name: 'normalized_keyword', nullable: true })
    @Index()
    normalizedKeyword: string;

    @Column({ name: 'user_id', type: 'uuid', nullable: true })
    @Index()
    userId: string;

    @CreateDateColumn({ name: 'searched_at' })
    @Index()
    searchedAt: Date;

    @Column({ nullable: true })
    @Index()
    city: string;

    @Column({ name: 'category_slug', nullable: true })
    categorySlug: string;

    @Column({ type: 'decimal', precision: 10, scale: 8, nullable: true })
    latitude: number;

    @Column({ type: 'decimal', precision: 11, scale: 8, nullable: true })
    longitude: number;

    @Column({ name: 'user_agent', nullable: true, type: 'text' })
    userAgent: string;

    @Column({ name: 'ip_address', nullable: true })
    ipAddress: string;

    @Column({ name: 'results_count', type: 'integer', default: 0 })
    resultsCount: number;

    // Relations
    @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'user_id' })
    user: User;
}
