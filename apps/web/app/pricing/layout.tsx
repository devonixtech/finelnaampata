import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Pricing | naampata",
    description:
        "Choose the right plan for your local business. Start with a free listing or upgrade to paid monthly/yearly plans. Prices are admin-configured and can be updated anytime.",
};

export default function PricingLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
