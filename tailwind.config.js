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
      },
    },
  },
  plugins: [],
}
