/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // ACM Biolabs Brand Colors
        acm: {
          brand: '#376092',        // Primary brand blue
          'brand-dark': '#31547a', // Dark blue
          gold: '#d19124',         // Primary gold
          'gold-light': '#e8a534', // Lighter gold
          yellow: '#f2cf00',       // Brand yellow
          gray: '#757474',         // Brand gray
          'gray-light': '#e8e8e8', // Light gray
          'gray-lighter': '#f4f4f4', // Lighter gray
          'gray-lightest': '#fafafa', // Lightest gray
          'text-default': '#2b2b2b', // Default text
          'blue-light': '#6d8a9b',
          'blue-lighter': '#82a0b1',
          'blue-lightest': '#a0b3be',
        },
        // Keep LLM-specific colors for result cards
        claude: {
          DEFAULT: '#4F46E5',
          light: '#6366F1',
        },
        openai: {
          DEFAULT: '#10A37F',
          light: '#1A9675',
        },
        gemini: {
          DEFAULT: '#DC2626',
          light: '#EF4444',
        },
        grok: {
          DEFAULT: '#8B5CF6',
          light: '#A78BFA',
        },
        ollama: {
          DEFAULT: '#4C1D95',
          light: '#6D28D9',
        },
      },
    },
  },
  plugins: [],
}
