const { chromium } = require('playwright');
const { Client } = require('pg');

async function getLatestOtp(email) {
    const client = new Client({
        connectionString: "postgresql://postgres:RvkwtnMaGpHpXnkqniMeDvRBOKAxihdI@shuttle.proxy.rlwy.net:45505/railway",
        ssl: {
            rejectUnauthorized: false
        }
    });

    try {
        await client.connect();
        const res = await client.query("SELECT verification_otp FROM users WHERE email = $1", [email]);
        if (res.rows.length > 0) {
            return res.rows[0].verification_otp;
        }
        return null;
    } catch (e) {
        console.error("DB Query error:", e);
        return null;
    } finally {
        await client.end();
    }
}

async function runTest() {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
        viewport: { width: 1280, height: 800 }
    });
    const page = await context.newPage();

    // Setup dialog handler
    page.on('dialog', async dialog => {
        console.log(`[Dialog] Message: ${dialog.message()}`);
        await dialog.accept();
    });

    const email = `playwright.vendor.${Date.now()}@example.com`;

    try {
        console.log("1. Navigating to Register...");
        await page.goto('http://localhost:3000/register');
        await page.waitForLoadState('networkidle');

        console.log("2. Filling in Registration Details...");
        await page.fill('input[placeholder="Enter your full name"]', 'E2E Playwright Vendor');
        await page.fill('input[placeholder="3001234567"]', '3001111111');
        await page.fill('input[placeholder="name@example.com"]', email);
        await page.fill('input[placeholder="At least 8 characters"]', 'Password123!');
        await page.fill('input[placeholder="Re-type your password"]', 'Password123!');

        // Check terms
        await page.locator('input[type="checkbox"]').first().check();

        // Submit
        console.log("3. Submitting registration...");
        await page.click('button[type="submit"]');

        console.log("4. Waiting for /verify-email...");
        await page.waitForURL(url => url.pathname.includes('/verify-email'));
        await page.waitForTimeout(2000); // Wait for OTP to be sent & DB updated

        console.log(`5. Fetching OTP for ${email}...`);
        const otp = await getLatestOtp(email);
        console.log(`Found OTP: ${otp}`);
        if (!otp) throw new Error("OTP not found in database");

        console.log("6. Entering OTP digits...");
        const otpInputs = await page.$$('input[type="text"]');
        if (otpInputs.length === 6) {
            for (let i = 0; i < 6; i++) {
                await otpInputs[i].fill(otp[i]);
            }
        } else {
            await page.keyboard.type(otp);
        }

        console.log("7. Clicking Verify Account...");
        await page.click('button:has-text("Verify")');

        console.log("8. Waiting for /dashboard redirect...");
        await page.waitForURL(url => url.pathname.startsWith('/dashboard'));
        await page.waitForLoadState('networkidle');
        await page.screenshot({ path: 'scratch/step1_dashboard_standard.png' });
        console.log("Dashboard loaded!");

        // Debug hrefs on page
        const hrefs = await page.evaluate(() => Array.from(document.querySelectorAll('a')).map(a => ({
            text: a.textContent.trim(),
            href: a.getAttribute('href')
        })));
        console.log("All Links on page:", hrefs);

        console.log("9. Navigating to /upgrade...");
        // Wait for and click 'List My Business' link
        const upgradeLink = page.locator('a:has-text("List My Business")').first();
        await upgradeLink.waitFor({ state: 'visible', timeout: 5000 });
        await upgradeLink.click();
        
        await page.waitForURL(url => url.pathname.includes('/upgrade'));
        await page.waitForLoadState('networkidle');
        await page.screenshot({ path: 'scratch/step2_upgrade_page.png' });

        console.log("10. Upgrading account to Vendor status...");
        await page.fill('input[placeholder="e.g. Acme Plumbing Details"]', 'E2E Playwright Business');
        await page.fill('input[placeholder="+1 234 567 890"]', '+923001111111');
        await page.fill('input[placeholder="e.g. 123 Main St, Sector F-6, Islamabad"]', '123 Main St, Sector F-6, Islamabad');
        await page.locator('input[type="checkbox"]').check();
        await page.click('button[type="submit"]');

        console.log("11. Waiting for /subscription...");
        await page.waitForURL(url => url.pathname.includes('/subscription'));
        await page.waitForSelector('button:has-text("Activate Plan")', { state: 'visible', timeout: 15000 });
        await page.screenshot({ path: 'scratch/step3_subscription_page.png' });

        console.log("12. Activating premium billing plan (Paid monthly)...");
        // Check terms checkbox
        const subCheckbox = page.locator('input[type="checkbox"]');
        await subCheckbox.check();

        // Click "Activate Plan" on the monthly card
        const activateButtons = await page.$$('button:has-text("Activate Plan")');
        console.log(`Found ${activateButtons.length} Activate Plan buttons`);
        if (activateButtons.length > 0) {
            await activateButtons[1].click();
        } else {
            throw new Error("No Activate Plan buttons found");
        }

        console.log("13. Waiting for E2E success redirection...");
        await page.waitForURL(url => url.pathname.includes('/subscription/success'), { timeout: 15000 });
        await page.waitForLoadState('networkidle');
        await page.screenshot({ path: 'scratch/step4_success_page.png' });
        console.log("Success page loaded!");

        // Click Open Dashboard
        console.log("14. Returning to dashboard...");
        await page.click('a:has-text("Open Dashboard")');
        await page.waitForURL(url => url.pathname.startsWith('/dashboard'));
        await page.waitForLoadState('networkidle');
        await page.screenshot({ path: 'scratch/step5_vendor_dashboard.png' });
        console.log("Vendor Dashboard loaded!");

        // Try /add-listing
        console.log("15. Navigating to /add-listing...");
        await page.goto('http://localhost:3000/add-listing');
        await page.waitForLoadState('networkidle');
        await page.screenshot({ path: 'scratch/step6_add_listing.png' });
        console.log("Business Setup / Listing page loaded successfully!");

    } catch (err) {
        console.error("Test failed with error:", err);
        await page.screenshot({ path: 'scratch/error_state.png' });
    } finally {
        await browser.close();
    }
}

runTest();
