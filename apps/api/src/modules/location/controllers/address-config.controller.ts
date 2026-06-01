import { Controller, Get, Param, BadRequestException } from '@nestjs/common';
import { AddressConfigService } from '../services/address-config.service';

@Controller('address-config')
export class AddressConfigController {
  constructor(private readonly addressConfigService: AddressConfigService) {}

  @Get('countries')
  async getCountries() {
    return this.addressConfigService.getCountries();
  }

  @Get(':countryCode')
  async getConfig(@Param('countryCode') countryCode: string) {
    if (!countryCode || countryCode.length > 3) {
      throw new BadRequestException('Invalid country code');
    }
    return this.addressConfigService.getConfig(countryCode.toUpperCase());
  }
}
