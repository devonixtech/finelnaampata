"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubscriptionsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const subscription_entity_1 = require("../../entities/subscription.entity");
const subscription_plan_entity_1 = require("../../entities/subscription-plan.entity");
const transaction_entity_1 = require("../../entities/transaction.entity");
const vendor_entity_1 = require("../../entities/vendor.entity");
const config_1 = require("@nestjs/config");
let SubscriptionsService = class SubscriptionsService {
    constructor(subscriptionRepository, planRepository, transactionRepository, vendorRepository, configService) {
        this.subscriptionRepository = subscriptionRepository;
        this.planRepository = planRepository;
        this.transactionRepository = transactionRepository;
        this.vendorRepository = vendorRepository;
        this.configService = configService;
    }
    async getPlans() {
        return this.planRepository.find({ where: { isActive: true }, order: { price: 'ASC' } });
    }
    async createPlan(createPlanDto) {
        const plan = this.planRepository.create(createPlanDto);
        return this.planRepository.save(plan);
    }
    async createCheckoutSession(userId, checkoutDto) {
        const vendor = await this.vendorRepository.findOne({
            where: { userId },
            relations: ['user']
        });
        if (!vendor)
            throw new common_1.ForbiddenException('Only vendors can subscribe');
        const plan = await this.planRepository.findOne({ where: { id: checkoutDto.planId } });
        if (!plan)
            throw new common_1.NotFoundException('Plan not found');
        const frontendUrl = this.configService.get('FRONTEND_URL') || 'https://endearing-taffy-91a2c6.netlify.app';
        return {
            sessionId: 'MOCK-SESSION-' + Date.now(),
            checkoutUrl: `${frontendUrl}/vendor/subscription/success?session_id=MOCK-SESSION-${Date.now()}&mock_plan_id=${plan.id}`,
        };
    }
    async handleMockSubscriptionSuccess(vendorId, planId, mockSessionId) {
        const plan = await this.planRepository.findOne({ where: { id: planId } });
        if (!plan)
            throw new common_1.NotFoundException('Plan not found');
        const vendor = await this.vendorRepository.findOne({ where: { id: vendorId } });
        if (!vendor)
            throw new common_1.NotFoundException('Vendor not found');
        await this.subscriptionRepository.update({ vendorId, status: subscription_entity_1.SubscriptionStatus.ACTIVE }, { status: subscription_entity_1.SubscriptionStatus.CANCELLED, cancelledAt: new Date() });
        const now = new Date();
        const endDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
        const subscription = this.subscriptionRepository.create({
            vendorId,
            planId,
            status: subscription_entity_1.SubscriptionStatus.ACTIVE,
            startDate: now,
            endDate: endDate,
            amount: plan.price,
            autoRenew: true,
        });
        const savedSub = await this.subscriptionRepository.save(subscription);
        const transaction = this.transactionRepository.create({
            subscriptionId: savedSub.id,
            vendorId,
            amount: plan.price,
            status: transaction_entity_1.PaymentStatus.COMPLETED,
            paidAt: now,
            gatewayTransactionId: mockSessionId,
            paymentGateway: 'Mock',
            invoiceNumber: `INV-MOCK-${Date.now()}`,
        });
        await this.transactionRepository.save(transaction);
        return savedSub;
    }
    async getActiveSubscription(userId) {
        const vendor = await this.vendorRepository.findOne({ where: { userId } });
        if (!vendor)
            throw new common_1.ForbiddenException('Vendor not found');
        return this.subscriptionRepository.findOne({
            where: { vendorId: vendor.id, status: subscription_entity_1.SubscriptionStatus.ACTIVE },
            relations: ['plan'],
        });
    }
    async getTransactions(userId) {
        const vendor = await this.vendorRepository.findOne({ where: { userId } });
        if (!vendor)
            throw new common_1.ForbiddenException('Vendor not found');
        return this.transactionRepository.find({
            where: { vendorId: vendor.id },
            order: { createdAt: 'DESC' },
        });
    }
};
exports.SubscriptionsService = SubscriptionsService;
exports.SubscriptionsService = SubscriptionsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(subscription_entity_1.Subscription)),
    __param(1, (0, typeorm_1.InjectRepository)(subscription_plan_entity_1.SubscriptionPlan)),
    __param(2, (0, typeorm_1.InjectRepository)(transaction_entity_1.Transaction)),
    __param(3, (0, typeorm_1.InjectRepository)(vendor_entity_1.Vendor)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        config_1.ConfigService])
], SubscriptionsService);
//# sourceMappingURL=subscriptions.service.js.map
