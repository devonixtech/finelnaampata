import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    OneToMany,
} from 'typeorm';
import { BusinessAmenity } from './business-amenity.entity';

@Entity('amenities')
export class Amenity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true, length: 100, nullable: true })
    name: string;

    @Column({ nullable: true, length: 50 })
    icon: string;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    // Relations
    @OneToMany(() => BusinessAmenity, (businessAmenity) => businessAmenity.amenity)
    businessAmenities: BusinessAmenity[];
}
