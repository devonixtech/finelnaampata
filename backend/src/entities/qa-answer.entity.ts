import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
    Index,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';
import { User } from './user.entity';
import { QAQuestion } from './qa-question.entity';
import { QAStatus } from './qa.enums';

@Entity('qa_answers')
export class QAAnswer {
    @ApiProperty()
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ApiProperty()
    @Column({ name: 'question_id', type: 'uuid', nullable: true })
    @Index()
    questionId: string;

    @Exclude()
    @ManyToOne(() => QAQuestion, (question) => question.answers)
    @JoinColumn({ name: 'question_id' })
    question: QAQuestion;

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

    @ApiProperty()
    @Column({ name: 'is_official', default: false })
    isOfficial: boolean;

    @ApiProperty()
    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @ApiProperty()
    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}
