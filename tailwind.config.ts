import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "bw-black":    "#000000",
        "bw-deep":     "#080808",
        "bw-card":     "#111111",
        "bw-surface":  "#1a1a1a",
        "bw-border":   "#2a2a2a",
        "bw-muted":    "#404040",
        "bw-subtle":   "#606060",
        "bw-secondary":"#909090",
        "bw-primary":  "#c8c8c8",
        "bw-white":    "#ffffff",
        "bw-silver":   "#e0e0e0",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      keyframes: {
        shake: {
          "0%,100%": { transform: "translateX(0)" },
          "20%":     { transform: "translateX(-8px)" },
          "40%":     { transform: "translateX(8px)" },
          "60%":     { transform: "translateX(-5px)" },
          "80%":     { transform: "translateX(5px)" },
        },
        "glow-pulse": {
          "0%,100%": { boxShadow: "0 0 20px rgba(255,255,255,0.1)" },
          "50%":     { boxShadow: "0 0 40px rgba(255,255,255,0.25)" },
        },
        "border-spin": {
          "100%": { transform: "rotate(360deg)" },
        },
        "float": {
          "0%,100%": { transform: "translateY(0px)" },
          "50%":     { transform: "translateY(-10px)" },
        },
        "scanline": {
          "0%":   { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100vh)" },
        },
        "flicker": {
          "0%,100%": { opacity: "1" },
          "50%":     { opacity: "0.85" },
        },
      },
      animation: {
        shake:        "shake 0.5s ease-in-out",
        "glow-pulse": "glow-pulse 2s ease-in-out infinite",
        "border-spin":"border-spin 4s linear infinite",
        float:        "float 3s ease-in-out infinite",
        scanline:     "scanline 8s linear infinite",
        flicker:      "flicker 4s ease-in-out infinite",
      },
      backgroundImage: {
        "gradient-radial":      "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":       "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
        "noise":                "url('/noise.svg')",
      },
      boxShadow: {
        "white-glow-sm": "0 0 10px rgba(255,255,255,0.1)",
        "white-glow":    "0 0 25px rgba(255,255,255,0.15)",
        "white-glow-lg": "0 0 50px rgba(255,255,255,0.2)",
        "inner-glow":    "inset 0 0 30px rgba(255,255,255,0.05)",
      },
    },
  },
  plugins: [],
};

export default config;
