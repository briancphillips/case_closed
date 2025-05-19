/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        detective: ["Courier New", "monospace"], // Example custom font
      },
    },
  },
  plugins: [],
};
