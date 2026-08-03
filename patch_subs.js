const fs = require('fs');
const path = require('path');
const file = path.join('backend', 'src', 'modules', 'subscriptions', 'subscriptions.service.ts');
let content = fs.readFileSync(file, 'utf8');

// Replace 1: Imports
content = content.replace(
  'import { Repository, MoreThan, LessThanOrEqual, IsNull } from \'typeorm\';',
  'import { Repository, MoreThan, LessThanOrEqual, IsNull, Not, In } from \'typeorm\';'
);

// Replace 2: oldData
content = content.replace(
          const [oldData, oldTotal] = await this.subscriptionRepository.findAndCount({
            relations: ['plan', 'vendor', 'vendor.user'],
            order: { createdAt: 'DESC' },
            take: fetchCount,
        });,
          const [oldData, oldTotal] = await this.subscriptionRepository.findAndCount({
            relations: ['plan', 'vendor', 'vendor.user'],
            where: { vendor: { user: { role: Not(In([UserRole.ADMIN, UserRole.SUPERADMIN])) } } },
            order: { createdAt: 'DESC' },
            take: fetchCount,
        });
);

// Replace 3: newPlansQuery
content = content.replace(
              .where('plan.type = :subscriptionType', {
                subscriptionType: PricingPlanType.SUBSCRIPTION,
            })
            .orderBy('activePlan.createdAt', 'DESC');,
              .where('plan.type = :subscriptionType', {
                subscriptionType: PricingPlanType.SUBSCRIPTION,
            })
            .andWhere('vendorUser.role NOT IN (:...excludedRoles)', {
                excludedRoles: [UserRole.ADMIN, UserRole.SUPERADMIN]
            })
            .orderBy('activePlan.createdAt', 'DESC');
);

fs.writeFileSync(file, content, 'utf8');
