/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        base: '#f5f6f8',
        surface: '#ffffff',
        header: '#f1f3f5',
        'row-alt': '#fafbfc',
        'row-hover': '#eef2f7',
        border: '#d1d5db',
        'border-focus': '#2563eb',
        primary: '#111827',
        secondary: '#4b5563',
        dim: '#9ca3af',
        accent: '#2563eb',
        green: '#059669',
        amber: '#d97706',
        red: '#dc2626',
        komisyon: '#059669',
      },
      fontFamily: {
        ui: ['Inter', 'system-ui', 'sans-serif'],
        data: ['JetBrains Mono', 'monospace'],
      },
      fontSize: {
        xs: '11px',
        sm: '12px',
        base: '13px',
        lg: '15px',
      },
    },
  },
  plugins: [],
}
