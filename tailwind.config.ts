import type { Config } from 'tailwindcss'
 
const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-nunito)', 'Nunito', 'sans-serif'],
        display: ['var(--font-poppins)', 'Poppins', 'sans-serif'],
      },
      colors: {
        brand: {
          pink:          '#e91e8c',
          'pink-dark':   '#c4176e',
          'pink-light':  '#f06ec0',
          purple:        '#7b2fd4',
          'purple-light':'#9b72cf',
          yellow:        '#FFBE00',
        },
      },
      boxShadow: {
        card:       '0 4px 24px rgba(123,47,212,0.08)',
        'card-hover':'0 8px 32px rgba(233,30,140,0.15)',
      },
    },
  },
  plugins: [],
}
 
export default config