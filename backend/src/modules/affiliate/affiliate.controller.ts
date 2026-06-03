import {
    Controller,
    Get,
    Post,
    Patch,
    Body,
    UseGuards,
    Param,
    Query,
} from '@nestjs/common';
import { AffiliateService } from './affiliate.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User, UserRole } from '../../entities/user.entity';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PayoutStatus } from '../../entities/payout.entity';

@ApiTags('affiliate')
@Controller('affiliate')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class AffiliateController {
    constructor(private readonly affiliateService: AffiliateService) { }

    @Get('stats')
    @ApiOperation({ summary: 'Get affiliate stats and balance' })
    async getStats(@CurrentUser() user: User) {
        return this.affiliateService.getStats(user.id);
    }

    @Post('join')
    @ApiOperation({ summary: 'Join the affiliate program' })
    async join(@CurrentUser() user: User) {
        return this.affiliateService.join(user.id);
    }

    @Get('referrals')
    @ApiOperation({ summary: 'Get recent referral history' })
    async getReferrals(@CurrentUser() user: User) {
        return this.affiliateService.getReferrals(user.id);
    }

    @Post('track-click')
    @ApiOperation({ summary: 'Track a referral click for the current user or save it for later business activation' })
    async trackClick(@CurrentUser() user: User, @Query('code') code?: string) {
        return this.affiliateService.trackClick(user.id, code || '');
    }

    @Post('apply-referral')
    @ApiOperation({ summary: 'Apply a referral code to the current user' })
    async applyReferral(
        @CurrentUser() user: User,
        @Body() body?: { code?: string; referralCode?: string } | string,
    ) {
        const code =
            typeof body === 'string'
                ? body
                : body?.code ?? body?.referralCode ?? '';
        return this.affiliateService.applyReferralCode(user.id, code);
    }

    @Post('payouts')
    @ApiOperation({ summary: 'Request a withdrawal' })
    async requestPayout(
        @CurrentUser() user: User,
        @Body() body: { amount: number; method: string; details: string },
    ) {
        return this.affiliateService.requestPayout(user.id, body.amount, body.method, body.details);
    }

    @Get('payouts')
    @ApiOperation({ summary: 'Get payout history' })
    async getPayoutHistory(@CurrentUser() user: User) {
        return this.affiliateService.getPayoutHistory(user.id);
    }

    // --- Admin Endpoints ---

    @Get('admin/stats')
    @UseGuards(RolesGuard)
    @Roles(UserRole.SUPERADMIN, UserRole.ADMIN)
    @ApiOperation({ summary: 'Admin: Get system-wide affiliate stats' })
    async adminGetStats() {
        return this.affiliateService.adminGetAllStats();
    }

    @Get('admin/payouts')
    @UseGuards(RolesGuard)
    @Roles(UserRole.SUPERADMIN, UserRole.ADMIN)
    @ApiOperation({ summary: 'Admin: Get all payout requests' })
    async adminGetPayouts() {
        return this.affiliateService.adminGetAllPayouts();
    }

    @Patch('admin/payouts/:id')
    @UseGuards(RolesGuard)
    @Roles(UserRole.SUPERADMIN, UserRole.ADMIN)
    @ApiOperation({ summary: 'Admin: Update payout status' })
    async adminUpdatePayout(
        @Param('id') id: string,
        @Body() body: { status: PayoutStatus; notes?: string },
    ) {
        return this.affiliateService.adminUpdatePayout(id, body.status, body.notes);
    }

    @Get('admin/affiliates')
    @UseGuards(RolesGuard)
    @Roles(UserRole.SUPERADMIN, UserRole.ADMIN)
    @ApiOperation({ summary: 'Admin: List all affiliates' })
    async adminGetAffiliates() {
        return this.affiliateService.adminGetAllAffiliates();
    }

    @Get('admin/referrals')
    @UseGuards(RolesGuard)
    @Roles(UserRole.SUPERADMIN, UserRole.ADMIN)
    @ApiOperation({ summary: 'Admin: List all referrals' })
    async adminGetReferrals() {
        return this.affiliateService.getReferralStats();
    }

    @Post('admin/activate-referral/:id')
    @UseGuards(RolesGuard)
    @Roles(UserRole.SUPERADMIN, UserRole.ADMIN)
    @ApiOperation({ summary: 'Admin: Activate a referral and member plan' })
    async adminActivateReferral(@Param('id') id: string) {
        return this.affiliateService.adminActivateReferral(id);
    }

    @Get('settings')
    @ApiOperation({ summary: 'Get affiliate program settings' })
    async getSettings() {
        return this.affiliateService.getSettings();
    }

    @Get('admin/settings')
    @UseGuards(RolesGuard)
    @Roles(UserRole.SUPERADMIN, UserRole.ADMIN)
    @ApiOperation({ summary: 'Admin: Get affiliate program settings' })
    async adminGetSettings() {
        return this.affiliateService.getSettings();
    }

    @Patch('admin/settings')
    @UseGuards(RolesGuard)
    @Roles(UserRole.SUPERADMIN, UserRole.ADMIN)
    @ApiOperation({ summary: 'Admin: Update affiliate program settings' })
    async adminUpdateSettings(@Body() settings: { 
        commissionRate: string; 
        commissionType: string;
        checkinReward: string; 
        checkinType: string;
        validityMonths: string;
        expiryDate: string 
    }) {
        return this.affiliateService.adminUpdateSettings(settings);
    }
}
