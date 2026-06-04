/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './index.html',
    './admin/index.html',
    './js/**/*.js'
  ],
  darkMode: 'class',
  // Category gradients are data-driven (chosen in admin) so we keep them safe from purge.
  safelist: [
    'from-pink-400', 'to-purple-500',
    'from-red-400', 'to-orange-500',
    'from-yellow-400', 'to-amber-500',
    'from-blue-400', 'to-indigo-500',
    'from-blue-400', 'to-cyan-500',
    'from-pink-400', 'to-rose-500',
    'from-green-400', 'to-teal-500',
    'from-green-400', 'to-emerald-500',
    'from-purple-400', 'to-violet-500'
  ],
  theme: {
    extend: {
      fontFamily: { bengali: ['"Noto Sans Bengali"', 'sans-serif'] },
      animation: {
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'bounce-soft': 'bounce-soft 2s ease-in-out infinite'
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 20px rgba(34,197,94,0.5), 0 4px 15px rgba(0,0,0,0.1)' },
          '50%': { boxShadow: '0 0 35px rgba(34,197,94,0.9), 0 4px 20px rgba(0,0,0,0.15)' }
        },
        'bounce-soft': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-4px)' }
        }
      }
    }
  },
  plugins: []
};
