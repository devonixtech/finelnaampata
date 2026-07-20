import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    ManyToOne,
    JoinColumn,
    Index,
} from 'typeorm';
import { ChatConversation } from './chat-conversation.entity';
import { User } from './user.entity';

@Entity('chat_messages')
export class ChatMessage {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => ChatConversation, (conv) => conv.messages, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'conversation_id' })
    @Index()
    conversation: ChatConversation;

    @Column({ name: 'conversation_id', nullable: true })
    conversationId: string;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'sender_id' })
    sender: User;

    @Column({ name: 'sender_id', nullable: true })
    senderId: string;

    @Column({ type: 'text', nullable: true })
    content: string;

    @Column({ name: 'is_read', default: false })
    isRead: boolean;

    @CreateDateColumn({ name: 'created_at' })
    @Index()
    createdAt: Date;
}
