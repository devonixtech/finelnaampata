import "./globals.css";
import { AuthProvider } from "../context/AuthContext";
import { SocketProvider } from "../context/SocketContext";
import { Toaster } from 'react-hot-toast';
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import "leaflet/dist/leaflet.css";
import { PRODUCTION_SITE_URL } from "../lib/runtime-url";

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 
    PRODUCTION_SITE_URL;

export const metadata = {
    metadataBase: new URL(baseUrl),
    title: "naampata | Find Local Businesses",
    description:
        "Discover the best local businesses, services, and products in your neighborhood.",
    alternates: {
        canonical: "/",
    },
    openGraph: {
        title: "naampata | Find Local Businesses",
        description: "Discover the best local businesses, services, and products in your neighborhood.",
        url: baseUrl,
        siteName: "naampata",
        locale: "en_US",
        type: "website",
    },
    twitter: {
        card: "summary_large_image",
        title: "naampata | Find Local Businesses",
        description: "Discover the best local businesses, services, and products in your neighborhood.",
    },
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body
                className="bg-white text-slate-900 min-h-screen antialiased"
                suppressHydrationWarning
            >
                <AuthProvider>
                    <SocketProvider>{children}</SocketProvider>
                </AuthProvider>
                <Toaster position="top-center" />
            </body>
        </html>
    );
}
