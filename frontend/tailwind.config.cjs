/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#000000",             
        surface: "#0d0d0d",                
        "surface-container-lowest": "#000000",
        "surface-container-low": "#0d0d0d",
        "surface-container": "#141414",    
        "surface-container-high": "#1f1f1f", 
        "surface-container-highest": "#2a2a2a", 
        "surface-variant": "#111111",      
        "on-surface": "#ffffff",           
        "on-surface-variant": "#9ca3af",   
        outline: "#404040",                
        "outline-variant": "#262626",      
        
        // HEAVY MACHINERY ACCENTS
        primary: "#FF5A00",                // Safety Orange 
        "primary-container": "#FF5A00",    // Makes dashboard numbers pop!
        "on-primary": "#000000",
        "on-primary-container": "#ffffff",
        
        // RETAINED FUNCTIONAL COLORS
        secondary: "#4edea3",              // Tracker Green
        "secondary-container": "#1a2e21",
        "on-secondary": "#ffffff",
        error: "#ff5449",                  // Tracker Red
        "error-container": "#410002",
        "on-error-container": "#ffdad6",
        warning: "#FFD700",                
        tertiary: "#FF5A00",               
        "tertiary-container": "#3d1600"
      },
      fontFamily: {
        headline: ['"Chakra Petch"', 'sans-serif'],
        body: ['"Barlow"', 'sans-serif'],
        label: ['"JetBrains Mono"', 'monospace'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
}
