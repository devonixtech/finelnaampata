import { Module } from '@nestjs/common';
import { AddressConfigController } from './controllers/address-config.controller';
import { AddressConfigService } from './services/address-config.service';

@Module({
  controllers: [AddressConfigController],
  providers: [AddressConfigService],
  exports: [AddressConfigService],
})
export class LocationModule {}
