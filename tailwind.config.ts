import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: ["./client/src/**/*.{ts,tsx}", "./client/index.html"],
  theme: {
    extend: {
      colors: {
        background: "#0B0B0F",
        surface: "#13131A",
        "surface-2": "#1A1A24",
        border: "#2A2A3A",
        primary: "#6366F1",
        accent: "#8B5CF6",
        muted: "#6B7280",
        foreground: "#F9FAFB",
        success: "#10B981",
        warning: "#F59E0B",
        danger: "#EF4444",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
