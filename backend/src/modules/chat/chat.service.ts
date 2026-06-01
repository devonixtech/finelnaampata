import { Injectable, NotFoundException, ForbiddenException, BadRequestException, OnModuleInit } from '@nestjs/common';
import { InjectRepository, InjectEntityManager } from '@nestjs/typeorm';
import { Repository, Not, EntityManager, MoreThan } from 'typeorm';
import { ChatConversation, ChatMessage, User, Listing, Vendor, CustomerNote } from '../../entities';
import { Subscription, SubscriptionStatus } from '../../entities/subscription.entity';
import { ActivePlan, ActivePlanStatus } from '../../entities/active-plan.entity';
import { LeadsService } from '../leads/leads.service';
import { NotificationsService, NotificationType } from '../notifications/notifications.service';
import { Inject, forwardRef } from '@nestjs/common';

@Injectable()
export class ChatService implements OnModuleInit {
    constructor(
        @InjectRepository(ChatConversation)
        private conversationRepository: Repository<ChatConversation>,
        @InjectRepository(ChatMessage)
        private messageRepository: Repository<ChatMessage>,
        @InjectRepository(Listing)
        private listingRepository: Repository<Listing>,
        @InjectRepository(Vendor)
        private vendorRepository: Repository<Vendor>,
        @InjectRepository(CustomerNote)
        private noteRepository: Repository<CustomerNote>,
        @InjectRepository(Subscription)
        private subscriptionRepository: Repository<Subscription>,
        @InjectRepository(ActivePlan)
        private activePlanRepository: Repository<ActivePlan>,
        @Inject(forwardRef(() => LeadsService))
        private leadsService: LeadsService,
        private notificationsService: NotificationsService,
        @InjectEntityManager()
        private readonly entityManager: EntityManager,
    ) { }

    async onModuleInit() {
        await this.entityManager.query(`
            CREATE TABLE IF NOT EXISTS customer_notes (
                id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
                conversation_id uuid NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
                vendor_id uuid NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
                customer_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                created_by_user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                content text NOT NULL,
                created_at timestamp NOT NULL DEFAULT now(),
                updated_at timestamp NOT NULL DEFAULT now()
            );
            CREATE INDEX IF NOT EXISTS idx_customer_notes_conversation ON customer_notes(conversation_id);
            CREATE INDEX IF NOT EXISTS idx_customer_notes_vendor ON customer_notes(vendor_id);
        `).catch(err => console.error('[ChatService] customer_notes schema sync failed:', err.message));
    }

    async getOrCreateConversation(userId: string, businessId: string) {
        let conversation = await this.conversationRepository.findOne({
            where: { userId, businessId },
            relations: ['business', 'user', 'vendor'],
        });

        if (!conversation) {
            const business = await this.listingRepository.findOne({
                where: { id: businessId },
                relations: ['vendor'],
            });

            if (!business) {
                throw new NotFoundException('Business not found');
            }

            conversation = this.conversationRepository.create({
                userId,
                businessId,
                vendorId: business.vendor.id,
            });
            await this.conversationRepository.save(conversation);

            // Reload with relations for the response
            conversation = await this.conversationRepository.findOne({
                where: { id: conversation.id },
                relations: ['business', 'user', 'vendor'],
            });

        }

        return conversation;
    }

    async getConversationById(conversationId: string) {
        return this.conversationRepository.findOne({
            where: { id: conversationId },
        });
    }

    async sendMessage(userId: string, conversationId: string, content: string) {
        const conversation = await this.conversationRepository.findOne({
            where: { id: conversationId },
        });

        if (!conversation) {
            throw new NotFoundException('Conversation not found');
        }

        // Check if user is part of conversation (either customer or vendor)
        const isCustomer = conversation.userId === userId;
        const vendor = await this.vendorRepository.findOne({ where: { id: conversation.vendorId } });
        const isVendor = vendor?.userId === userId;

        if (!isCustomer && !isVendor) {
            throw new ForbiddenException('Not authorized to send message in this conversation');
        }

        const message = this.messageRepository.create({
            conversationId,
            senderId: userId,
            content,
        });

        const savedMessage = await this.messageRepository.save(message);

        // Update last message in conversation
        await this.conversationRepository.update(conversationId, {
            lastMessage: content,
            lastMessageAt: new Date(),
        });

        // Send real-time notification to the recipient
        const recipientId = isCustomer ? vendor?.userId : conversation.userId;
        if (recipientId) {
            this.notificationsService.create({
                userId: recipientId,
                title: isCustomer ? 'New Message' : 'Message from Business',
                message: content.length > 50 ? content.substring(0, 50) + '...' : content,
                type: NotificationType.CHAT_MESSAGE,
                data: { conversationId, senderId: userId },
                link: `/chat?id=${conversationId}`,
            }).catch(err => console.error('[ChatService] Notification failed:', err.message));
        }

        return savedMessage;
    }

