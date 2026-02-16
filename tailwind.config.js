/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all of your component files.
  content: ["./app/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // Primary Palette
        primary: {
          DEFAULT: "#0F766E", // Deep Teal
          hover: "#0D9488", // Ocean Teal
          light: "#14B8A6", // Soft Teal
        },
        accent: "#5EEAD4", // Mint

        // Backgrounds
        background: {
          DEFAULT: "#F9FAFB", // Very Light Gray
          card: "#FFFFFF", // White
        },

        // Borders
        border: {
          DEFAULT: "#E2E8F0", // Soft Border
        },

        // Text
        text: {
          primary: "#0F172A", // Dark Slate
          secondary: "#475569", // Slate Gray
          tertiary: "#64748B", // Muted Gray
        },

        // Status Colors
        error: {
          DEFAULT: "#EF4444", // Soft Red
          light: "#FEE2E2", // Error Light
        },
        success: {
          DEFAULT: "#22C55E", // Medical Green
          light: "#D1FAE5", // Success Light
        },
        warning: {
          DEFAULT: "#F59E0B", // Amber
          light: "#FEF3C7", // Warning Light
        },

        // Dark Mode
        dark: {
          background: "#0B1120", // Deep Navy
          card: "#1E293B", // Slate
          border: "#334155", // Subtle Gray
          primary: "#14B8A6", // Ocean Teal
          "primary-hover": "#2DD4BF", // Bright Teal
          accent: "#5EEAD4", // Mint
          "text-primary": "#F1F5F9", // Off White
          "text-secondary": "#94A3B8", // Light Slate
          "text-tertiary": "#64748B", // Muted Slate
        },
      },
    },
  },
  plugins: [],
};
