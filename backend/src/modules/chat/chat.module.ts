import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatConversation, ChatMessage, User, Listing, Vendor, CustomerNote } from '../../entities';
import { Subscription } from '../../entities/subscription.entity';
import { ActivePlan } from '../../entities/active-plan.entity';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { ChatGateway } from './chat.gateway';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { WsJwtGuard } from '../notifications/ws-jwt.guard';
import { LeadsModule } from '../leads/leads.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([ChatConversation, ChatMessage, User, Listing, Vendor, CustomerNote, Subscription, ActivePlan]),
        ConfigModule,
        JwtModule.registerAsync({
            imports: [ConfigModule],
            useFactory: (configService: ConfigService) => ({
                secret: configService.get<string>('JWT_SECRET'),
                signOptions: {
                    expiresIn: configService.get<string>('JWT_EXPIRATION') as any,
                },
            }),
            inject: [ConfigService],
        }),
        AuthModule,
        UsersModule,
        forwardRef(() => LeadsModule),
    ],
    providers: [ChatService, ChatGateway, WsJwtGuard],
    controllers: [ChatController],
    exports: [ChatService],
})
export class ChatModule {}
