import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../entities';
import * as bcrypt from 'bcrypt';

async function bootstrap() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const userRepo = app.get(getRepositoryToken(User));

    const user = await userRepo.findOne({ where: { email: 'test@gmail.com' } });
    if (user) {
        user.password = await bcrypt.hash('password123', 10);
        await userRepo.save(user);
        console.log('Password for test@gmail.com reset to: password123');
    } else {
        console.log('User test@gmail.com not found');
    }

    await app.close();
}

bootstrap().catch(console.error);
