// frontend/app/components/Navbar.tsx
"use client";

import { useRouter } from "next/navigation";

export default function Navbar() {
  const router = useRouter();

  const handleLogout = () => {
    // 1. Clear the token from local storage
    // This effectively "logs out" the user because they no longer have a pass
    localStorage.removeItem("token");

    // 2. Redirect the user back to the login page
    router.push("/");
  };

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 px-8 py-4 mb-8 flex justify-between items-center">
      {/* Logo / Brand Name */}
      <div className="flex items-center gap-2">
        <span className="text-2xl">🍅</span>
        <h1 className="text-xl font-bold text-gray-800 tracking-tight">
          Pomodoro Focus
        </h1>
      </div>

      {/* Right Side Actions */}
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-500 hidden sm:block">
          Keep going!
        </span>
        
        <button
        onClick={() => router.push("/settings")}
        className="text-sm font-medium text-gray-600 hover:text-gray-900 px-4 py-2"
        >
        Settings
        </button>
        
        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 px-4 py-2 rounded-md transition-colors"
        >
          Sign Out
        </button>
      </div>
    </nav>
  );
}