import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // ZeroPulse Design System
        pulse: {
          bg:       "#080C14",   // deep space navy
          surface:  "#0E1420",   // card surface
          border:   "#1A2235",   // subtle border
          muted:    "#1E2A3D",   // hover/muted surface
          cyan:     "#00D4FF",   // primary accent – electric cyan
          "cyan-dim": "#00D4FF22",
          green:    "#00FF88",   // UP status
          "green-dim": "#00FF8818",
          red:      "#FF4466",   // DOWN status
          "red-dim":   "#FF446618",
          amber:    "#FFB020",   // warning
          "amber-dim": "#FFB02018",
          text:     "#E2E8F4",   // primary text
          muted2:   "#5A6A84",   // secondary text
          dim:      "#3A4A60",   // tertiary text
        },
      },
      fontFamily: {
        mono: ["'Geist Mono'", "monospace"],
        sans: ["'Geist'", "system-ui", "sans-serif"],
      },
      keyframes: {
        pulse_ring: {
          "0%":   { transform: "scale(1)", opacity: "1" },
          "100%": { transform: "scale(2.2)", opacity: "0" },
        },
        shimmer: {
          "0%":   { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        fadeInUp: {
          "0%":   { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        blink: {
          "0%, 100%": { opacity: "1" },
          "50%":      { opacity: "0.2" },
        },
      },
      animation: {
        pulse_ring: "pulse_ring 1.5s cubic-bezier(0.4,0,0.6,1) infinite",
        shimmer:    "shimmer 2s linear infinite",
        fadeInUp:   "fadeInUp 0.4s ease-out forwards",
        blink:      "blink 1.4s ease-in-out infinite",
      },
      backgroundImage: {
        "grid-pattern":
          "linear-gradient(rgba(0,212,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,0.03) 1px, transparent 1px)",
        "shimmer-gradient":
          "linear-gradient(90deg, transparent 0%, rgba(0,212,255,0.08) 50%, transparent 100%)",
      },
      backgroundSize: {
        "grid-size": "40px 40px",
      },
      boxShadow: {
        "cyan-glow": "0 0 20px rgba(0,212,255,0.15)",
        "green-glow": "0 0 20px rgba(0,255,136,0.15)",
        "card": "0 1px 3px rgba(0,0,0,0.4), 0 0 0 1px rgba(26,34,53,1)",
      },
    },
  },
  plugins: [],
};

export default config;
