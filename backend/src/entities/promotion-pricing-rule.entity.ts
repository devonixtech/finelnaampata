import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    Index,
} from 'typeorm';

export enum PromotionPlacement {
    HOMEPAGE = 'homepage',
    CATEGORY = 'category',
    LISTING = 'listing',
    OFFER = 'offer',
    EVENT = 'event',
    PAGE = 'page',
}

@Entity('promotion_pricing_rules')
export class PromotionPricingRule {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({
        type: 'enum',
        enum: PromotionPlacement,
        unique: true,
        nullable: true,
    })
    placement: PromotionPlacement;

    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    pricePerHour: number;

    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    pricePerDay: number;


    @Column({ name: 'is_active', default: true })
    isActive: boolean;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}
