const { NestFactory } = require('@nestjs/core');
const { AppModule } = require('./src/app.module');
const { NotificationsService, NotificationType } = require('./src/modules/notifications/notifications.service');

async function run() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const notifService = app.get(NotificationsService);
  try {
    const n = await notifService.create({
        userId: '24917349-cdce-4db0-b448-3f45aa58bdc0',
        title: 'New Review Received! ⭐',
        message: 'You received a 5-star review on "Test".',
        type: NotificationType.REVIEW_RECEIVED,
        link: '/reviews',
    });
    console.log('Created:', n);
  } catch (e) {
    console.error('Error:', e);
  }
  await app.close();
}
run();
