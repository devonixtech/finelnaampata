import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
} from 'typeorm';

@Entity('image_views')
export class ImageViews {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'listing_id', type: 'uuid' })
    listingId: string;

    @Column({ name: 'image_url', type: 'text' })
    imageUrl: string;

    @Column({ name: 'view_count', type: 'int', default: 0 })
    viewCount: number;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;
}
