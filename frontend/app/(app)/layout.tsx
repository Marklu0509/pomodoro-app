// frontend/app/(app)/layout.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/app/components/Navbar";
import { AppDataProvider } from "@/app/context/AppData";

/**
 * Shared shell for every authenticated page (focus / stats / settings):
 * - one auth guard (redirect to login if no token)
 * - one Navbar
 * - one AppDataProvider (single data fetch)
 */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem("token")) {
      router.replace("/");
    } else {
      setReady(true);
    }
  }, [router]);

  if (!ready) return null;

  return (
    <AppDataProvider>
      <Navbar />
      <main className="min-h-screen">{children}</main>
    </AppDataProvider>
  );
}
