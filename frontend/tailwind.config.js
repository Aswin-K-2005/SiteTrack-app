/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        "tertiary-container": "#cb9800",
        "surface-container-low": "#141b2b",
        "secondary-container": "#00a572",
        "surface-container-lowest": "#070e1d",
        "on-error": "#690005",
        "inverse-surface": "#dce2f7",
        "on-surface-variant": "#e0c0b0",
        "primary-container": "#ff7a19",
        "on-primary": "#542200",
        "surface-tint": "#ffb68e",
        "outline-variant": "#584236",
        "on-secondary": "#003824",
        "on-surface": "#dce2f7",
        "error-container": "#93000a",
        "surface": "#0c1322",
        "background": "#0c1322",
        "secondary-fixed-dim": "#4edea3",
        "surface-container-highest": "#2e3545",
        "primary-fixed": "#ffdbca",
        "secondary-fixed": "#6ffbbe",
        "tertiary": "#f9bd22",
        "primary": "#ffb68e",
        "surface-dim": "#0c1322",
        "outline": "#a78b7d",
        "secondary": "#4edea3",
        "error": "#ffb4ab",
        "surface-container": "#191f2f",
        "surface-bright": "#323949",
        "surface-container-high": "#232a3a",
        "surface-variant": "#2e3545"
      },
      fontFamily: {
        "label-caps": ["Archivo Narrow", "sans-serif"],
        "headline-lg": ["Archivo Narrow", "sans-serif"],
        "body-md": ["Inter", "sans-serif"],
        "body-lg": ["Inter", "sans-serif"],
        "headline-sm": ["Archivo Narrow", "sans-serif"],
        "headline-md": ["Archivo Narrow", "sans-serif"],
        "data-display": ["Archivo Narrow", "sans-serif"]
      }
    },
  },
  plugins: [],
}
