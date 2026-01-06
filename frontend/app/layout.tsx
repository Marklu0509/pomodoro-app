// frontend/app/layout.tsx
import type { Metadata } from "next";
// 1. Remove "next/font/local" and import "next/font/google" instead
import { Inter } from "next/font/google"; 
import "./globals.css";

// 2. Configure the Google Font (Inter)
const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Pomodoro Focus",
  description: "Stay focused and productive with Pomodoro technique",
  manifest: "/manifest.json", 
  icons: {
    icon: "/globe.svg", 
    apple: "/globe.svg", 
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* ★ This inline script runs BEFORE React loads to prevent flashing */}
        <script dangerouslySetInnerHTML={{ __html: `
          try {
            const raw = localStorage.getItem('theme-preference');
            const theme = raw === 'light' || raw === 'dark' || raw === 'system' ? raw : 'system';
            const supportDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            if (theme === 'dark' || (theme === 'system' && supportDark)) {
              document.documentElement.classList.add('dark');
            } else {
              document.documentElement.classList.remove('dark');
            }
            localStorage.setItem('theme-preference', theme);
          } catch (e) {}
        `}} />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
