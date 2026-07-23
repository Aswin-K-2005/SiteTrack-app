/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        "tertiary-fixed": "#d8e3fa",
        "secondary-container": "#42495a",
        "error-container": "#93000a",
        "surface-dim": "#0d131f",
        "surface-container": "#1a202c",
        "primary-container": "#ff7a19",
        "on-surface": "#dde2f3",
        "error": "#ffb4ab",
        "surface": "#0d131f",
        "surface-container-high": "#242a36",
        "secondary": "#c0c6db",
        "outline-variant": "#584236",
        "on-surface-variant": "#e0c0b0",
        "background": "#0d131f",
        "on-background": "#dde2f3",
        "surface-container-highest": "#2f3542",
        "primary": "#ffb68e",
        "surface-variant": "#2f3542",
        "on-primary": "#542200",
        "surface-container-lowest": "#080e1a",
        "surface-container-low": "#161c27",
      },
      fontFamily: {
        "headline-md": ["Archivo Narrow", "sans-serif"],
        "label-caps": ["Archivo Narrow", "sans-serif"],
        "body-md": ["Archivo Narrow", "sans-serif"],
        "mono-data": ["Courier Prime", "monospace"],
        "headline-sm": ["Archivo Narrow", "sans-serif"],
        "headline-lg": ["Archivo Narrow", "sans-serif"]
      },
    },
  },
  plugins: [],
}
