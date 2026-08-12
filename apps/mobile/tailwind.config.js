/** @type {import('tailwindcss').Config} */
/** Creative Watermelon — Pastek Art design tokens */
module.exports = {
  darkMode: "class",
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        /** Crème / fond chaud (ex-sand) */
        sand: {
          50: "#FAF5EF",
          100: "#F3EBE0",
          200: "#E8DDD0",
          300: "#D9C8B4",
          400: "#C4A98E",
          500: "#A88B6E",
          600: "#8A7058",
          700: "#6B5644",
          800: "#4A3C32",
          900: "#333333",
        },
        /** Écorce / sage (pastel rind) */
        sage: {
          50: "#EAF6EF",
          100: "#D4EDDA",
          200: "#B8DCC6",
          300: "#96C5AB",
          400: "#8FB59A",
          500: "#78A58D",
          600: "#5F8A74",
          700: "#4A6F5C",
          800: "#385547",
          900: "#2A3F35",
        },
        /** Pastèque — accent primaire vibrant */
        melon: {
          50: "#FFF0F0",
          100: "#FFE0E0",
          200: "#FCBBBB",
          300: "#FA9A9A",
          400: "#F98A8A",
          500: "#F87A7A",
          600: "#E55F5F",
          700: "#C94747",
        },
        /** Ocre / sable créatif */
        clay: {
          300: "#EDD9BC",
          400: "#E4C79F",
          500: "#D4B07E",
        },
        mint: {
          50: "#F2FAF4",
          100: "#D4EDDA",
          200: "#B8DCC6",
        },
      },
      borderRadius: {
        lg: "16px",
        xl: "20px",
        "2xl": "24px",
        "3xl": "28px",
      },
      fontFamily: {
        sans: ["Nunito Sans", "System"],
        display: ["Lora", "Georgia", "serif"],
      },
      boxShadow: {
        card: "0 4px 24px rgba(120, 165, 141, 0.10)",
        "card-md": "0 10px 36px rgba(120, 165, 141, 0.14)",
        pill: "0 10px 28px -10px rgba(248, 122, 122, 0.55)",
        melon: "0 12px 32px -12px rgba(248, 122, 122, 0.5)",
      },
    },
  },
  plugins: [],
};
