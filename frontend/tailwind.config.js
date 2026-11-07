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
        // Unique & Attractive White Aesthetic Palette
        brand: {
          rose: '#FF3366',
          roseHover: '#E01B52',
          roseLight: '#FF6B8B',
          coral: '#FF5E62',
          peach: '#FFA07A',
          blue: '#0284C7',
          sky: '#0EA5E9',
          indigo: '#4F46E5',
          amber: '#D97706',
          emerald: '#10B981',
          // Surfaces
          lightBg: '#F8FAFC',
          lightCard: '#FFFFFF',
          lightBorder: 'rgba(15, 23, 42, 0.07)',
          darkBg: '#090D16',
          darkCard: '#131926',
          darkBorder: 'rgba(255, 255, 255, 0.08)',
          // Typography
          ink: '#0F172A',
          subtext: '#475569',
          muted: '#64748B',
          textDark: '#F3F4F6',
          mutedDark: '#8E9BAE',
        },
        // Backward-compatible aliases
        app: {
          bg: '#F8FAFC',
          surface: '#FFFFFF',
          card: '#FFFFFF',
          cardHover: '#F8FAFC',
          border: 'rgba(15, 23, 42, 0.07)',
          rose: '#FF3366',
          roseHover: '#E01B52',
          roseLight: '#FF6B8B',
          coral: '#FF5E62',
          peach: '#FFA07A',
          blue: '#0284C7',
          mint: '#10B981',
          amber: '#D97706',
          red: '#EF4444',
          muted: '#64748B',
          text: '#0F172A',
        },
        radar: {
          bg: '#F8FAFC',
          surface: '#FFFFFF',
          card: '#FFFFFF',
          cardHover: '#F8FAFC',
          border: 'rgba(15, 23, 42, 0.07)',
          borderSubtle: 'rgba(15, 23, 42, 0.04)',
          borderHover: 'rgba(15, 23, 42, 0.15)',
          rose: '#FF3366',
          roseHover: '#E01B52',
          roseLight: '#FF6B8B',
          coral: '#FF5E62',
          peach: '#FFA07A',
          blue: '#0284C7',
          lime: '#FF3366',
          mint: '#10B981',
          amber: '#D97706',
          red: '#EF4444',
          muted: '#64748B',
          text: '#0F172A',
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace']
      },
      borderRadius: {
        '3xl': '24px',
        '4xl': '32px',
        '5xl': '40px',
      },
      boxShadow: {
        'dating-card': '0 20px 45px -12px rgba(15, 23, 42, 0.08), 0 1px 3px rgba(0, 0, 0, 0.04), 0 0 0 1px rgba(15, 23, 42, 0.05)',
        'dating-float': '0 10px 30px -5px rgba(15, 23, 42, 0.08)',
        'dating-glow': '0 0 25px -4px rgba(255, 51, 102, 0.45)',
        'dating-match': '0 10px 25px -2px rgba(255, 51, 102, 0.45)',
        'dating-pass': '0 8px 20px -4px rgba(239, 68, 68, 0.2)',
      },
      animation: {
        'radar-sweep': 'sweep 4s linear infinite',
        'subtle-pulse': 'pulse 2.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        sweep: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        }
      }
    },
  },
  plugins: [],
}
