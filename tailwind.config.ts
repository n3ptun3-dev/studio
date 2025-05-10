import type { Config } from "tailwindcss";
import { fontFamily } from "tailwindcss/defaultTheme";

export default {
    darkMode: ["class"], // Keep class-based dark mode, but our app is always "dark" styled
    content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
  	extend: {
      fontFamily: {
        sans: ["var(--font-geist-sans)", ...fontFamily.sans],
        mono: ["var(--font-geist-mono)", ...fontFamily.mono],
        orbitron: ["var(--font-orbitron)", "var(--font-geist-sans)", ...fontFamily.sans],
        exo2: ["var(--font-exo2)", "var(--font-geist-sans)", ...fontFamily.sans],
        rajdhani: ["var(--font-rajdhani)", "var(--font-geist-sans)", ...fontFamily.sans],
      },
  		colors: {
        // These will be driven by CSS variables defined in globals.css
  			background: 'hsl(var(--background-hsl))',
  			foreground: 'hsl(var(--foreground-hsl))',
  			card: {
  				DEFAULT: 'hsl(var(--card-hsl))',
  				foreground: 'hsl(var(--card-foreground-hsl))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover-hsl))',
  				foreground: 'hsl(var(--popover-foreground-hsl))'
  			},
  			primary: {
  				DEFAULT: 'hsl(var(--primary-hsl))',
  				foreground: 'hsl(var(--primary-foreground-hsl))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary-hsl))',
  				foreground: 'hsl(var(--secondary-foreground-hsl))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted-hsl))',
  				foreground: 'hsl(var(--muted-foreground-hsl))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent-hsl))',
  				foreground: 'hsl(var(--accent-foreground-hsl))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive-hsl))',
  				foreground: 'hsl(var(--destructive-foreground-hsl))'
  			},
  			border: 'hsl(var(--border-hsl))',
  			input: 'hsl(var(--input-hsl))',
  			ring: 'hsl(var(--ring-hsl))',
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			},
        // Item level colors for direct use if needed, prefer CSS vars
        'level-1': 'hsl(var(--level-1-color-hsl))',
        'level-2': 'hsl(var(--level-2-color-hsl))',
        'level-3': 'hsl(var(--level-3-color-hsl))',
        'level-4': 'hsl(var(--level-4-color-hsl))',
        'level-5': 'hsl(var(--level-5-color-hsl))',
        'level-6': 'hsl(var(--level-6-color-hsl))',
        'level-7': 'hsl(var(--level-7-color-hsl))',
        'level-8': 'hsl(var(--level-8-color-hsl))',
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		keyframes: {
  			'accordion-down': {
  				from: {
  					height: '0'
  				},
  				to: {
  					height: 'var(--radix-accordion-content-height)'
  				}
  			},
  			'accordion-up': {
  				from: {
  					height: 'var(--radix-accordion-content-height)'
  				},
  				to: {
  					height: '0'
  				}
  			},
        'holographic-scan': {
          '0%': { transform: 'translateY(-100%)', opacity: '0.5' },
          '50%': { opacity: '1' },
          '100%': { transform: 'translateY(100%)', opacity: '0.5' },
        },
        'slide-in-left': {
          'from': { transform: 'translateX(-100%)', opacity: '0' },
          'to': { transform: 'translateX(0)', opacity: '1' },
        },
        'slide-out-left': {
          'from': { transform: 'translateX(0)', opacity: '1' },
  				'to': { transform: 'translateX(-100%)', opacity: '0' },
        },
        'slide-in-right': {
          'from': { transform: 'translateX(100%)', opacity: '0' },
          'to': { transform: 'translateX(0)', opacity: '1' },
        },
        'slide-out-right': {
          'from': { transform: 'translateX(0)', opacity: '1' },
  				'to': { transform: 'translateX(100%)', opacity: '0' },
        },
        'float-up': {
          '0%': { transform: 'translateY(0)', opacity: '1' },
          '100%': { transform: 'translateY(-50px)', opacity: '0' },
        }
  		},
  		animation: {
  			'accordion-down': 'accordion-down 0.2s ease-out',
  			'accordion-up': 'accordion-up 0.2s ease-out',
        'holographic-scan': 'holographic-scan 1.5s ease-in-out infinite',
        'slide-in-left': 'slide-in-left 0.5s ease-out forwards',
        'slide-out-left': 'slide-out-left 0.5s ease-out forwards',
        'slide-in-right': 'slide-in-right 0.5s ease-out forwards',
        'slide-out-right': 'slide-out-right 0.5s ease-out forwards',
        'float-up': 'float-up 1.5s ease-out forwards',
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;

    