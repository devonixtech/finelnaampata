import {
    Controller,
    Get,
    Post,
    Patch,
    Body,
    UseGuards,
    Param,
    Query,
    Req,
    Res,
} from '@nestjs/common';
import { AffiliateService } from './affiliate.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User, UserRole } from '../../entities/user.entity';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

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
    async trackClick(
        @CurrentUser() user: User,
        @Query('code') code: string,
        @Req() req: any,
        @Res({ passthrough: true }) res: any,
    ) {
        const ipAddress = req.ip || req.connection?.remoteAddress;
        const userAgent = req.headers['user-agent'];
        if (code) {
            res.cookie('referral', code, {
                maxAge: 30 * 24 * 60 * 60 * 1000,
                httpOnly: true,
            });
        }
        return this.affiliateService.trackClick(user.id, code || '', ipAddress, userAgent);
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

    @Get('earnings/breakdown')
    @ApiOperation({ summary: 'Get detailed earnings breakdown' })
    async getEarningsBreakdown(@CurrentUser() user: User) {
        return this.affiliateService.getEarningsBreakdown(user.id);
    }

    @Post('kyc/submit')
    @ApiOperation({ summary: 'Submit KYC document' })
    async submitKyc(@CurrentUser() user: User, @Body() body: { documentUrl: string }) {
        return this.affiliateService.submitKyc(user.id, body.documentUrl);
    }

    @Post('track/business-click')
    @ApiOperation({ summary: 'Track affiliate click on business card' })
    async trackBusinessClick(
        @Body() body: { affiliateCode: string; businessId: string },
        @Req() req: any,
    ) {
        return this.affiliateService.trackBusinessClick(
            body.affiliateCode,
            body.businessId,
            req.ip || req.connection?.remoteAddress,
            req.headers['user-agent'],
        );
    }

    // --- Admin Endpoints ---

    @Get('admin/stats')
    @UseGuards(RolesGuard)
    @Roles(UserRole.SUPERADMIN, UserRole.ADMIN)
    @ApiOperation({ summary: 'Admin: Get system-wide affiliate stats' })
    async adminGetStats() {
        return this.affiliateService.adminGetAllStats();
    }

    
    
    
    
    
    @Get('admin/affiliates')
    @UseGuards(RolesGuard)
    @Roles(UserRole.SUPERADMIN, UserRole.ADMIN)
    @ApiOperation({ summary: 'Admin: List all affiliates' })
    async adminGetAffiliates() {
        return this.affiliateService.adminGetAllAffiliates();
    }

    @Post('admin/approve/:id')
    @UseGuards(RolesGuard)
    @Roles(UserRole.SUPERADMIN, UserRole.ADMIN)
    @ApiOperation({ summary: 'Admin: Approve affiliate' })
    async adminApproveAffiliate(
        @Param('id') id: string,
        @CurrentUser() user: User,
    ) {
        return this.affiliateService.approveAffiliate(id, user.id);
    }

    @Post('admin/suspend/:id')
    @UseGuards(RolesGuard)
    @Roles(UserRole.SUPERADMIN, UserRole.ADMIN)
    @ApiOperation({ summary: 'Admin: Suspend affiliate' })
    async adminSuspendAffiliate(
        @Param('id') id: string,
        @CurrentUser() user: User,
    ) {
        return this.affiliateService.suspendAffiliate(id, user.id);
    }

    @Post('admin/kyc/:id/review')
    @UseGuards(RolesGuard)
    @Roles(UserRole.SUPERADMIN, UserRole.ADMIN)
    @ApiOperation({ summary: 'Admin: Review KYC document' })
    async adminReviewKyc(
        @Param('id') id: string,
        @CurrentUser() user: User,
        @Body() body: { status: 'approved' | 'rejected' },
    ) {
        return this.affiliateService.reviewKyc(id, body.status, user.id);
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

    @Get('admin/export')
    @UseGuards(RolesGuard)
    @Roles(UserRole.SUPERADMIN, UserRole.ADMIN)
    @ApiOperation({ summary: 'Admin: Export affiliates data' })
    async adminExportAffiliates(@Query('format') format: 'csv' | 'json') {
        return this.affiliateService.exportAffiliates(format || 'csv');
    }

    
    @Post('admin/referrals/:id/cancel')
    @UseGuards(RolesGuard)
    @Roles(UserRole.SUPERADMIN, UserRole.ADMIN)
    @ApiOperation({ summary: 'Admin: Cancel commission on a referral' })
    async adminCancelCommission(
        @Param('id') id: string,
        @CurrentUser() user: User,
        @Body() body: { reason: string },
    ) {
        return this.affiliateService.adminCancelCommission(id, user.id, body.reason);
    }

    @Post('admin/referrals/:id/approve-commission')
    @UseGuards(RolesGuard)
    @Roles(UserRole.SUPERADMIN, UserRole.ADMIN)
    @ApiOperation({ summary: 'Admin: Approve pending commission' })
    async adminGetPendingCommissions() {
        return this.affiliateService.getPendingCommissions();
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
        expiryDate: string;
        creditValue: string;
    }) {
        return this.affiliateService.adminUpdateSettings(settings);
    }
}
