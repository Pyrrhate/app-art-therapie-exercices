/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        sand: {
          50: "#F7F5F0",
          100: "#F0EBE4",
          200: "#E8DDD4",
          300: "#D4C4B5",
          400: "#B8A090",
          500: "#9A8070",
          600: "#7A6558",
          700: "#5C4D42",
          800: "#3E342C",
          900: "#2A2F28",
        },
        sage: {
          50: "#F2F7F3",
          100: "#E3EDE5",
          300: "#9BB5A0",
          400: "#8FA88A",
          500: "#496349",
          600: "#3D5441",
          700: "#2F4232",
        },
        clay: {
          400: "#C4A484",
          500: "#A8856A",
        },
      },
      fontFamily: {
        sans: ["Nunito Sans", "System"],
        display: ["Lora", "Georgia", "serif"],
      },
      boxShadow: {
        card: "0 2px 20px rgba(73, 99, 73, 0.06)",
        "card-md": "0 8px 30px rgba(73, 99, 73, 0.12)",
        pill: "0 8px 30px -12px rgba(73, 99, 73, 0.5)",
      },
    },
  },
  plugins: [],
};
