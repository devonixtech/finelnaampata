import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
} from 'typeorm';

export enum CategoryStatus {
    ACTIVE = 'active',
    DISABLED = 'disabled',
}

export enum CategorySource {
    GOOGLE = 'google',
    ADMIN = 'admin',
}

@Entity('categories')
export class Category {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ length: 255 })
    name: string;

    @Column({ unique: true, length: 255 })
    slug: string;

    @Column({ type: 'text', nullable: true })
    description: string;

    @Column({ name: 'parent_id', type: 'uuid', nullable: true })
    parentId: string;

    @Column({ name: 'display_order', default: 0 })
    displayOrder: number;

    @Column({ name: 'meta_title', type: 'text', nullable: true })
    metaTitle: string;

    @Column({ name: 'meta_description', type: 'text', nullable: true })
    metaDescription: string;

    @Column({ type: 'text', nullable: true })
    icon: string;

    @Column({ name: 'image_url', type: 'text', nullable: true })
    imageUrl: string;

    @Column({
        type: 'enum',
        enum: CategoryStatus,
        default: CategoryStatus.ACTIVE,
    })
    status: CategoryStatus;

    @Column({
        type: 'enum',
        enum: CategorySource,
        default: CategorySource.ADMIN,
    })
    source: CategorySource;

    @Column({ name: 'is_featured', default: false })
    isFeatured: boolean;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}
