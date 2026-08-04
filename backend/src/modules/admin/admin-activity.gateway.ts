import {
    WebSocketGateway,
    WebSocketServer,
    OnGatewayConnection,
    OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UserRole } from '../../entities/user.entity';
import { AdminActivityService, ActivityEvent } from './admin-activity.service';
import { DEFAULT_FRONTEND_URL, isImplicitlyAllowedFrontendOrigin, parsePublicOrigins } from '../../common/utils/public-url.util';

const allowedOrigins = parsePublicOrigins(
    process.env.FRONTEND_URL,
    process.env.CORS_ORIGIN,
    process.env.NEXT_PUBLIC_SITE_URL,
);

@WebSocketGateway({
    cors: {
        origin: (origin: string, callback: any) => {
            const configuredOrigins = allowedOrigins.length > 0 ? allowedOrigins : [DEFAULT_FRONTEND_URL];

            if (!origin || configuredOrigins.includes(origin) || isImplicitlyAllowedFrontendOrigin(origin)) {
                return callback(null, true);
            }
            console.warn(`❌ [ADMIN-ACTIVITY-CORS-BLOCKED] Origin: ${origin}`);
            return callback(null, false);
        },
        credentials: true,
    },
    namespace: 'admin',
    transports: ['polling', 'websocket'],
})
export class AdminActivityGateway implements OnGatewayConnection, OnGatewayDisconnect {
    constructor(
        private jwtService: JwtService,
        private configService: ConfigService,
        private adminActivityService: AdminActivityService,
    ) {}

    @WebSocketServer()
    server: Server;

    private readonly logger = new Logger(AdminActivityGateway.name);
    private connectedAdmins: Map<string, string> = new Map();

    async handleConnection(client: any) {
        const token = client.handshake?.auth?.token || client.handshake?.headers?.authorization;

        if (!token) {
            this.logger.warn(`Connection rejected: no token provided (socket ${client.id})`);
            client.disconnect();
            return;
        }

        const jwtToken = token.split(' ')[1] || token;

        try {
            const payload = await this.jwtService.verifyAsync(jwtToken, {
                secret: this.configService.get<string>('JWT_SECRET'),
            });

            if (payload.role !== UserRole.ADMIN && payload.role !== UserRole.SUPERADMIN) {
                this.logger.warn(
                    `Connection rejected: user ${payload.sub} has role ${payload.role}, not admin (socket ${client.id})`,
                );
                client.disconnect();
                return;
            }

            client.user = { ...payload, id: payload.sub };
            this.connectedAdmins.set(payload.sub, client.id);
            this.logger.log(`Admin connected: ${payload.sub} (socket ${client.id})`);
        } catch (err: any) {
            this.logger.error(`Connection rejected: JWT verification failed — ${err.message} (socket ${client.id})`);
            client.disconnect();
        }
    }

    handleDisconnect(client: any) {
        if (client.user?.id) {
            this.connectedAdmins.delete(client.user.id);
            this.logger.log(`Admin disconnected: ${client.user.id} (socket ${client.id})`);
        }
    }

    broadcastActivity(event: string, summary: string, userId?: string, metadata?: Record<string, any>): ActivityEvent {
        const activity = this.adminActivityService.addActivity(event, summary, userId, metadata);

        if (this.server) {
            this.server.emit(event, {
                id: activity.id,
                event: activity.event,
                userId: activity.userId,
                summary: activity.summary,
                timestamp: activity.timestamp,
            });
            this.logger.log(`Broadcast ${event} to ${this.connectedAdmins.size} admin(s): ${summary}`);
        }

        return activity;
    }

    getConnectedAdminCount(): number {
        return this.connectedAdmins.size;
    }
}
