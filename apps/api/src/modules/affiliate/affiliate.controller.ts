import { Controller, Get, Post, Body, UseGuards, Req, Param } from '@nestjs/common';
import { AffiliateService } from './affiliate.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../../entities/user.entity';

@Controller('affiliate')
export class AffiliateController {
    constructor(private readonly affiliateService: AffiliateService) { }

    @Post('join')
    @UseGuards(JwtAuthGuard)
    join(@Req() req: any) {
        return this.affiliateService.registerAffiliate(req.user.id);
    }

    @Get('stats')
    @UseGuards(JwtAuthGuard)
    getStats(@Req() req: any) {
        return this.affiliateService.getStats(req.user.id);
    }

    @Get('earnings/breakdown')
    @UseGuards(JwtAuthGuard)
    getEarningsBreakdown() {
        return { monthly: [], yearly: [] };
    }

    @Get('referrals')
    @UseGuards(JwtAuthGuard)
    getReferrals() {
        return [];
    }

    @Get('payouts')
    @UseGuards(JwtAuthGuard)
    getPayouts() {
        return [];
    }

    @Get('settings')
    @UseGuards(JwtAuthGuard)
    getSettings() {
        return { commissionRate: 50 };
    }
}

@Controller('admin/affiliate')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminAffiliateController {
    constructor(private readonly affiliateService: AffiliateService) { }

    @Get('commissions')
    getAllCommissions() {
        return this.affiliateService.getAllCommissions();
    }

    @Post('commissions/:id/approve')
    approveCommission(@Param('id') id: string, @Body('adminNotes') adminNotes?: string) {
        return this.affiliateService.approveCommission(id, adminNotes);
    }

    @Post('commissions/:id/reject')
    rejectCommission(@Param('id') id: string, @Body('reason') reason: string) {
        return this.affiliateService.rejectCommission(id, reason);
    }
}
