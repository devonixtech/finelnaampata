import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';

export interface ActivityEvent {
    id: string;
    event: string;
    userId?: string;
    summary: string;
    timestamp: Date;
    metadata?: Record<string, any>;
}

const MAX_BUFFER_SIZE = 200;

@Injectable()
export class AdminActivityService {
    private buffer: ActivityEvent[] = [];

    addActivity(
        event: string,
        summary: string,
        userId?: string,
        metadata?: Record<string, any>,
    ): ActivityEvent {
        const activity: ActivityEvent = {
            id: randomUUID(),
            event,
            userId,
            summary,
            timestamp: new Date(),
            metadata,
        };

        this.buffer.unshift(activity);

        if (this.buffer.length > MAX_BUFFER_SIZE) {
            this.buffer.pop();
        }

        return activity;
    }

    getRecentActivities(limit: number = 50): ActivityEvent[] {
        const safeLimit = Math.max(1, Math.min(limit, MAX_BUFFER_SIZE));
        return this.buffer.slice(0, safeLimit);
    }
}
