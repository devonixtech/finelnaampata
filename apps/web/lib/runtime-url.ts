const PRODUCTION_ORIGIN = 'https://local-business-listing-directory-production.up.railway.app';
export const PRODUCTION_API_URL = `${PRODUCTION_ORIGIN}/api/v1`;
export const PRODUCTION_SITE_URL = 'https://endearing-taffy-91a2c6.netlify.app';

const LOOPBACK_ALIAS = ['local', 'host'].join('');
const LOOPBACK_IPV4 = [127, 0, 0, 1].join('.');
const LOOPBACK_HOSTS = new Set([LOOPBACK_ALIAS, LOOPBACK_IPV4, '::1']);

const trimTrailingSlashes = (value: string) => value.replace(/\/+$/, '');

export const isLoopbackHostname = (hostname: string) =>
    LOOPBACK_HOSTS.has(hostname) || hostname.startsWith('127.');

export const isLoopbackUrl = (value: string) => {
    try {
        return isLoopbackHostname(new URL(value).hostname);
    } catch {
        return false;
    }
};

export const stripApiPath = (value: string) => {
    const trimmed = trimTrailingSlashes(value);
    const apiIndex = trimmed.indexOf('/api');
    return apiIndex >= 0 ? trimmed.slice(0, apiIndex) : trimmed;
};

const replaceLoopbackHost = (value: string) => {
    if (typeof window === 'undefined') {
        return trimTrailingSlashes(value);
    }

    try {
        const url = new URL(value);
        const browserHost = window.location.hostname;

        if (isLoopbackHostname(url.hostname) && browserHost && !isLoopbackHostname(browserHost)) {
            url.hostname = browserHost;

            if (!url.port && window.location.port) {
                url.port = window.location.port;
            }
        }

        return trimTrailingSlashes(url.toString());
    } catch {
        return trimTrailingSlashes(value);
    }
};

export const getBrowserOriginForPort = (port: number) => {
    if (typeof window === 'undefined') {
        return PRODUCTION_ORIGIN;
    }

    const url = new URL(window.location.origin);
    url.port = String(port);
    return trimTrailingSlashes(url.toString());
};

export const resolveRuntimeUrl = (value: string | undefined, fallback: string) => {
    const candidate = value?.trim() || fallback;
    return replaceLoopbackHost(candidate);
};

export const resolveApiBaseUrl = (value: string | undefined) =>
    resolveRuntimeUrl(value, PRODUCTION_API_URL);

export const resolveApiOrigin = (value: string | undefined) =>
    stripApiPath(resolveApiBaseUrl(value));

export const resolveSocketOrigin = (value: string | undefined) =>
    resolveRuntimeUrl(value, getBrowserOriginForPort(3001));
