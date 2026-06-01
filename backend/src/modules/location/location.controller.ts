import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { PlacesService } from './places.service';
import { PlaceDetailsQueryDto, PlacesAutocompleteQueryDto } from './dto/places-autocomplete.dto';

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

    @Get('places/:placeId')
    @ApiOperation({ summary: 'Resolve place details and coordinates (closes autocomplete session)' })
    placeDetails(@Param('placeId') placeId: string, @Query() query: PlaceDetailsQueryDto) {
        return this.placesService.getPlaceDetails(placeId, query.sessionToken);
    }
}
