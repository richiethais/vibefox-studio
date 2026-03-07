/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg:     '#f5f3f0',
        bg2:    '#edeae5',
        light:  '#faf9f7',
        dark:   '#18181a',
        dark2:  '#2a2830',
        gold:   '#c8a97e',
        gold2:  '#b8906a',
        muted:  '#7a7888',
        vtext:  '#3a3840',
        border: 'rgba(0,0,0,0.08)',
      },
      fontFamily: {
        serif: ['"DM Serif Display"', 'serif'],
        sans:  ['"DM Sans"', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
