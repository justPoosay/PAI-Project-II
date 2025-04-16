import type { Config } from 'tailwindcss';
import debugScreens from 'tailwindcss-debug-screens';

export default {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        vue: {
          black: {
            DEFAULT: '#181818',
            soft: '#222222',
            mute: '#282828',
            darker: '#161616',
            tooltip: '#0E0A09'
          },
          indigo: {
            DEFAULT: '#2c3e50'
          },
          white: {
            DEFAULT: '#ffffff',
            soft: '#f8f8f8',
            mute: '#f2f2f2'
          }
        }
      },
      fontFamily: {
        sf_mono: ['SF Mono', 'monospace'],
        sf_pro_rounded: ['SF Pro Rounded', 'Arial', 'sans-serif']
      }
    }
  },
  plugins: [
    debugScreens,
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