    async getConversationHistory(conversationId: string, userId: string) {
        const conversation = await this.conversationRepository.findOne({
            where: { id: conversationId },
        });

        if (!conversation) {
            throw new NotFoundException('Conversation not found');
        }

        const vendor = await this.vendorRepository.findOne({ where: { id: conversation.vendorId } });
        const isVendorOwner = vendor?.userId === userId;

        if (conversation.userId !== userId && !isVendorOwner) {
            throw new ForbiddenException('Not authorized to view this conversation');
        }

        return this.messageRepository.find({
            where: { conversationId },
            order: { createdAt: 'ASC' },
            relations: ['sender'],
        });
    }

    async getUserConversations(userId: string) {
        return this.conversationRepository.find({
            where: { userId },
            relations: ['business', 'vendor'],
            order: { lastMessageAt: 'DESC' },
        });
    }

    async getVendorConversations(vendorId: string) {
        return this.conversationRepository.find({
            where: { vendorId },
            relations: ['user', 'business'],
            order: { lastMessageAt: 'DESC' },
        });
    }

    async getVendorConversationsByUserId(userId: string) {
        const vendor = await this.vendorRepository.findOne({ where: { userId } });
        if (!vendor) return [];
        return this.getVendorConversations(vendor.id);
    }

    async getUnreadCount(userId: string): Promise<number> {
        const result = await this.messageRepository
            .createQueryBuilder('message')
            .innerJoin('message.conversation', 'conversation')
            .leftJoin('conversation.vendor', 'vendor')
            .select('COUNT(DISTINCT message.conversation_id)', 'count')
            .where('message.is_read = :isRead', { isRead: false })
            .andWhere('message.sender_id != :userId', { userId })
            .andWhere('(conversation.user_id = :userId OR vendor.user_id = :userId)', { userId })
            .getRawOne();
            
        return parseInt(result?.count || '0');
    }

    async markAsRead(conversationId: string, userId: string): Promise<void> {
        await this.messageRepository.update(
            { conversationId, senderId: Not(userId), isRead: false },
            { isRead: true }
        );
    }

    private async assertBusinessOrAdminAccess(conversationId: string, user: User) {
        const conversation = await this.conversationRepository.findOne({ where: { id: conversationId } });
        if (!conversation) throw new NotFoundException('Conversation not found');

        if (user.role === 'admin' || user.role === 'superadmin') {
            return conversation;
        }

        const vendor = await this.vendorRepository.findOne({ where: { id: conversation.vendorId } });
        if (!vendor || vendor.userId !== user.id) {
            throw new ForbiddenException('Only the business and admin can manage private notes for this customer');
        }

        return conversation;
    }

    async getNotes(conversationId: string, user: User) {
        await this.assertBusinessOrAdminAccess(conversationId, user);
        return this.noteRepository.find({
            where: { conversationId },
            relations: ['createdByUser'],
            order: { createdAt: 'DESC' },
        });
    }

    async createNote(conversationId: string, user: User, content: string) {
        const cleanContent = content?.trim();
        if (!cleanContent) throw new BadRequestException('Note content is required');

        const conversation = await this.assertBusinessOrAdminAccess(conversationId, user);
        if (user.role !== 'admin' && user.role !== 'superadmin') {
            const [activeSub, activePlan] = await Promise.all([
                this.subscriptionRepository.findOne({
                    where: { vendorId: conversation.vendorId, status: SubscriptionStatus.ACTIVE, endDate: MoreThan(new Date()) },
                    relations: ['plan'],
                }),
                this.activePlanRepository.findOne({
                    where: { vendorId: conversation.vendorId, status: ActivePlanStatus.ACTIVE, endDate: MoreThan(new Date()) },
                    relations: ['plan'],
                }),
            ]);
            const features = (activePlan?.plan?.features as any) || activeSub?.plan?.dashboardFeatures || {};
            const canUseNotes =
                features.showCustomerNotes === true || features.customerNotes === true;
            if (!canUseNotes) {
                throw new ForbiddenException('Customer notes are available on paid plans only. Please upgrade to continue.');
            }
        }
        const note = this.noteRepository.create({
            conversationId,
            vendorId: conversation.vendorId,
            customerId: conversation.userId,
            createdByUserId: user.id,
            content: cleanContent,
        });

        return this.noteRepository.save(note);
    }
}
