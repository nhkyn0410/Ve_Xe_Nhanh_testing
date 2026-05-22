/** @type {import('tailwindcss').Config} */
import { designSystem } from './src/styles/design-system.js';

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: designSystem.colors.primary,
        secondary: designSystem.colors.secondary,
        accent: designSystem.colors.accent,
        'vxn-teal': designSystem.colors.teal,
        'vxn-saffron': designSystem.colors.saffron,
        'vxn-bg': designSystem.colors.background,
        'vxn-border': designSystem.colors.border,
        'vxn-ink': '#181C22',
        'vxn-fg': {
          1: '#2D3138',
          2: '#404753',
          3: '#475569',
          4: '#5E6165',
          5: '#64748B',
          disabled: '#AEAFB3',
        },
        success: designSystem.colors.success,
        warning: designSystem.colors.warning,
        error: designSystem.colors.error,
        neutral: designSystem.colors.neutral,
      },
      fontFamily: designSystem.typography.fontFamily,
      fontSize: designSystem.typography.fontSize,
      fontWeight: designSystem.typography.fontWeight,
      spacing: designSystem.spacing,
      borderRadius: designSystem.borderRadius,
      boxShadow: designSystem.boxShadow,
      screens: designSystem.screens,
      maxWidth: {
        '8xl': '88rem', // 1408px - Wider than 7xl (1280px) but not full width
        '9xl': '96rem', // 1536px - Even wider option
      },
      animation: designSystem.animation,
      backgroundImage: {
        'gradient-primary': designSystem.gradients.primary,
        'gradient-secondary': designSystem.gradients.secondary,
        'gradient-purple': designSystem.gradients.purple,
        'gradient-orange': designSystem.gradients.orange,
        'gradient-success': designSystem.gradients.success,
        'gradient-warning': designSystem.gradients.warning,
        'gradient-error': designSystem.gradients.error,
        'gradient-rainbow': designSystem.gradients.rainbow,
        'gradient-red-blue': designSystem.gradients.redBlue,
        'gradient-red-purple': designSystem.gradients.redPurple,
        'gradient-vxn-hero': designSystem.gradients.hero,
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideIn: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        slideUp: {
          '0%': { transform: 'translateY(100%)' },
          '100%': { transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [
    // Add custom utilities
    function({ addUtilities }) {
      const newUtilities = {
        '.text-gradient-primary': {
          'background': designSystem.gradients.primary,
          '-webkit-background-clip': 'text',
          'background-clip': 'text',
          '-webkit-text-fill-color': 'transparent',
        },
        '.text-gradient-purple': {
          'background': designSystem.gradients.purple,
          '-webkit-background-clip': 'text',
          'background-clip': 'text',
          '-webkit-text-fill-color': 'transparent',
        },
        '.text-gradient-rainbow': {
          'background': designSystem.gradients.rainbow,
          '-webkit-background-clip': 'text',
          'background-clip': 'text',
          '-webkit-text-fill-color': 'transparent',
        },
        '.text-gradient-vxn': {
          'background': designSystem.gradients.redPurple,
          '-webkit-background-clip': 'text',
          'background-clip': 'text',
          '-webkit-text-fill-color': 'transparent',
        },
        '.glass': {
          'background': 'rgba(255, 255, 255, 0.1)',
          'backdrop-filter': 'blur(10px)',
          'border': '1px solid rgba(255, 255, 255, 0.2)',
        },
        '.glass-dark': {
          'background': 'rgba(0, 0, 0, 0.1)',
          'backdrop-filter': 'blur(10px)',
          'border': '1px solid rgba(255, 255, 255, 0.1)',
        },
      };
      addUtilities(newUtilities);
    },
  ],
  // Important: Disable Tailwind's preflight if using Ant Design
  corePlugins: {
    preflight: false,
  },
}
