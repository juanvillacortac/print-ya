import { defineConfig } from 'windicss/helpers'
import filters from 'windicss/plugin/filters'
import forms from 'windicss/plugin/forms'
import aspectRatio from 'windicss/plugin/aspect-ratio'
import lineClamp from 'windicss/plugin/line-clamp'
import typography from 'windicss/plugin/typography'
import animate from '@windicss/plugin-animations'

const colors = {}

export default defineConfig({
  darkMode: 'class', // or 'media'
  theme: {
    extend: {
      screens: {
        sm: '640px',
        md: '768px',
        lg: '1024px',
        xl: '1280px',
        '2xl': '1536px',
      },
      colors,
      fontFamily: {
        title: ['Montserrat', 'sans-serif'],
        logo: ['Square Peg', 'sans-serif'],
      },
      spacing: {
        128: '32rem',
        144: '36rem',
      },
      borderRadius: {
        '4xl': '2rem',
      },
    },
  },
  plugins: [filters, forms, aspectRatio, lineClamp, typography, animate],
})
