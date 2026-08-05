import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    ManyToOne,
    JoinColumn
} from 'typeorm';
import { Business } from './business.entity';

export enum AnalyticsEventType {
    IMPRESSION = 'impression',
    VIEW = 'view',
    CONTACT_CALL = 'contact_call',
    CONTACT_SMS = 'contact_sms',
    CONTACT_WHATSAPP = 'contact_whatsapp',
    CONTACT_WEBSITE = 'contact_website',
    CONVERSION_CHAT = 'conversion_chat',
    CONVERSION_ENQUIRY = 'conversion_enquiry'
}

@Entity('business_analytics')
export class BusinessAnalytics {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'business_id', type: 'uuid' })
    businessId: string;

    @ManyToOne(() => Business)
    @JoinColumn({ name: 'business_id' })
    business: Business;

    @Column({
        name: 'event_type',
        type: 'varchar',
        length: 30
    })
    eventType: AnalyticsEventType;

    @Column({ name: 'ip_address', nullable: true, length: 45 })
    ipAddress: string;

    @Column({ name: 'device_id', nullable: true, length: 255 })
    deviceId: string;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;
}
