import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    OneToMany,
} from 'typeorm';
import { ActivePlan } from './active-plan.entity';

export enum PricingPlanType {
    SUBSCRIPTION = 'subscription',
    HOMEPAGE_FEATURED = 'homepage_featured',
    CATEGORY_FEATURED = 'category_featured',
    LISTING_BOOST = 'listing_boost',
}

export enum PricingPlanUnit {
    MINUTES = 'minutes',
    HOURS = 'hours',
    DAYS = 'days',
    MONTHS = 'months',
    YEARS = 'years',
}

@Entity('pricing_plans')
export class PricingPlan {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ nullable: true })
    name: string;

    @Column({ nullable: true, type: 'text' })
    description: string;

    @Column({
        type: 'enum',
        enum: PricingPlanType,
        default: PricingPlanType.SUBSCRIPTION,
    })
    type: PricingPlanType;

    @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
    price: number;

    @Column({ nullable: true })
    duration: number;

    @Column({
        type: 'enum',
        enum: PricingPlanUnit,
        default: PricingPlanUnit.DAYS,
    })
    unit: PricingPlanUnit;

    @Column({ name: 'stripe_price_id', nullable: true })
    stripePriceId: string;

    @Column({ type: 'jsonb', nullable: true, default: '{}' })
    features: {
        maxListings?: number;
        maxOffers?: number;
        maxEvents?: number;
        showAnalytics?: boolean;
        prioritySupport?: boolean;
        customBadges?: boolean;
        [key: string]: any;
    };

    @Column({ name: 'is_active', default: true })
    isActive: boolean;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;

    @OneToMany(() => ActivePlan, (activePlan) => activePlan.plan)
    activePlans: ActivePlan[];
}
