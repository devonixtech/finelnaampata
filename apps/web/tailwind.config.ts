import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: {
                    DEFAULT: '#667eea',
                    50: '#f5f7ff',
                    100: '#ebf0fe',
                    200: '#dae3fd',
                    300: '#bbcbfa',
                    400: '#91aaf6',
                    500: '#667eea', // Main primary color
                    600: '#4c5edb',
                    700: '#3d4bb9',
                    800: '#353e96',
                    900: '#2f3778',
                },
                accent: {
                    500: '#764ba2', // Main accent color
                }
            },
            fontFamily: {
                sans: ["var(--font-roboto)", "Roboto", "system-ui", "-apple-system", "BlinkMacSystemFont", '"Segoe UI"', "Helvetica", "Arial", "sans-serif"],
            },
            backgroundImage: {
                "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
                "gradient-conic":
                    "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
            },
            backdropBlur: {
                xs: '2px',
            },
        },
    },
    plugins: [require('@tailwindcss/typography')],
};
export default config;
