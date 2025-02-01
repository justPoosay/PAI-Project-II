import debugScreens from "tailwindcss-debug-screens";

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
            "mute": "#282828",
            "darker": "#161616",
            "tooltip": "#0E0A09"
          },
          "indigo": {
            "DEFAULT": "#2c3e50",
          },
          "white": {
            "DEFAULT": "#ffffff",
            "soft": "#f8f8f8",
            "mute": "#f2f2f2",
          },
        },
      },
      fontFamily: {
        "monaspace_neon": ["Monaspace Neon", "Monaspace Radon", "monospace"],
        "monaspace_radon": ["Monaspace Radon", "Monaspace Neon", "monospace"],
        "sf_pro_rounded": ["SF Pro Rounded", "Arial", "sans-serif"],
      },
    },
  },
  plugins: [
    debugScreens,
  ],
} satisfies import("tailwindcss").Config;