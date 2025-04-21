import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sf_mono: ['SF Mono', 'monospace'],
        sf_pro_rounded: ['SF Pro Rounded', 'Arial', 'sans-serif']
      }
    }
  },
  plugins: [
    function ({ addVariant }) {
      addVariant('light', '@media (prefers-color-scheme: light)');
    },
    function ({ addUtilities }) {
      addUtilities(
        {
          '.border-gradient-to-r': {
            borderImageSlice: '1',
            borderImageSource: 'linear-gradient(to right, var(--tw-gradient-stops))'
          }
        },
        {
          variants: ['responsive']
        }
      );
    }
  ]
} satisfies Config;
