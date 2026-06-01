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
import { BusinessCustomerNote } from './business-customer-note.entity';

export enum LeadType {
    CALL = 'call',
    WHATSAPP = 'whatsapp',
    EMAIL = 'email',
    CHAT = 'chat',
    WEBSITE = 'website',
}

export enum LeadStatus {
    NEW = 'new',
    CONTACTED = 'contacted',
    CONVERTED = 'converted',
    LOST = 'lost',
}

@Entity('leads')
export class Lead {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'business_id', type: 'uuid' })
    @Index()
    businessId: string;

    @Column({ name: 'user_id', nullable: true, type: 'uuid' })
    @Index()
    userId: string;

    // Lead Info
    @Column({
        type: 'enum',
        enum: LeadType,
    })
    @Index()
    type: LeadType;

    @Column({
        type: 'enum',
        enum: LeadStatus,
        default: LeadStatus.NEW,
    })
    @Index()
    status: LeadStatus;

    // Contact Info (for non-authenticated users)
    @Column({ nullable: true })
    name: string;

    @Column({ nullable: true })
    email: string;

    @Column({ nullable: true, length: 20 })
    phone: string;

    @Column({ nullable: true, type: 'text' })
    message: string;

    // Metadata
    @Column({ nullable: true, length: 50 })
    source: string;

    @Column({ name: 'user_agent', nullable: true, type: 'text' })
    userAgent: string;

    @Column({ name: 'ip_address', nullable: true, type: 'inet' })
    ipAddress: string;

    @Column({ nullable: true, type: 'text' })
    referrer: string;

    // Tracking
    @Column({ name: 'contacted_at', nullable: true, type: 'timestamp' })
    contactedAt: Date;

    @Column({ name: 'converted_at', nullable: true, type: 'timestamp' })
    convertedAt: Date;

    @Column({ nullable: true, type: 'text' })
    notes: string;

    // Vendor reply to enquiry
    @Column({ name: 'vendor_reply', nullable: true, type: 'text' })
    vendorReply: string;

    @Column({ name: 'vendor_replied_at', nullable: true, type: 'timestamp' })
    vendorRepliedAt: Date;

    @Column({ name: 'is_read', default: false })
    isRead: boolean;

    @CreateDateColumn({ name: 'created_at' })
    @Index()
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;

    // Relations
    @Exclude()
    @ManyToOne(() => Listing, (listing) => listing.leads)
    @JoinColumn({ name: 'business_id' })
    business: Listing;

    @Exclude()
    @ManyToOne(() => User, (user) => user.leads)
    @JoinColumn({ name: 'user_id' })
    user: User;

    @OneToMany(() => BusinessCustomerNote, note => note.lead)
    customerNotes: BusinessCustomerNote[];
}
