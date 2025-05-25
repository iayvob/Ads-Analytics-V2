/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    // add this if you use @apply in styles/
    './styles/**/*.css',
  ],
  theme: {
    extend: {
      // Optionally define a Tailwind color that references your CSS var:
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        border: 'hsl(var(--border))',
      },
    },
  },
  plugins: [],
};
