import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = { title: "SELC Staff Portal | South East London Care", description: "Secure staff and management portal for South East London Care." };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en-GB"><body>{children}</body></html>;
}