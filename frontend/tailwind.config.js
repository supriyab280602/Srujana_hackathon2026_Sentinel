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
        // Institutional surfaces & workspaces
        background: '#F8FAFC', // Slate 50
        surface: '#FFFFFF',
        'surface-elevated': '#F1F5F9', // Slate 100
        'surface-subtle': '#F8FAFC',
        'surface-border': '#E2E8F0', // Slate 200
        'surface-border-strong': '#CBD5E1', // Slate 300

        // Institutional Fintech Brand (Restrained Corporate Navy)
        brand: {
          50:  '#EFF6FF',
          100: '#DBEAFE',
          200: '#BFDBFE',
          300: '#93C5FD',
          400: '#60A5FA',
          500: '#3B82F6',
          600: '#2563EB',
          700: '#1D4ED8',
          800: '#1E40AF',
          900: '#1E3A8A',
          950: '#0F172A', // Deep slate navy
        },

        // Disciplined Risk Signal Semantics
        risk: {
          low:      '#15803D', // Green 700
          'low-bg': '#F0FDF4', // Green 50
          medium:   '#B45309', // Amber 700
          'medium-bg': '#FFFBEB', // Amber 50
          high:     '#C2410C', // Orange 700
          'high-bg': '#FFF7ED', // Orange 50
          critical: '#B91C1C', // Red 700
          'critical-bg': '#FEF2F2', // Red 50
        },

        // Institutional Ink & Typography Hierarchy
        ink: {
          DEFAULT: '#0F172A', // Slate 900
          primary: '#0F172A',
          secondary: '#475569', // Slate 600
          muted: '#94A3B8', // Slate 400
          subtle: '#CBD5E1', // Slate 300
        },
      },
      fontFamily: {
        sans:  ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono:  ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
      boxShadow: {
        xs: '0 1px 2px 0 rgba(15, 23, 42, 0.04)',
        sm: '0 1px 3px 0 rgba(15, 23, 42, 0.06), 0 1px 2px -1px rgba(15, 23, 42, 0.04)',
        md: '0 4px 6px -1px rgba(15, 23, 42, 0.07), 0 2px 4px -2px rgba(15, 23, 42, 0.04)',
        card: '0 1px 3px 0 rgba(15, 23, 42, 0.05), 0 0 0 1px rgba(15, 23, 42, 0.04)',
        'card-hover': '0 4px 12px 0 rgba(15, 23, 42, 0.08), 0 0 0 1px rgba(15, 23, 42, 0.06)',
      },
      borderRadius: {
        card: '0.75rem', // 12px standard card radius
        badge: '0.375rem', // 6px
      },
    },
  },
  plugins: [],
}
