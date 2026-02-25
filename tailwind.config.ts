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
        rpg: {
          bg: "#0f0f23",
          panel: "#1a1a2e",
          border: "#e0d5c1",
          "border-inner": "#4a4a6a",
          gold: "#f0c040",
          text: "#e0d5c1",
          green: "#40c040",
          blue: "#4080c0",
        },
      },
      fontFamily: {
        pixel: ['"Press Start 2P"', "cursive"],
        vt323: ['"VT323"', "monospace"],
      },
    },
  },
  plugins: [],
};
export default config;
