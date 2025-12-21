/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        black: "#111111",
        gray: {
          900: "#1C1C1C",
          700: "#4B4B4B",
          500: "#8A8A8A",
          300: "#D1D1D1",
          100: "#F2F2F2",
        },
        whitesmoke: "#F7F7F7",
        accent: {
          sand: "#E6E1DA",
        },
      },
      fontFamily: {
        heading: ["Poppins", "system-ui", "sans-serif"],
        body: ["Roboto", "system-ui", "sans-serif"],
      },
      borderRadius: {
        sm: "6px",
        md: "8px",
      },
      spacing: {
        section: "96px",
      },
    },
  },
  plugins: [],
}