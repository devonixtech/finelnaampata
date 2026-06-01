import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatGateway } from './chat.gateway';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CreateConversationDto, SendMessageDto } from './dto/chat.dto';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Chat')
@ApiBearerAuth()
@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
    constructor(
        private readonly chatService: ChatService,
        private readonly chatGateway: ChatGateway,
    ) {}

    @Post('conversations')
    @ApiOperation({ summary: 'Get or create a conversation with a business' })
    async getOrCreateConversation(
        @Request() req: any,
        @Body() body: CreateConversationDto,
    ) {
        const conversation = await this.chatService.getOrCreateConversation(req.user.id, body.businessId);
        
        // Notify vendor in real-time if this is a new conversation
        if (conversation) {
            await this.chatGateway.notifyNewConversation(conversation);
        }
        
        return conversation;
    }

    @Get('conversations/user')
    @ApiOperation({ summary: 'Get all conversations for the current user' })
    async getUserConversations(@Request() req: any) {
        return this.chatService.getUserConversations(req.user.id);
    }

    @Get(['conversations/vendor', 'conversations/business'])
    @ApiOperation({ summary: 'Get all conversations for the current vendor' })
    async getVendorConversations(@Request() req: any) {
        return this.chatService.getVendorConversationsByUserId(req.user.id);
    }

    @Get('conversations/:id/messages')
    @ApiOperation({ summary: 'Get message history for a conversation' })
    async getMessages(@Request() req: any, @Param('id') id: string) {
        return this.chatService.getConversationHistory(id, req.user.id);
    }

    @Get('unread-count')
    @ApiOperation({ summary: 'Get total unread messages count for the current user' })
    async getUnreadCount(@Request() req: any) {
        const count = await this.chatService.getUnreadCount(req.user.id);
        return { count };
    }

    @Post('conversations/:id/mark-as-read')
    @ApiOperation({ summary: 'Mark all messages in a conversation as read' })
    async markAsRead(@Request() req: any, @Param('id') id: string) {
        await this.chatService.markAsRead(id, req.user.id);
        return { success: true };
    }

    @Get('conversations/:id/notes')
    @ApiOperation({ summary: 'Get private business/admin notes for a customer conversation' })
    async getNotes(@Request() req: any, @Param('id') id: string) {
        return this.chatService.getNotes(id, req.user);
    }

    @Post('conversations/:id/notes')
    @ApiOperation({ summary: 'Create a private business/admin note for a customer conversation' })
    async createNote(
        @Request() req: any,
        @Param('id') id: string,
        @Body('content') content: string,
    ) {
        return this.chatService.createNote(id, req.user, content);
    }

    @Post('conversations/:id/messages')
    @ApiOperation({ summary: 'Send a message in a conversation via REST' })
    async sendMessage(
        @Request() req: any,
        @Param('id') id: string,
        @Body() body: SendMessageDto,
    ) {
        const userId = req.user.id;
        const message = await this.chatService.sendMessage(
            userId,
            id,
            body.content,
        );

        // Broadcast full message to conversation room
        this.chatGateway.server.to(id).emit('newMessage', message);

        // Also broadcast conversation update
        const conversation = await this.chatService.getConversationById(id);
        if (conversation) {
            const update = {
                conversationId: id,
                lastMessage: body.content,
                lastMessageAt: message.createdAt,
            };
            this.chatGateway.server.to(`vendor:${conversation.vendorId}`).emit('conversationUpdated', update);
            this.chatGateway.server.to(`user:${conversation.userId}`).emit('conversationUpdated', update);
        }

        return message;
    }
}
