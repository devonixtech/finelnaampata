import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { CitiesService } from '../modules/cities/cities.service';

async function bootstrap() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const citiesService = app.get(CitiesService);

    const countries = [
        'Pakistan',
        'India',
        'United Arab Emirates',
        'Saudi Arabia',
        'United Kingdom',
        'United States',
        'Canada',
        'Australia',
    ];

    for (const country of countries) {
        console.log(`🏙️ Updating ${country} cities with coordinates...`);
        try {
            const result = await citiesService.bulkImportByCountry(country);
            console.log(`✅ ${country} cities updated:`, result);
        } catch (error) {
            console.error(`❌ Failed to import cities for ${country}:`, error);
        }
    }

    await app.close();
}

bootstrap().catch(err => {
    console.error('❌ Update failed:', err);
    process.exit(1);
});
