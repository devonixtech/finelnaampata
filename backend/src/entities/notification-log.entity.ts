import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    ManyToOne,
    JoinColumn,
    Index,
} from 'typeorm';
import { Vendor } from './vendor.entity';

@Entity('notification_logs')
export class NotificationLog {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'vendor_id', type: 'uuid', nullable: true })
    @Index()
    vendorId: string;

    @Column({ name: 'search_log_id', type: 'uuid', nullable: true })
    searchLogId: string;

    @Column({ nullable: true })
    @Index()
    keyword: string;

    @Column({ default: 'sent' })
    status: string;

    @CreateDateColumn({ name: 'sent_at' })
    @Index()
    sentAt: Date;

    // Relations
    @ManyToOne(() => Vendor, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'vendor_id' })
    vendor: Vendor;
}
