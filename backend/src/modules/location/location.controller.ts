import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { PlacesService } from './places.service';
import { PlacesAutocompleteQueryDto, ResolvePlaceDto } from './dto/places-autocomplete.dto';

@ApiTags('location')
@Controller('location')
export class LocationController {
    constructor(private readonly placesService: PlacesService) {}

    @Get('places/autocomplete')
    @ApiOperation({ summary: 'Google Places address autocomplete (min 3 chars, session token required)' })
    autocomplete(@Query() query: PlacesAutocompleteQueryDto) {
        return this.placesService.autocomplete(
            query.input,
            query.sessionToken,
            query.countryCode,
        );
    }

    @Post('places/resolve')
    @ApiOperation({ summary: 'Resolve a selected autocomplete address to normalized coordinates and fields' })
    resolvePlace(@Body() body: ResolvePlaceDto) {
        return this.placesService.resolveSelectedAddress(body.description, body.sessionToken);
    }
}
