/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        medical: {
          primary: '#00A6B8',     // Teal - màu chính cho y tế
          secondary: '#4A90E2',   // Blue - màu phụ
          accent: '#26C6DA',      // Light teal - màu nhấn
          success: '#4CAF50',     // Green - thành công
          warning: '#FF9800',     // Orange - cảnh báo
          danger: '#F44336',      // Red - nguy hiểm
          light: '#F5F7FA',       // Light gray - nền sáng
          dark: '#2C3E50',        // Dark blue-gray - text đậm
          muted: '#95A5A6',       // Gray - text nhạt
        },
        // Medical gradient colors
        gradient: {
          start: '#00A6B8',
          middle: '#4A90E2',
          end: '#26C6DA',
        }
      },
      backgroundImage: {
        'medical-gradient': 'linear-gradient(135deg, #00A6B8 0%, #4A90E2 50%, #26C6DA 100%)',
        'medical-gradient-light': 'linear-gradient(135deg, #E0F7FA 0%, #E3F2FD 50%, #E0F2F1 100%)',
      }
    },
  },
  plugins: [],
  important: true,
  corePlugins: {
    preflight: false,
  }
}