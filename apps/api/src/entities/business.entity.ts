import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { Vendor } from './vendor.entity';
import { Category } from './category.entity';

export enum BusinessStatus {
    PENDING = 'pending',
    APPROVED = 'approved',
    REJECTED = 'rejected',
    SUSPENDED = 'suspended',
}

@Entity('businesses')
export class Business {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'vendor_id', type: 'uuid' })
    vendorId: string;

    @ManyToOne(() => Vendor)
    @JoinColumn({ name: 'vendor_id' })
    vendor: Vendor;

    @Column({ name: 'category_id', type: 'uuid' })
    categoryId: string;

    @ManyToOne(() => Category)
    @JoinColumn({ name: 'category_id' })
    category: Category;

    @Column({ length: 255 })
    name: string;

    @Column({ length: 255, nullable: true })
    tagline: string;

    @Column({ name: 'contact_person_name', length: 150, nullable: true })
    contactPersonName: string;

    @Column({ name: 'year_established', type: 'int', nullable: true })
    yearEstablished: number;

    @Column({ unique: true, length: 255 })
    slug: string;

    @Column({ type: 'text', nullable: true })
    description: string;

    @Column({ length: 20 })
    phone: string;

    @Column({ name: 'alternate_phones', type: 'jsonb', nullable: true })
    alternatePhones: string[]; // Up to 4 extra numbers

    @Column({ length: 255, nullable: true })
    website: string;

    @Column({ name: 'business_hours', type: 'jsonb', nullable: true })
    businessHours: any; // { monday: { open: '09:00', close: '17:00' }, ... }

    @Column({ name: 'social_links', type: 'jsonb', nullable: true })
    socialLinks: any; // { facebook: 'url', instagram: 'url', ... }

    @Column({ type: 'jsonb', nullable: true })
    keywords: string[];

    @Column({ name: 'service_categories', type: 'jsonb', nullable: true })
    serviceCategories: string[]; // Up to 4 mapped categories (string array of IDs or names)

    @Column({ name: 'logo_url', type: 'text', nullable: true })
    logoUrl: string;

    @Column({ name: 'cover_image_url', type: 'text', nullable: true })
    coverImageUrl: string;

    @Column({ name: 'gallery_images', type: 'jsonb', nullable: true })
    galleryImages: string[];

    @Column({ type: 'text' })
    address: string;

    @Column({ length: 100 })
    city: string;

    @Column({ type: 'decimal', precision: 10, scale: 8 })
    latitude: number;

    @Column({ type: 'decimal', precision: 11, scale: 8 })
    longitude: number;

    @Column({
        type: 'varchar',
        length: 20,
        default: BusinessStatus.APPROVED, // Auto-approve: listings go live immediately
    })
    status: BusinessStatus;

    @Column({ name: 'is_featured', default: false })
    isFeatured: boolean;

    @Column({ name: 'recent_until', nullable: true, type: 'timestamp' })
    recentUntil: Date;

    @Column({ name: 'average_rating', type: 'decimal', precision: 3, scale: 2, default: 0 })
    averageRating: number;

    @Column({ name: 'total_reviews', default: 0 })
    totalReviews: number;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}
