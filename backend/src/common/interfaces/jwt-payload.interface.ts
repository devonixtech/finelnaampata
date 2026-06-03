import { UserRole } from '../../entities/user.entity';

export interface JwtPayload {
    sub: string; // User ID
    email: string;
    role: UserRole;
    jti?: string; // Unique token ID for session tracking
    iat?: number;
    exp?: number;
}

export interface JwtTokens {
    accessToken: string;
    refreshToken: string;
}
