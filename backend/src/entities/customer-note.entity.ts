import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';
import { ChatConversation } from './chat-conversation.entity';
import { User } from './user.entity';
import { Vendor } from './vendor.entity';

@Entity('customer_notes')
export class CustomerNote {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'conversation_id', type: 'uuid', nullable: true })
    conversationId: string;

    @ManyToOne(() => ChatConversation)
    @JoinColumn({ name: 'conversation_id' })
    conversation: ChatConversation;

    @Column({ name: 'vendor_id', type: 'uuid', nullable: true })
    vendorId: string;

    @ManyToOne(() => Vendor)
    @JoinColumn({ name: 'vendor_id' })
    vendor: Vendor;

    @Column({ name: 'customer_id', type: 'uuid', nullable: true })
    customerId: string;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'customer_id' })
    customer: User;

    @Column({ name: 'created_by_user_id', type: 'uuid', nullable: true })
    createdByUserId: string;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'created_by_user_id' })
    createdByUser: User;

    @Column({ type: 'text', nullable: true })
    content: string;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}
