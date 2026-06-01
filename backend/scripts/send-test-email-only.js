/** Send SMTP test only. Usage: node backend/scripts/send-test-email-only.js */
const path = require('path');
const nodemailer = require('nodemailer');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const TEST_EMAIL = process.env.TEST_EMAIL || 'ahmedbilalkhangl09@gmail.com';

async function main() {
    const user = process.env.MAIL_USERNAME;
    const pass = process.env.MAIL_PASSWORD;
    if (!user || !pass) {
        console.error('Set MAIL_USERNAME and MAIL_PASSWORD in backend/.env');
        process.exit(1);
    }

    const transporter = nodemailer.createTransport({
        host: process.env.MAIL_HOST || 'smtp.gmail.com',
        port: Number(process.env.MAIL_PORT || 587),
        secure: Number(process.env.MAIL_PORT) === 465,
        auth: { user, pass },
        tls: { rejectUnauthorized: false },
    });

    await transporter.verify();
    console.log('SMTP connection OK');

    const fromAddress = process.env.MAIL_FROM_ADDRESS || user;
    const fromName = process.env.MAIL_FROM_NAME || 'NAAMPATA';

    const info = await transporter.sendMail({
        from: `"${fromName}" <${fromAddress}>`,
        to: TEST_EMAIL,
        subject: 'NAAMPATA — test email (SMTP OK)',
        html: `<h2>NAAMPATA SMTP test</h2><p>Mail is working. ${new Date().toISOString()}</p>`,
    });

    console.log('Sent:', info.messageId, '→', TEST_EMAIL);
}

main().catch((e) => {
    console.error('Failed:', e.message);
    process.exit(1);
});
