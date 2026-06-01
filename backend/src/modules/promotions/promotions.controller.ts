import {
    Controller,
    Get,
    Post,
    Patch,
    Param,
    Body,
    UseGuards,
    Req,
    Query,
    BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { PromotionsService } from './promotions.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../entities/user.entity';
import { CalculatePriceDto, CreateBookingDto } from './dto/create-booking.dto';
import { Public } from '../../common/decorators/public.decorator';
@ApiTags('promotions')
@Controller('promotions')
export class PromotionsController {
    constructor(private readonly promotionsService: PromotionsService) {}

    @Public()
    @Get('visibility-rate')
    @ApiOperation({ summary: 'Get per-day visibility rate for deals or events' })
    async getVisibilityRate(@Query('type') type: 'deal' | 'event' = 'deal') {
        return this.promotionsService.getVisibilityRate(type);
    }

    @Post('calculate-visibility')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Calculate per-day visibility price for a deal or event window' })
    async calculateVisibility(
        @Body() body: { startTime: string; endTime: string; type?: 'deal' | 'event' },
    ) {
        return this.promotionsService.calculateVisibilityPrice(
            body.startTime,
            body.endTime,
            body.type === 'event' ? 'event' : 'deal',
        );
    }

    @Public()
    @Get('pricing-rules')
    @ApiOperation({ summary: 'Get all active pricing rules for promotions' })
    @ApiResponse({ status: 200, description: 'Rules retrieved' })
    async getPricingRules() {
        return this.promotionsService.getPricingRules();
    }

    @Post('calculate')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Calculate total price for a promotion booking' })
    async calculatePrice(@Req() req, @Body() dto: CalculatePriceDto, @Query('type') type: string = 'offer') {
        return this.promotionsService.calculatePrice(dto, req.user.id, type);
    }

    @Post('book')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Initiate a promotion booking (Stripe Checkou)' })
    async createBooking(@Req() req, @Body() dto: CreateBookingDto) {
        const origin = req.get('origin');
        return this.promotionsService.createBooking(req.user.id, dto, origin);
    }

    @Get('verify-session')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Verify a promotion payment session' })
    async verifySession(@Req() req, @Query('session_id') sessionId: string) {
        if (!sessionId) throw new BadRequestException('Session ID is required');
        return this.promotionsService.verifySession(sessionId, req.user.id);
    }

    // --- Admin Endpoints ---
    @Get('admin/rules')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get all promotion rules for admin' })
    async adminGetRules() {
        return this.promotionsService.getPricingRules();
    }

    @Patch('admin/rules/:id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Update a promotion pricing rule' })
    @ApiResponse({ status: 200, description: 'Rule updated' })
    async updateRule(@Param('id') id: string, @Body() dto: { pricePerHour?: number, basePrice?: number, isActive?: boolean }) {
        return this.promotionsService.updatePricingRule(id, dto);
    }
}
