/** @type {import("tailwindcss").Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        "vue": {
          "black": {
            "DEFAULT": "#181818",
            "soft": "#222222",
            "mute": "#282828"
          },
          "indigo": "#2c3e50",
          "white": {
            "DEFAULT": "#ffffff",
            "soft": "#f8f8f8",
            "mute": "#f2f2f2"
          }
        }
      }
    },
  },
  plugins: [],
};