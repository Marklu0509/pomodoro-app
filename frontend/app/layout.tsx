// frontend/app/layout.tsx
import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

// Define global metadata for the application
export const metadata: Metadata = {
  title: "Pomodoro Focus",
  description: "Stay focused and productive with Pomodoro technique",
  // ★ CRITICAL: Link to the manifest file so browsers detect the PWA
  manifest: "/manifest.json", 
  icons: {
    icon: "/globe.svg", // Optional: explicit favicon link
    apple: "/globe.svg", // Optional: icon for Apple devices
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}