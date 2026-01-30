// frontend/app/layout.tsx
import type { Metadata } from "next";
import { DM_Sans, Space_Grotesk } from "next/font/google";
import "./globals.css";

const dmSans = DM_Sans({ subsets: ["latin"], variable: "--font-body" });
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-display" });

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
      <body className={`${dmSans.variable} ${spaceGrotesk.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
