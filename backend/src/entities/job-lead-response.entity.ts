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
import { JobLead } from './job-lead.entity';
import { Vendor } from './vendor.entity';

export enum JobResponseStatus {
    PENDING = 'pending',
    ACCEPTED = 'accepted',
    REJECTED = 'rejected',
}

@Entity('job_lead_responses')
export class JobLeadResponse {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'job_lead_id', type: 'uuid', nullable: true })
    @Index()
    jobLeadId: string;

    @Column({ name: 'vendor_id', type: 'uuid', nullable: true })
    @Index()
    vendorId: string;

    @Column({ type: 'text', nullable: true })
    message: string;

    @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
    price: number;

    @Column({
        type: 'enum',
        enum: JobResponseStatus,
        default: JobResponseStatus.PENDING,
    })
    @Index()
    status: JobResponseStatus;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;

    // Relations
    @ManyToOne(() => JobLead, (jobLead) => jobLead.responses)
    @JoinColumn({ name: 'job_lead_id' })
    jobLead: JobLead;

    @ManyToOne(() => Vendor)
    @JoinColumn({ name: 'vendor_id' })
    vendor: Vendor;
}
