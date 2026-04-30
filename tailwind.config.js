/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: ["class"],
    content: ["./index.html", "./src/**/*.{ts,tsx,js,jsx}"],
    safelist: [
      "from-purple-700", "to-purple-900", "border-purple-500",
      "from-blue-700", "to-cyan-900", "border-blue-500",
      "from-green-700", "to-emerald-900", "border-green-500",
      "from-orange-600", "to-red-900", "border-orange-500",
      "from-indigo-800", "to-slate-900", "border-indigo-500",
      "from-pink-600", "to-rose-900", "border-pink-500",
      "from-yellow-600", "to-amber-900", "border-yellow-500",
      "from-gray-800", "to-gray-950", "border-gray-500",
      // Card back design colors
      "from-blue-700", "via-blue-800", "to-blue-950", "border-blue-500", "border-blue-400/30", "border-blue-300/15", "border-blue-500/60",
      "from-red-700", "via-red-800", "to-red-950", "border-red-500", "border-red-400/30", "border-red-300/15", "border-red-500/60",
      "from-emerald-700", "via-emerald-800", "to-emerald-950", "border-emerald-500", "border-emerald-400/30", "border-emerald-300/15", "border-emerald-500/60",
      "from-purple-700", "via-purple-800", "to-purple-950", "border-purple-500", "border-purple-400/30", "border-purple-300/15", "border-purple-500/60",
      "from-gray-900", "via-yellow-900", "to-gray-950", "border-yellow-600", "border-yellow-500/30", "border-yellow-400/15", "border-yellow-600/60",
      "from-cyan-700", "via-sky-800", "to-blue-950", "border-cyan-500", "border-cyan-400/30", "border-cyan-300/15", "border-cyan-500/60",
      // Slot machine theme colors
      "from-gray-950", "via-gray-900", "to-gray-950",
      "from-blue-950", "via-cyan-900", "to-blue-950", "from-blue-900", "via-cyan-800/30", "to-blue-900",
      "from-amber-950", "via-yellow-900", "to-amber-950", "from-amber-900", "via-yellow-800/30", "to-amber-900",
      "from-pink-950", "via-fuchsia-900", "to-pink-950", "from-pink-900", "via-fuchsia-800/30", "to-pink-900",
      "from-violet-950", "via-indigo-900", "to-violet-950", "from-violet-900", "via-purple-800/30", "to-violet-900",
      "border-cyan-500", "border-amber-500", "border-pink-500", "border-violet-500",
      "border-cyan-500/50", "border-amber-500/50", "border-pink-500/50", "border-violet-500/50",
      "border-yellow-600/50",
      // Checkers board cosmetic styles
      "from-slate-900", "via-blue-900", "to-slate-900", "from-slate-200", "via-slate-100", "to-slate-200",
      "from-rose-900", "via-pink-800", "to-rose-900", "from-pink-100", "via-rose-50", "to-pink-100",
      "from-cyan-900", "via-teal-900", "to-cyan-900", "from-cyan-100", "via-teal-50", "to-cyan-100",
      "from-red-950", "via-orange-900", "to-red-950", "from-orange-200", "via-amber-100", "to-orange-200",
      "from-purple-950", "via-indigo-900", "to-purple-950", "from-purple-200", "via-indigo-100", "to-purple-200",
      "from-gray-950", "via-gray-900", "to-gray-950", "from-gray-300", "via-gray-200", "to-gray-300",
    ],
  theme: {
  	extend: {
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
      fontFamily: {
        nunito: ['var(--font-nunito)'],
      },
  		colors: {
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			},
  		},
      keyframes: {
        'accordion-down': { from: { height: '0' }, to: { height: 'var(--radix-accordion-content-height)' } },
        'accordion-up': { from: { height: 'var(--radix-accordion-content-height)' }, to: { height: '0' } },
        'flip': { '0%': { transform: 'rotateY(0deg)' }, '100%': { transform: 'rotateY(180deg)' } },
        'pulse-gold': { '0%, 100%': { boxShadow: '0 0 0 0 rgba(245,158,11,0.4)' }, '50%': { boxShadow: '0 0 0 12px rgba(245,158,11,0)' } },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'pulse-gold': 'pulse-gold 2s infinite',
      }
  	}
  },
  plugins: [require("tailwindcss-animate")],
}