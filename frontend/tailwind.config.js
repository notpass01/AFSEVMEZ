/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        gold:    { DEFAULT: "#D4AF37", light: "#F0C842", dark: "#A8882A" },
        casino:  { bg: "#0D0D0D", card: "#1A1A2E", border: "#2A2A4A" },
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
        display: ["Playfair Display", "serif"],
      },
      animation: {
        "spin-slow": "spin 3s linear infinite",
        "pulse-gold": "pulse 2s cubic-bezier(0.4,0,0.6,1) infinite",
        "slide-up": "slideUp 0.3s ease-out",
      },
      keyframes: {
        slideUp: {
          "0%": { transform: "translateY(20px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};
