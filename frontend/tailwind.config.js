/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#0F172A', // Slate 900
          foreground: '#FFFFFF',
        },
        secondary: {
          DEFAULT: '#F1F5F9', // Slate 100
          foreground: '#0F172A',
        },
        accent: {
          DEFAULT: '#3B82F6', // Blue 500
          foreground: '#FFFFFF',
        },
        background: '#F8FAFC', // Slate 50
        surface: '#FFFFFF',
        success: '#10B981', // Emerald 500
        warning: '#F59E0B', // Amber 500
        error: '#EF4444', // Red 500

        // Dashboard Theme (Admin)
        primary: {
          DEFAULT: '#2a77f4', // Admin Blue from Dashboard Design
          foreground: '#FFFFFF',
        },
        'admin-bg': '#f5f7f8', // Dashboard light Gray

        // Brand/Public Theme (Login/Station)
        brand: {
          DEFAULT: '#f9f506', // Neon Yellow
          foreground: '#0F172A',
        },
        'bg-light': '#f8f8f5',
        'bg-dark': '#23220f',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['"Spline Sans"', 'sans-serif'],
      },
      borderRadius: {
        lg: `var(--radius)`,
        md: `calc(var(--radius) - 2px)`,
        sm: `calc(var(--radius) - 4px)`,
      },
    },
  },
  plugins: [],
}
