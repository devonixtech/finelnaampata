import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AdminActivityGateway } from './admin-activity.gateway';
import { AdminActivityService } from './admin-activity.service';
import { AdminActivityController } from './admin-activity.controller';
import { WsJwtGuard } from '../notifications/ws-jwt.guard';

@Module({
    imports: [
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
    ],
    controllers: [AdminActivityController],
    providers: [AdminActivityGateway, AdminActivityService, WsJwtGuard],
    exports: [AdminActivityGateway, AdminActivityService],
})
export class AdminActivityModule {}
