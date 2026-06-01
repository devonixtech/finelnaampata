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
import { Listing } from './business.entity';
import { Lead } from './lead.entity';
import { User } from './user.entity';

@Entity('business_customer_notes')
export class BusinessCustomerNote {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'business_id', type: 'uuid' })
    @Index()
    businessId: string;

    @Column({ name: 'lead_id', type: 'uuid' })
    @Index()
    leadId: string;

    @Column({ name: 'created_by_id', type: 'uuid' })
    createdById: string;

    @Column({ type: 'text' })
    note: string;

    @CreateDateColumn({ name: 'created_at' })
    @Index()
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;

    // Relations
    @Exclude()
    @ManyToOne(() => Listing, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'business_id' })
    business: Listing;

    @Exclude()
    @ManyToOne(() => Lead, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'lead_id' })
    lead: Lead;

    @Exclude()
    @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
    @JoinColumn({ name: 'created_by_id' })
    createdBy: User;
}
