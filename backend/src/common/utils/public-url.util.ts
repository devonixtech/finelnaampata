import { ConfigService } from '@nestjs/config';

export const DEFAULT_FRONTEND_URL = 'https://naampata.com';
export const DEFAULT_API_URL = 'https://local-business-listing-directory-production.up.railway.app/api/v1';
export const LOCAL_FRONTEND_ORIGINS = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:3001',
    'http://127.0.0.1:3001',
];

const trimTrailingSlash = (value: string) => value.replace(/\/+$/, '');

const normalizeOrigin = (value: string) => {
    try {
        const url = new URL(value);
        return trimTrailingSlash(`${url.protocol}//${url.host}`);
    } catch {
        return '';
    }
};

export const parsePublicOrigins = (...values: Array<string | undefined>) => {
    const origins = values
        .flatMap((value) => (value || '').split(','))
        .map((value) => normalizeOrigin(value.trim()))
        .filter((value) => value.length > 0);

    return [...new Set(origins)];
};

export const getFrontendOrigins = (configService: ConfigService) => {
    const configuredOrigins = parsePublicOrigins(
        configService.get<string>('FRONTEND_URL'),
        configService.get<string>('CORS_ORIGIN'),
        configService.get<string>('NEXT_PUBLIC_SITE_URL'),
    );

    return [...new Set([
        ...(configuredOrigins.length > 0 ? configuredOrigins : [DEFAULT_FRONTEND_URL]),
        ...LOCAL_FRONTEND_ORIGINS,
    ])];
};

export const isImplicitlyAllowedFrontendOrigin = (origin: string) => {
    if (!origin) {
        return true;
    }

    const cleanOrigin = trimTrailingSlash(origin);
    return (
        LOCAL_FRONTEND_ORIGINS.includes(cleanOrigin) ||
        cleanOrigin.endsWith('.netlify.app') ||
        cleanOrigin.endsWith('.up.railway.app') ||
        cleanOrigin.endsWith('.vercel.app') ||
        cleanOrigin === 'https://naampata.com' ||
        cleanOrigin === 'http://naampata.com' ||
        cleanOrigin.endsWith('.naampata.com') ||
        cleanOrigin === 'https://solvexxiasolutions.com' ||
        cleanOrigin === 'http://solvexxiasolutions.com' ||
        cleanOrigin.endsWith('.solvexxiasolutions.com') ||
        cleanOrigin === 'https://solvexiasolutions.com' ||
        cleanOrigin === 'http://solvexiasolutions.com' ||
        cleanOrigin.endsWith('.solvexiasolutions.com')
    );
};

export const getPrimaryFrontendUrl = (configService: ConfigService, requestOrigin?: string) => {
    const requestBase = requestOrigin ? normalizeOrigin(requestOrigin) : '';
    if (requestBase) {
        return requestBase;
    }

    return getFrontendOrigins(configService)[0] || DEFAULT_FRONTEND_URL;
};
