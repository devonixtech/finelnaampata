"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const config_1 = require("@nestjs/config");
const app_module_1 = require("./app.module");
const core_2 = require("@nestjs/core");
const helmet_1 = require("helmet");
const compression = require("compression");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule, { rawBody: true });
    app.use((0, helmet_1.default)({
        crossOriginResourcePolicy: { policy: 'cross-origin' },
        contentSecurityPolicy: {
            directives: {
                ...helmet_1.default.contentSecurityPolicy.getDefaultDirectives(),
                'upgrade-insecure-requests': null,
            },
        },
    }));
    app.use(compression());
    app.enableShutdownHooks();
    const configService = app.get(config_1.ConfigService);
    app.setGlobalPrefix(configService.get('API_PREFIX') || 'api');
    app.enableVersioning({
        type: common_1.VersioningType.URI,
        defaultVersion: '1',
    });
    app.enableCors({
        origin: [
            configService.get('CORS_ORIGIN'),
            'https://endearing-taffy-91a2c6.netlify.app',
            ' https://local-business-listing-directory-production.up.railway.app',
            'http://process.env.NEXT_PUBLIC_API_URL',
            'https://yourdomain.com',
        ],
        credentials: true,
        methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Accept', 'Authorization', 'X-Requested-With'],
    });
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: {
            enableImplicitConversion: true,
        },
    }));
    app.useGlobalInterceptors(new common_1.ClassSerializerInterceptor(app.get(core_2.Reflector)));
    if (configService.get('NODE_ENV') !== 'production') {
        const config = new swagger_1.DocumentBuilder()
            .setTitle('Local Business Discovery Platform API')
            .setDescription('Hyperlocal business discovery platform API documentation')
            .setVersion('1.0')
            .addBearerAuth()
            .addTag('auth', 'Authentication endpoints')
            .addTag('users', 'User management')
            .addTag('vendors', 'Vendor management')
            .addTag('businesses', 'Business listings')
            .addTag('categories', 'Category management')
            .addTag('reviews', 'Reviews and ratings')
            .addTag('leads', 'Lead generation')
            .addTag('subscriptions', 'Subscription management')
            .addTag('search', 'Search functionality')
            .addTag('admin', 'Admin operations')
            .build();
        const document = swagger_1.SwaggerModule.createDocument(app, config);
        swagger_1.SwaggerModule.setup('api/docs', app, document);
    }
    const port = configService.get('PORT') || 3001;
    await app.listen(port, '0.0.0.0');
    console.log(`🚀 Application is running on: http://0.0.0.0:${port}`);
    console.log(`📚 API Documentation: https://yourdomain.com/api/docs`);
}
bootstrap();
//# sourceMappingURL=main.js.map

