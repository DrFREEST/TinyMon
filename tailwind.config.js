/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,js,vue}"],
  theme: {
    colors: {
      'primary': '#aab97d',
      'secondary': '#d3dbb2',
      'accent': '#d48b48',
      'dark': '#1d1d1d',
      'dark-page': '#121212',
      'positive': '#21ba45',
      'negative': '#c10015',
      'info': '#31ccec',
      'warning': '#f2c037',
    },
    screens: {
      '2xs': '256px',
      'xs': '320px',
      'sm': '640px',
      'md': '768px',
      'lg': '1024px',
      'xl': '1280px',
      '2xl': '1600px',
      '3xl': '1920px',
      '4xl': '2240px',
      '5xl': '2560px',
      '6xl': '2880px',
      '7xl': '3200px',
    },
  },
  plugins: [
    require('@tailwindcss/container-queries'),
    require('@tailwindcss/typography'),
  ],
  prefix: "tw-",
  // important: true,
}

