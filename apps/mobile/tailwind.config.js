/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        sand: {
          50: "#FAF7F4",
          100: "#F5F0EB",
          200: "#E8DDD4",
          300: "#D4C4B5",
          400: "#B8A090",
          500: "#9A8070",
          600: "#7A6558",
          700: "#5C4D42",
          800: "#3E342C",
          900: "#201B17",
        },
        sage: {
          400: "#8FA88A",
          500: "#6B8F71",
          600: "#527058",
        },
        clay: {
          400: "#C4A484",
          500: "#A8856A",
        },
      },
      fontFamily: {
        sans: ["System"],
      },
    },
  },
  plugins: [],
};
