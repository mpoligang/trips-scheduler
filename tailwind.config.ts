import typography from '@tailwindcss/typography';

const config = {
    plugins: [
        typography,
    ],
    darkMode: 'class',

    content: [
        "./pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
};

export default config;

