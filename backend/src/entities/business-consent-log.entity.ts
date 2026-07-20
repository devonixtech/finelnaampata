import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    Index,
} from 'typeorm';

export type BusinessConsentSource = 'business_setup' | 'listing_create';

@Entity('business_consent_logs')
export class BusinessConsentLog {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'user_id', type: 'uuid', nullable: true })
    @Index()
    userId: string | null;

    @Column({ name: 'vendor_id', type: 'uuid', nullable: true })
    @Index()
    vendorId: string;

    @Column({ name: 'listing_id', type: 'uuid', nullable: true })
    @Index()
    listingId: string | null;

    @Column({ length: 32, nullable: true })
    source: BusinessConsentSource;

    @Column({ name: 'accepted_at', type: 'timestamp', nullable: true })
    acceptedAt: Date;

    @Column({ name: 'terms_accepted', default: false })
    termsAccepted: boolean;

    @Column({ name: 'privacy_accepted', default: false })
    privacyAccepted: boolean;

    @Column({ name: 'moderation_accepted', default: false })
    moderationAccepted: boolean;

    @Column({ name: 'accuracy_confirmed', default: false })
    accuracyConfirmed: boolean;

    @Column({ name: 'public_location_consent', default: false })
    publicLocationConsent: boolean;

    @Column({ name: 'marketing_updates_consent', default: false })
    marketingUpdatesConsent: boolean;

    @Column({ name: 'terms_version', nullable: true, length: 50 })
    termsVersion: string | null;

    @Column({ name: 'privacy_version', nullable: true, length: 50 })
    privacyVersion: string | null;

    @Column({ name: 'session_id', nullable: true, length: 120 })
    sessionId: string | null;

    @Column({ name: 'device_id', nullable: true, length: 255 })
    deviceId: string | null;

    @Column({ name: 'ip_address', nullable: true, length: 120 })
    ipAddress: string | null;

    @Column({ name: 'retention_until', type: 'timestamp', nullable: true })
    retentionUntil: Date;

    @Column({ type: 'jsonb', default: {} })
    payload: Record<string, any>;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;
}
