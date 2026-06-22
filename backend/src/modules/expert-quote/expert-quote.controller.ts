import { Controller, Get, Post, Body, Query, Param, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ExpertQuoteService } from './expert-quote.service';
import { CreateExpertQuoteDto } from './dto/create-expert-quote.dto';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../../entities/user.entity';

@ApiTags('expert-quote')
@Controller('expert-quote')
export class ExpertQuoteController {
    constructor(private readonly expertQuoteService: ExpertQuoteService) {}

    @Public()
    @Post()
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: 'Submit an expert quote request (public)' })
    @ApiResponse({ status: 201, description: 'Quote submitted successfully' })
    @ApiResponse({ status: 400, description: 'Validation failed or daily limit reached' })
    async create(@Body() dto: CreateExpertQuoteDto, @CurrentUser() user?: User) {
        return this.expertQuoteService.create(dto, user);
    }

    @Public()
    @Get()
    @ApiOperation({ summary: 'Get all active expert quotes (public)' })
    @ApiResponse({ status: 200, description: 'List of quotes' })
    async findAll(@Query('page') page?: number, @Query('limit') limit?: number) {
        return this.expertQuoteService.findAll(page, limit);
    }

    @Public()
    @Get(':id')
    @ApiOperation({ summary: 'Get single expert quote (public)' })
    @ApiResponse({ status: 200, description: 'Quote found' })
    @ApiResponse({ status: 404, description: 'Quote not found' })
    async findOne(@Param('id') id: string) {
        return this.expertQuoteService.findOne(id);
    }
}
