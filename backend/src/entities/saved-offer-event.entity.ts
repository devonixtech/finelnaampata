import {
    Entity,
    PrimaryColumn,
    CreateDateColumn,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { User } from './user.entity';
import { OfferEvent } from './offer-event.entity';

@Entity('saved_offer_events')
export class SavedOfferEvent {
    @PrimaryColumn({ name: 'user_id', type: 'uuid' })
    userId: string;

    @PrimaryColumn({ name: 'offer_event_id', type: 'uuid' })
    offerEventId: string;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @Exclude()
    @ManyToOne(() => User, (user) => user.savedOfferEvents)
    @JoinColumn({ name: 'user_id' })
    user: User;

    @Exclude()
    @ManyToOne(() => OfferEvent, (offerEvent) => offerEvent.savedByUsers)
    @JoinColumn({ name: 'offer_event_id' })
    offerEvent: OfferEvent;
}
