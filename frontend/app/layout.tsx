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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      {/* 3. Apply the font class to the body */}
      <body className={inter.className}>
        {children}
      </body>
    </html>
  );
}