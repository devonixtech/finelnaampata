import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    OneToMany,
    JoinColumn,
    Index,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Listing } from './business.entity';
import { User } from './user.entity';
import { QAAnswer } from './qa-answer.entity';
import { QAStatus } from './qa.enums';

@Entity('qa_questions')
export class QAQuestion {
    @ApiProperty()
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ApiProperty()
    @Column({ name: 'business_id', type: 'uuid', nullable: true })
    @Index()
    businessId: string;

    @ManyToOne(() => Listing)
    @JoinColumn({ name: 'business_id' })
    business: Listing;

    @ApiProperty()
    @Column({ name: 'user_id', type: 'uuid', nullable: true })
    @Index()
    userId: string;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'user_id' })
    user: User;

    @ApiProperty()
    @Column({ type: 'text', nullable: true })
    content: string;

    @ApiProperty({ enum: QAStatus })
    @Column({
        type: 'enum',
        enum: QAStatus,
        default: QAStatus.PENDING,
    })
    status: QAStatus;

    @OneToMany(() => QAAnswer, (answer) => answer.question)
    answers: QAAnswer[];

    @ApiProperty()
    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @ApiProperty()
    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}
