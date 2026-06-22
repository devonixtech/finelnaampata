import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from './user.entity';
import { Listing } from './business.entity';

@Entity('expert_quotes')
export class ExpertQuote {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'user_id', nullable: true })
    userId: string;

    @ManyToOne(() => User, { nullable: true })
    @JoinColumn({ name: 'user_id' })
    user: User;

    @Column({ name: 'business_id', nullable: true })
    businessId: string;

    @ManyToOne(() => Listing, { nullable: true })
    @JoinColumn({ name: 'business_id' })
    business: Listing;

    @Column({ name: 'customer_name', length: 150 })
    customerName: string;

    @Column({ name: 'customer_email', length: 255 })
    customerEmail: string;

    @Column({ name: 'customer_phone', length: 50, nullable: true })
    customerPhone: string;

    @Column({ name: 'category_slug', length: 150 })
    categorySlug: string;

    @Column({ name: 'category_name', length: 200 })
    categoryName: string;

    @Column({ type: 'text' })
    description: string;

    @Column({ name: 'preferred_contact', length: 50, default: 'email' })
    preferredContact: string;

    @Column({ name: 'city', length: 150, nullable: true })
    city: string;

    @Column({ name: 'is_active', default: true })
    isActive: boolean;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}
