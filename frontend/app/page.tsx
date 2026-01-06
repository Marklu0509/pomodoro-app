// frontend/app/page.tsx
"use client";

import { useState } from "react";
import api from "../utils/api";
import { useRouter } from "next/navigation";

export default function AuthPage() {
  const router = useRouter();
  
  // true = login mode, false = signup mode
  const [isLogin, setIsLogin] = useState(true);
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState(""); // username(optional)
  
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    // call api by the mode
    const endpoint = isLogin ? "/auth/login" : "/auth/signup";

    try {
      // data for sending
      const payload: any = {
        email: email,
        password: password,
      };

      // signupmode
      if (!isLogin && name) {
        payload.name = name;
      }

      const response = await api.post(endpoint, payload);

      // receiving token
      const token = response.data.accessToken;
      localStorage.setItem("token", token);

      // move to dashboard
      router.push("/dashboard");
      
    } catch (err: any) {
      console.error("Auth Failed:", err);
      if (isLogin) {
         setError("Login failed; please check your email and password");
      } else {
         setError("sign up failed; the email has already been used");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-100 dark:bg-gray-950 p-4">
      <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-lg shadow-md overflow-hidden border border-gray-100 dark:border-gray-800">
        
        {/* --- tabs--- */}
        <div className="flex border-b border-gray-200 dark:border-gray-800">
          <button
            onClick={() => { setIsLogin(true); setError(""); }}
            className={`flex-1 py-4 text-center font-semibold transition-colors ${
              isLogin 
                ? "bg-white dark:bg-gray-900 text-blue-600 dark:text-blue-400 border-b-2 border-blue-600" 
                : "bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => { setIsLogin(false); setError(""); }}
            className={`flex-1 py-4 text-center font-semibold transition-colors ${
              !isLogin 
                ? "bg-white dark:bg-gray-900 text-blue-600 dark:text-blue-400 border-b-2 border-blue-600" 
                : "bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            }`}
          >
            Sign Up
          </button>
        </div>

        <div className="p-8">
          <h2 className="text-xl font-bold mb-6 text-center text-gray-800 dark:text-gray-100">
            {isLogin ? "Welcome back" : "create a new account"}
          </h2>
          
          {error && (
            <div className="bg-red-50 dark:bg-red-900/30 text-red-500 dark:text-red-300 text-sm p-3 rounded-md mb-4 text-center border border-red-100 dark:border-red-900">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* only signup mode has name field */}
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">username</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="block w-full p-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-md focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 dark:text-gray-100"
                  placeholder="Your Name"
                  suppressHydrationWarning
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full p-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-md focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 dark:text-gray-100"
                placeholder="name@example.com"
                required
                suppressHydrationWarning
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full p-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-md focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 dark:text-gray-100"
                placeholder="••••••••"
                required
                suppressHydrationWarning
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-3 px-4 text-white font-semibold rounded-md transition duration-200 mt-4 ${
                isLoading ? "bg-gray-400 dark:bg-gray-700 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700 dark:hover:bg-blue-500"
              }`}
            >
              {isLoading 
                ? "Processing" 
                : (isLogin ? "log in " : "Sign up and Log in")
              }
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
