import { BadRequestException, Body, Controller, Get, Post, Query } from '@nestjs/common';
import { PlacesService } from '../services/places.service';

@Controller('location/places')
export class PlacesController {
  constructor(private readonly placesService: PlacesService) {}

  @Get('autocomplete')
  async autocomplete(@Query('input') input: string, @Query('countryCode') countryCode?: string) {
    if (!input || input.trim().length < 3) {
      return [];
    }

    return this.placesService.autocomplete(input, countryCode);
  }

  @Post('resolve')
  async resolve(@Body('description') description: string) {
    if (!description || description.trim().length < 3) {
      throw new BadRequestException('Address description is required');
    }

    return this.placesService.resolve(description);
  }
}
