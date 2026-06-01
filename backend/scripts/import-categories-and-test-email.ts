/**
 * One-shot: import categories-list.json into DB + send SMTP test email.
 *
 * Usage (from backend folder):
 *   npx ts-node -r tsconfig-paths/register scripts/import-categories-and-test-email.ts
 *
 * Optional env:
 *   TEST_EMAIL=you@example.com
 *   CATEGORIES_FILE=../categories-list.json
 */
import { NestFactory } from '@nestjs/core';
import { join } from 'path';
import { AppModule } from '../src/app.module';
import { CategoriesService } from '../src/modules/categories/categories.service';
import { MailService } from '../src/modules/auth/mail.service';

async function bootstrap() {
    const testEmail = process.env.TEST_EMAIL || 'ahmedbilalkhangl09@gmail.com';
    const categoriesFile =
        process.env.CATEGORIES_FILE ||
        join(__dirname, '../../categories-list.json');

    console.log('Starting Nest context...');
    const app = await NestFactory.createApplicationContext(AppModule, {
        logger: ['error', 'warn', 'log'],
    });

    try {
        const categoriesService = app.get(CategoriesService);
        const mailService = app.get(MailService);

        console.log(`\n📂 Importing categories from:\n   ${categoriesFile}\n`);
        const importResult = await categoriesService.bulkImportFromFile(categoriesFile);
        console.log('✅ Import result:', importResult);

        const review = await categoriesService.getCategoriesReviewExport(categoriesFile);
        console.log(`📊 Review export count: ${review.count}`);

        const { total } = await categoriesService.findAllAdmin(1, 1, '');
        console.log(`📊 Total categories in database: ${total}`);

        console.log(`\n📧 Sending test email to ${testEmail}...\n`);
        const sent = await mailService.sendTestEmail(testEmail);
        if (sent) {
            console.log(`✅ Test email sent to ${testEmail} — check inbox and spam.`);
        } else {
            console.error(`❌ Test email failed — check MAIL_* in backend/.env and Gmail app password.`);
            process.exitCode = 1;
        }
    } finally {
        await app.close();
    }
}

bootstrap().catch((err) => {
    console.error('Fatal:', err);
    process.exit(1);
});
