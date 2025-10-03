/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all of your component files.
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      fontFamily: {
        inter: ["Inter"],
      },
      colors: {
        // Primary colors
        primary: {
          dark: "#004D33",
          DEFAULT: "#027A48",
          light: "#E6F5EF",
        },
        // Grayscale
        gray: {
          900: "#2D3035",
          800: "#6A737D",
          100: "#F5F5F5",
          50: "#FFFFFF",
        },
      },
      fontSize: {
        "heading-xl": ["28px", { lineHeight: "42px", letterSpacing: "0.3px" }],
        "heading-large": [
          "24px",
          { lineHeight: "36px", letterSpacing: "0.3px" },
        ],
        "heading-medium": [
          "20px",
          { lineHeight: "30px", letterSpacing: "0.3px" },
        ],
        body: ["13px", { lineHeight: "140%" }],
        button: ["14px", { lineHeight: "20px", letterSpacing: "-0.15px" }],
        text: ["14px", { lineHeight: "20px", letterSpacing: "-0.15px" }],
      },
    },
  },
  plugins: [],
};
