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
import { User } from './user.entity';
import { Listing } from './business.entity';
import { Vendor } from './vendor.entity';
import { ChatMessage } from './chat-message.entity';

@Entity('chat_conversations')
@Index(['userId', 'businessId'], { unique: true })
export class ChatConversation {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'user_id' })
    user: User;

    @Column({ name: 'user_id', nullable: true })
    userId: string;

    @ManyToOne(() => Listing)
    @JoinColumn({ name: 'business_id' })
    business: Listing;

    @Column({ name: 'business_id', nullable: true })
    businessId: string;

    @ManyToOne(() => Vendor)
    @JoinColumn({ name: 'vendor_id' })
    vendor: Vendor;

    @Column({ name: 'vendor_id', nullable: true })
    vendorId: string;

    @Column({ name: 'last_message', nullable: true, type: 'text' })
    lastMessage: string;

    @Column({ name: 'last_message_at', nullable: true, type: 'timestamp' })
    lastMessageAt: Date;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;

    @OneToMany(() => ChatMessage, (message) => message.conversation)
    messages: ChatMessage[];
}
