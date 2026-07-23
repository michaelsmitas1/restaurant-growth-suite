import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-manrope)', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        display: ['var(--font-manrope)', 'sans-serif'],
        data: ['var(--font-plex-mono)', 'monospace'],
      },
      colors: {
        'royal-blue': {
          DEFAULT: 'var(--color-royal-blue)',
          hover: 'var(--color-royal-blue-hover)',
          soft: 'var(--color-royal-blue-soft)',
          subtle: 'var(--color-royal-blue-subtle)',
        },
        ink: {
          DEFAULT: 'var(--color-ink)',
          hover: 'var(--color-ink-hover)',
          soft: 'var(--color-ink-soft)',
        },
        paper: 'var(--color-paper)',
        surface: {
          DEFAULT: 'var(--color-surface)',
          hover: 'var(--color-surface-hover)',
          selected: 'var(--color-surface-selected)',
        },
        'matte-yellow': {
          DEFAULT: 'var(--color-matte-yellow)',
          hover: 'var(--color-matte-yellow-hover)',
          soft: 'var(--color-matte-yellow-soft)',
          subtle: 'var(--color-matte-yellow-subtle)',
        },
        text: {
          primary: 'var(--color-text-primary)',
          secondary: 'var(--color-text-secondary)',
          muted: 'var(--color-text-muted)',
          inverse: 'var(--color-text-inverse)',
        },
        border: {
          DEFAULT: 'var(--color-border)',
          strong: 'var(--color-border-strong)',
          focus: 'var(--color-border-focus)',
        },
        info: { DEFAULT: 'var(--color-info)', soft: 'var(--color-info-soft)' },
        success: { DEFAULT: 'var(--color-success)', soft: 'var(--color-success-soft)' },
        warning: { DEFAULT: 'var(--color-warning)', soft: 'var(--color-warning-soft)' },
        error: { DEFAULT: 'var(--color-error)', soft: 'var(--color-error-soft)' },
        celebration: {
          DEFAULT: 'var(--color-celebration)',
          hover: 'var(--color-celebration-hover)',
          soft: 'var(--color-celebration-soft)',
        },
      },
      borderRadius: {
        xs: 'var(--radius-xs)',
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)',
        '2xl': 'var(--radius-2xl)',
        full: 'var(--radius-full)',
      },
      boxShadow: {
        sm: 'var(--shadow-sm)',
        md: 'var(--shadow-md)',
        lg: 'var(--shadow-lg)',
      },
      transitionDuration: {
        fast: '150ms',
        normal: '220ms',
        slow: '320ms',
      },
      transitionTimingFunction: {
        standard: 'cubic-bezier(0.2, 0, 0, 1)',
      },
    },
  },
  plugins: [],
};
export default config;
