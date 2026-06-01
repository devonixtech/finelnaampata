import { Module } from '@nestjs/common';
import { AddressConfigController } from './address-config.controller';
import { AddressConfigService } from './address-config.service';

@Module({
    controllers: [AddressConfigController],
    providers: [AddressConfigService],
    exports: [AddressConfigService],
})
export class AddressConfigModule {}
