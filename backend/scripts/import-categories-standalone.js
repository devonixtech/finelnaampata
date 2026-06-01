/**
 * Standalone DB import + SMTP test (no Nest compile required).
 * Usage: node backend/scripts/import-categories-standalone.js
 */
const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const { Client } = require('pg');

const CATEGORIES_FILE = path.join(__dirname, '../../categories-list.json');
const TEST_EMAIL = process.env.TEST_EMAIL || 'ahmedbilalkhangl09@gmail.com';

function generateSlug(text) {
    return String(text)
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

async function importCategories(client) {
    const raw = JSON.parse(fs.readFileSync(CATEGORIES_FILE, 'utf8'));
    if (!Array.isArray(raw)) throw new Error('categories-list.json must be an array');

    const names = [...new Set(raw.map((n) => String(n).trim()).filter(Boolean))];
    console.log(`Importing ${names.length} unique categories...`);

    const existingSlugs = new Set(
        (await client.query('SELECT slug FROM categories')).rows.map((r) => r.slug),
    );

    let created = 0;
    let updated = 0;
    let skipped = 0;

    for (let i = 0; i < names.length; i++) {
        const name = names[i];
        let slug = generateSlug(name);
        if (!slug) {
            skipped++;
            continue;
        }
        let suffix = 0;
        while (existingSlugs.has(slug)) {
            const base = generateSlug(name);
            suffix++;
            slug = `${base}-${suffix}`;
            if (suffix > 50) {
                skipped++;
                slug = null;
                break;
            }
        }
        if (!slug) continue;

        const result = await client.query(
            `INSERT INTO categories (id, name, slug, status, source, display_order, is_featured, created_at, updated_at)
             VALUES (gen_random_uuid(), $1, $2, 'active', 'google', 0, false, NOW(), NOW())
             ON CONFLICT (name) DO UPDATE SET
               status = 'active',
               source = 'google',
               updated_at = NOW()
             RETURNING (xmax = 0) AS inserted`,
            [name, slug],
        );

        existingSlugs.add(slug);
        if (result.rows[0]?.inserted) created++;
        else updated++;

        if ((i + 1) % 500 === 0) {
            console.log(`  ... ${i + 1}/${names.length}`);
        }
    }

    const countRes = await client.query('SELECT COUNT(*)::int AS c FROM categories');
    return { created, updated, skipped, totalInDb: countRes.rows[0].c };
}

async function sendTestEmail() {
    const user = process.env.MAIL_USERNAME;
    const pass = process.env.MAIL_PASSWORD;
    if (!user || !pass) {
        console.error('MAIL_USERNAME / MAIL_PASSWORD missing in backend/.env');
        return false;
    }

    const transporter = nodemailer.createTransport({
        host: process.env.MAIL_HOST || 'smtp.gmail.com',
        port: Number(process.env.MAIL_PORT || 587),
        secure: Number(process.env.MAIL_PORT) === 465,
        auth: { user, pass },
        tls: { rejectUnauthorized: false },
    });

    const fromAddress = process.env.MAIL_FROM_ADDRESS || user;
    const fromName = process.env.MAIL_FROM_NAME || 'NAAMPATA';

    await transporter.sendMail({
        from: `"${fromName}" <${fromAddress}>`,
        to: TEST_EMAIL,
        subject: 'NAAMPATA — test email (SMTP OK)',
        html: `<p>If you see this, SMTP is working.</p><p>Sent ${new Date().toISOString()}</p>`,
    });
    return true;
}

function createDbClient() {
    if (process.env.DATABASE_URL) {
        const useSsl =
            process.env.DB_SSL === 'true' ||
            process.env.DATABASE_URL.includes('railway') ||
            process.env.DATABASE_URL.includes('rlwy.net');
        return new Client({
            connectionString: process.env.DATABASE_URL,
            ssl: useSsl ? { rejectUnauthorized: false } : undefined,
        });
    }
    return new Client({
        host: process.env.DB_HOST || 'localhost',
        port: Number(process.env.DB_PORT || 5432),
        user: process.env.DB_USERNAME || 'postgres',
        password: process.env.DB_PASSWORD,
        database: process.env.DB_DATABASE || 'local_business_platform',
        ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
    });
}

async function main() {
    const client = createDbClient();

    await client.connect();
    console.log('Connected to PostgreSQL');

    try {
        const importResult = await importCategories(client);
        console.log('Import done:', importResult);

        console.log(`Sending test email to ${TEST_EMAIL}...`);
        const sent = await sendTestEmail();
        if (sent) console.log('Test email sent successfully.');
        else process.exitCode = 1;
    } finally {
        await client.end();
    }
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
