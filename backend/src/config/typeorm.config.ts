import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';

export const typeOrmConfig = (configService: ConfigService): TypeOrmModuleOptions => {
    const dbUrl = process.env.DATABASE_URL || configService.get<string>('DATABASE_URL');
    
    console.log('--- DEBUG: TYPEORM CONFIG START ---');
    
    if (dbUrl) {
        return {
            type: 'postgres',
            url: dbUrl,
            autoLoadEntities: true,
            synchronize: false,
            ssl: { rejectUnauthorized: false },
            logging: true,
        };
    }

    return {
        type: 'postgres',
        host: configService.get<string>('DB_HOST', 'your-db-host'),
        port: configService.get<number>('DB_PORT', 5432),
        username: configService.get<string>('DB_USERNAME', 'postgres'),
        password: configService.get<string>('DB_PASSWORD', 'postgres'),
        database: configService.get<string>('DB_DATABASE', 'railway'),
        autoLoadEntities: true,
        synchronize: false,
        ssl: configService.get<string>('DB_SSL') === 'true' ? { rejectUnauthorized: false } : false,
        logging: true,
    };
};
