import { Controller, Get, Param, Query, Post, Body, Put } from '@nestjs/common';
import { BusinessesService } from './businesses.service';
import { Business } from '../../entities/business.entity';

@Controller('businesses')
export class BusinessesController {
    constructor(private readonly businessesService: BusinessesService) { }

    @Get('search')
    async search(@Query() params: any): Promise<any> {
        return this.businessesService.search(params);
    }

    @Get()
    async findAll(@Query() query: any): Promise<any> {
        return this.businessesService.findAll(query);
    }

    @Get('slug/:slug')
    async findBySlug(@Param('slug') slug: string): Promise<Business | null> {
        return this.businessesService.findBySlug(slug);
    }

    @Get(':id')
    async findOne(@Param('id') id: string): Promise<Business | null> {
        return this.businessesService.findOne(id);
    }

    @Post()
    async create(@Body() createDto: any): Promise<Business> {
        return this.businessesService.create(createDto);
    }

    @Put(':id')
    async update(@Param('id') id: string, @Body() updateDto: any): Promise<Business> {
        return this.businessesService.update(id, updateDto);
    }
}
