import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Listing } from '../../entities/business.entity';
import { GeocoderService } from './geocoder.service';
import { PlacesService } from './places.service';
import { MapProviderService } from './map-provider.service';
import { SearchLocationService } from './search-location.service';
import { LocationController } from './location.controller';

@Module({
    imports: [
        TypeOrmModule.forFeature([Listing]),
        ...(process.env.REDIS_ENABLED === 'true' ? [
            BullModule.registerQueue({
                name: 'geocoding',
            }),
        ] : []),
    ],
    controllers: [LocationController],
    providers: [GeocoderService, PlacesService, MapProviderService, SearchLocationService],
    exports: [GeocoderService, PlacesService, MapProviderService, SearchLocationService, ...(process.env.REDIS_ENABLED === 'true' ? [BullModule] : [])],
})
export class LocationModule {}
