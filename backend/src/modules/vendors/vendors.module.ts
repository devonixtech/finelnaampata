import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VendorsController } from './vendors.controller';
import { BusinessProfilesController } from './business-profiles.controller';
import { VendorsService } from './vendors.service';
import { BusinessesModule } from '../businesses/businesses.module';
import { Vendor } from '../../entities/vendor.entity';
import { User } from '../../entities/user.entity';
import { Listing } from '../../entities/business.entity';
import { OfferEvent } from '../../entities/offer-event.entity';
import { Deal } from '../../entities/deal.entity';
import { Event } from '../../entities/event.entity';
import { DealsModule } from '../deals/deals.module';
import { EventsModule } from '../events/events.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Vendor, User, Listing, OfferEvent, Deal, Event]),
        BusinessesModule,
        DealsModule,
        EventsModule,
    ],
    controllers: [BusinessProfilesController, VendorsController],
    providers: [VendorsService],
    exports: [VendorsService],
})
export class VendorsModule { }
