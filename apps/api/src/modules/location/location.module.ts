import { Module } from '@nestjs/common';
import { AddressConfigController } from './controllers/address-config.controller';
import { PlacesController } from './controllers/places.controller';
import { AddressConfigService } from './services/address-config.service';
import { PlacesService } from './services/places.service';

@Module({
  controllers: [AddressConfigController, PlacesController],
  providers: [AddressConfigService, PlacesService],
  exports: [AddressConfigService, PlacesService],
})
export class LocationModule {}
