import type { Config } from "tailwindcss";
const config: Config = { content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"], theme: { extend: { colors: { selc: { navy: "#102B55", blue: "#173F78", red: "#C9343D", ink: "#172033" } }, boxShadow: { panel: "0 12px 36px rgba(16,43,85,.08)" } } }, plugins: [] };
export default config;