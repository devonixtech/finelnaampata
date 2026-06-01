import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AddressConfigService } from './address-config.service';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Address Config')
@Controller('address-config')
export class AddressConfigController {
    constructor(private readonly addressConfigService: AddressConfigService) {}

    @Public()
    @Get('countries')
    getCountries() {
        return this.addressConfigService.getCountries();
    }

    @Public()
    @Get(':countryCode')
    async getConfig(@Param('countryCode') countryCode: string) {
        return this.addressConfigService.getConfig(countryCode);
    }

    @Get(':countryCode/validate-postal-code')
    async validatePostalCode(
        @Param('countryCode') countryCode: string,
        @Query('postalCode') postalCode?: string,
    ) {
        return {
            valid: await this.addressConfigService.validatePostalCode(countryCode, postalCode),
        };
    }
}
