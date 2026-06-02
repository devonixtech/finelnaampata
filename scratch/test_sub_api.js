
const { execSync } = require('child_process');

const API_URL = 'https://local-business-listing-directory-production.up.railway.app/api/v1';

function testSubscriptionAPI() {
    console.log('--- Testing Subscription API ---');
    
    try {
        console.log('1. Fetching Plans...');
        const plansRes = execSync(`curl -s ${API_URL}/subscriptions/plans`).toString();
        const plans = JSON.parse(plansRes);
        console.log('Plans found:', plans.length);
        console.log(JSON.stringify(plans, null, 2));

        if (plans.length > 0) {
            const plan = plans.find(p => p.price > 0) || plans[0];
            console.log(`\n2. Selected Plan for Check: ${plan.name} (${plan.id})`);
            console.log(`Price: ${plan.price}, Stripe Price ID: ${plan.stripePriceId}`);
        }

    } catch (error) {
        console.error('Error during testing:', error.message);
    }
}

testSubscriptionAPI();

