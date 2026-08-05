const isStaticExport = process.env.STATIC_EXPORT === 'true' && process.env.NODE_ENV !== 'development';

const nextConfig = {
    allowedDevOrigins: ['127.0.0.1', 'localhost'],
    images: {
        unoptimized: true,
    },
    trailingSlash: isStaticExport,
    output: isStaticExport ? 'export' : 'standalone',
    // assetPrefix removed - PHP router handles all static file serving
    typescript: {
        ignoreBuildErrors: true,
    },
};

export default nextConfig;
