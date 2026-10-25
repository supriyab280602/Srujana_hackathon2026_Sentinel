/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Light design system
        background: '#F8F9FB',
        surface: '#FFFFFF',
        'surface-elevated': '#F1F3F7',
        'surface-border': '#E2E6EE',
        'surface-border-strong': '#CBD3E0',

        // Brand: refined indigo-blue
        brand: {
          50:  '#EFF4FF',
          100: '#DBE8FE',
          200: '#BFCFFE',
          400: '#6B8EF8',
          500: '#4B6EF5',
          600: '#3B57D8',
          700: '#2D43B0',
          800: '#1E2D78',
          950: '#0F1945',
        },

        // Risk signal colors — kept vivid for meaning
        risk: {
          low:      '#16A34A',
          medium:   '#D97706',
          high:     '#DC4E1B',
          critical: '#B91C1C',
        },

        // Text hierarchy
        ink: {
          DEFAULT: '#111827',
          secondary: '#4B5563',
          muted: '#9CA3AF',
          placeholder: '#D1D5DB',
        },
      },
      fontFamily: {
        serif: ['Newsreader', 'Georgia', 'serif'],
        sans:  ['Inter', 'system-ui', 'sans-serif'],
        mono:  ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        card:   '0 1px 3px rgba(0,0,0,0.07), 0 1px 2px rgba(0,0,0,0.05)',
        'card-md': '0 4px 12px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.05)',
        'card-lg': '0 8px 24px rgba(0,0,0,0.10), 0 2px 6px rgba(0,0,0,0.06)',
      },
    },
  },
  plugins: [],
}
