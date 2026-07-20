import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('business_questions')
export class BusinessQuestion {
    @ApiProperty()
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ApiProperty()
    @Column({ nullable: true, default: '' })
    category: string;

    @ApiProperty()
    @Column({ nullable: true, default: '' })
    question: string;

    @ApiProperty({ type: [String] })
    @Column('jsonb', { nullable: true, default: '[]' })
    options: string[];

    @ApiProperty()
    @Column({ default: true, name: 'is_active' })
    isActive: boolean;

    @ApiProperty()
    @Column({ default: 0 })
    order: number;

    @ApiProperty()
    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @ApiProperty()
    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}
