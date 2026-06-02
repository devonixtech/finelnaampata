import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { DataSource } from 'typeorm';
import * as compression from 'compression';
import { fixProductionSchema } from './database/schema-fixer';
import { getFrontendOrigins } from './common/utils/public-url.util';

async function bootstrap() {
    const logger = new Logger('Bootstrap');

    logger.log('--- 🚀 APP STARTING (PRODUCTION READY) ---');

    const app = await NestFactory.create(AppModule, {
        logger: ['error', 'warn', 'log', 'debug', 'verbose'],
    });

    const configService = app.get(ConfigService);
    const port = process.env.PORT || configService.get<number>('PORT') || 3001;

    // 0. Production DB Schema Fix (Run before listen)
    const dataSource = app.get(DataSource);
    await fixProductionSchema(dataSource);

    // 1. Global Prefix
    app.setGlobalPrefix('api/v1');

    // 1.1 Compression
    app.use(compression());

    // 2. Request Logging Middleware
    app.use((req, res, next) => {
        if (req.method !== 'OPTIONS') {
            logger.debug(`[Request] ${req.method} ${req.url} - Origin: ${req.headers.origin || 'None'}`);
        }
        next();
    });

    // 3. Validation Pipe
    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            transform: true,
            forbidNonWhitelisted: true,
        }),
    );

    // 4. Swagger Setup
    const config = new DocumentBuilder()
        .setTitle('Business SAAS API')
        .setDescription('API documentation for the Discovery Platform.')
        .setVersion('1.0')
        .addBearerAuth()
        .build();
    const document = SwaggerModule.createDocument(app, config);
    
    // Register Swagger at multiple paths for backward compatibility and prefix safety
    // Note: With 'api/v1' global prefix, 'docs' becomes '/api/v1/docs'
    SwaggerModule.setup('docs', app, document);
    SwaggerModule.setup('swagger', app, document); // /api/v1/swagger
    SwaggerModule.setup('api-docs', app, document); // /api/v1/api-docs

    // 5. CORS Configuration
    const finalAllowed = getFrontendOrigins(configService);
    logger.log(`✅ Allowed CORS Origins: ${JSON.stringify(finalAllowed)}`);

    app.enableCors({
        origin: (origin, callback) => {
            if (!origin) return callback(null, true);
            
            const cleanOrigin = origin.replace(/\/$/, '');
            
            if (finalAllowed.includes(cleanOrigin) || 
                cleanOrigin.endsWith('.netlify.app') || 
                cleanOrigin.endsWith('.up.railway.app')) {
                return callback(null, true);
            }

            logger.error(`❌ CORS blocked for origin: ${origin}`);
            return callback(new Error('Not allowed by CORS'), false);
        },
        credentials: true,
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
        allowedHeaders: 'Content-Type, Accept, Authorization, X-Requested-With, Origin',
    });

    // 6. Start Server
    await app.listen(port, '0.0.0.0');
    logger.log(`🚀 Server running on: http://0.0.0.0:${port}/api/v1`);
    logger.log(`📝 Swagger Docs available at: /api/v1/docs, /api/docs, /docs`);
}

bootstrap();
