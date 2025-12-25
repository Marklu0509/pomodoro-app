// frontend/app/page.tsx
"use client";

import { useState } from "react";
import api from "../utils/api";
import { useRouter } from "next/navigation";

export default function AuthPage() {
  const router = useRouter();
  
  // Toggle state: true = Login, false = Sign Up
  const [isLogin, setIsLogin] = useState(true);
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    // Determine the endpoint based on the toggle state
    const endpoint = isLogin ? "/auth/login" : "/auth/signup";

    try {
      const response = await api.post(endpoint, {
        email: email,
        password: password,
      });

      // Both login and signup return an accessToken in our backend
      const token = response.data.accessToken;
      localStorage.setItem("token", token);

      // Redirect to dashboard
      router.push("/dashboard");
      
    } catch (err: any) {
      console.error("Auth Failed:", err);
      // Show different messages for Login vs Signup errors
      if (isLogin) {
         setError("Login failed. Check your email or password.");
      } else {
         // Usually 403 means email already taken
         setError("Signup failed. Email might be already in use.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-md bg-white p-8 rounded-lg shadow-md">
        
        {/* Title changes based on mode */}
        <h2 className="text-2xl font-bold mb-2 text-center text-gray-800">
          {isLogin ? "Welcome Back" : "Create Account"}
        </h2>
        <p className="text-center text-gray-500 mb-6 text-sm">
          {isLogin ? "Sign in to continue to Pomodoro" : "Join us and start focusing"}
        </p>
        
        {error && (
          <div className="bg-red-50 text-red-500 text-sm p-3 rounded-md mb-4 text-center border border-red-100">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="block w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none transition"
              placeholder="name@example.com"
              required
              suppressHydrationWarning
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="block w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none transition"
              placeholder="••••••••"
              required
              suppressHydrationWarning
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-2 px-4 text-white font-semibold rounded-md transition duration-200 ${
              isLoading ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {isLoading 
              ? "Processing..." 
              : (isLogin ? "Sign In" : "Sign Up")
            }
          </button>
        </form>

        {/* Toggle Link */}
        <div className="mt-6 text-center text-sm text-gray-600">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setError(""); // Clear errors when switching
            }}
            className="font-semibold text-blue-600 hover:text-blue-500 hover:underline transition"
          >
            {isLogin ? "Sign up" : "Log in"}
          </button>
        </div>
      </div>
    </div>
  );
}