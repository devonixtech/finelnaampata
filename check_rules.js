const { DataSource } = require('typeorm');
const { PromotionPricingRule, PromotionPlacement } = require('./backend/dist/entities/promotion-pricing-rule.entity');

async function checkRules() {
    const dataSource = new DataSource({
        type: 'postgres',
        host: process.env.DB_HOST || 'your-db-host',
        port: parseInt(process.env.DB_PORT || '5432'),
        username: process.env.DB_USERNAME || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
        database: process.env.DB_DATABASE || 'local_business_directory',
        synchronize: false,
        entities: [PromotionPricingRule],
    });

    try {
        await dataSource.initialize();
        const repo = dataSource.getRepository(PromotionPricingRule);
        const rules = await repo.find();
        console.log('Current Promotion Pricing Rules in DB:');
        console.log(JSON.stringify(rules, null, 2));
    } catch (error) {
        console.error('Error checking rules:', error);
    } finally {
        await dataSource.destroy();
    }
}

checkRules();

