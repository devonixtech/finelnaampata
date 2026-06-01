import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    UseGuards,
    Query,
    ParseUUIDPipe,
    ParseIntPipe,
} from '@nestjs/common';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { ReplyCommentDto } from './dto/reply-comment.dto';
import { UpdateReplyDto } from './dto/update-reply.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../entities/user.entity';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { CommentStatus } from '../../entities/comment.entity';

@Controller()
export class CommentsController {
    constructor(private readonly commentsService: CommentsService) { }

    // --- User / Public Endpoints ---

    @Post('comments')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.USER, UserRole.VENDOR, UserRole.ADMIN, UserRole.SUPERADMIN)
    create(@CurrentUser('id') userId: string, @Body() createCommentDto: CreateCommentDto) {
        return this.commentsService.create(userId, createCommentDto);
    }

    @Public()
    @Get('comments/public')
    findAll(
        @Query('page', new ParseIntPipe({ optional: true })) page = 1,
        @Query('limit', new ParseIntPipe({ optional: true })) limit = 10,
    ) {
        return this.commentsService.findAllPublic(page, limit);
    }

    @Public()
    @Get('business/:businessId/comments')
    getByBusiness(
        @Param('businessId', ParseUUIDPipe) businessId: string,
        @Query('page', new ParseIntPipe({ optional: true })) page = 1,
        @Query('limit', new ParseIntPipe({ optional: true })) limit = 10,
    ) {
        return this.commentsService.findPublicByBusiness(businessId, page, limit);
    }

    // --- Vendor Endpoints ---

    @Get(['vendor/comments', 'business/comments'])
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.VENDOR)
    getVendorComments(
        @CurrentUser('id') userId: string,
        @Query('page', new ParseIntPipe({ optional: true })) page = 1,
        @Query('limit', new ParseIntPipe({ optional: true })) limit = 10,
    ) {
        return this.commentsService.findVendorComments(userId, page, limit);
    }

    @Post(['vendor/comments/:commentId/reply', 'business/comments/:commentId/reply'])
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.VENDOR)
    reply(
        @CurrentUser('id') userId: string,
        @Param('commentId', ParseUUIDPipe) commentId: string,
        @Body() replyDto: ReplyCommentDto,
    ) {
        return this.commentsService.reply(userId, commentId, replyDto);
    }

    @Patch(['vendor/comments/reply/:replyId', 'business/comments/reply/:replyId'])
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.VENDOR)
    updateReply(
        @CurrentUser('id') userId: string,
        @Param('replyId', ParseUUIDPipe) replyId: string,
        @Body() updateDto: UpdateReplyDto,
    ) {
        return this.commentsService.updateReply(userId, replyId, updateDto);
    }

    @Delete(['vendor/comments/reply/:replyId', 'business/comments/reply/:replyId'])
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.VENDOR)
    removeReply(
        @CurrentUser('id') userId: string,
        @Param('replyId', ParseUUIDPipe) replyId: string,
    ) {
        return this.commentsService.removeReply(userId, replyId);
    }

    // --- Admin Endpoints ---

    @Patch('admin/comments/:id/hide')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
    hide(@Param('id', ParseUUIDPipe) id: string) {
        return this.commentsService.updateStatus(id, CommentStatus.HIDDEN);
    }

    @Patch('admin/comments/:id/show')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
    show(@Param('id', ParseUUIDPipe) id: string) {
        return this.commentsService.updateStatus(id, CommentStatus.VISIBLE);
    }

    @Delete('admin/comments/:id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
    remove(@Param('id', ParseUUIDPipe) id: string) {
        return this.commentsService.remove(id);
    }
}
