/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        crm: {
          hot: '#ef4444',      // Red for Hot leads
          warm: '#f59e0b',     // Amber for Warm leads
          cold: '#3b82f6',     // Blue for Cold leads
          overdue: '#dc2626',  // Bold red for overdue
          due: '#ea580c',      // Vibrant orange/amber for due today
          upcoming: '#10b981', // Emerald for upcoming
        },
      },
    },
  },
  plugins: [],
};
