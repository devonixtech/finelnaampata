import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    OneToOne,
    JoinColumn,
    OneToMany
} from 'typeorm';
import { User } from './user.entity';
import { Commission } from './commission.entity';

@Entity('affiliates')
export class Affiliate {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'user_id', type: 'uuid', unique: true })
    userId: string;

    @OneToOne(() => User)
    @JoinColumn({ name: 'user_id' })
    user: User;

    @Column({ name: 'affiliate_code', unique: true })
    affiliateCode: string;

    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    totalEarned: number;

    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    pendingBalance: number;

    @Column({ name: 'is_active', default: true })
    isActive: boolean;

    @OneToMany(() => Commission, commission => commission.affiliate)
    commissions: Commission[];

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}
