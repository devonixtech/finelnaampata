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
import { User } from './user.entity';
import { Category } from './category.entity';
import { JobLeadResponse } from './job-lead-response.entity';

export enum JobLeadStatus {
    OPEN = 'open',
    BROADCASTED = 'broadcasted',
    RESPONDED = 'responded',
    CLOSED = 'closed',
}

@Entity('job_leads')
export class JobLead {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'user_id', type: 'uuid', nullable: true })
    @Index()
    userId: string;

    @Column({ name: 'category_id', type: 'uuid', nullable: true })
    @Index()
    categoryId: string;

    @Column({ nullable: true })
    title: string;

    @Column({ type: 'text', nullable: true })
    description: string;

    @Column({ nullable: true })
    city: string;

    @Column({ nullable: true })
    location: string;

    @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
    budget: number;

    @Column({ type: 'decimal', precision: 10, scale: 8, nullable: true })
    latitude: number;

    @Column({ type: 'decimal', precision: 11, scale: 8, nullable: true })
    longitude: number;

    @Column({
        type: 'enum',
        enum: JobLeadStatus,
        default: JobLeadStatus.OPEN,
    })
    @Index()
    status: JobLeadStatus;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;

    // Relations
    @ManyToOne(() => User)
    @JoinColumn({ name: 'user_id' })
    user: User;

    @ManyToOne(() => Category)
    @JoinColumn({ name: 'category_id' })
    category: Category;

    @OneToMany(() => JobLeadResponse, (response) => response.jobLead)
    responses: JobLeadResponse[];
}
