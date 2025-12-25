// frontend/app/page.tsx
"use client";

import { useState } from "react";
import api from "../utils/api";
import { useRouter } from "next/navigation";

export default function AuthPage() {
  const router = useRouter();
  
  // true = 登入模式, false = 註冊模式
  const [isLogin, setIsLogin] = useState(true);
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState(""); // 註冊時可以順便填名字 (選填)
  
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    // 根據模式決定打哪一支 API
    const endpoint = isLogin ? "/auth/login" : "/auth/signup";

    try {
      // 準備傳送的資料
      const payload: any = {
        email: email,
        password: password,
      };

      // 如果是註冊模式，且有填名字，就加進去
      if (!isLogin && name) {
        payload.name = name;
      }

      const response = await api.post(endpoint, payload);

      // 成功後拿到 Token
      const token = response.data.accessToken;
      localStorage.setItem("token", token);

      // 跳轉到儀表板
      router.push("/dashboard");
      
    } catch (err: any) {
      console.error("Auth Failed:", err);
      if (isLogin) {
         setError("登入失敗：請檢查帳號密碼");
      } else {
         setError("註冊失敗：此 Email 可能已被使用");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-md overflow-hidden">
        
        {/* --- ★ NEW: 頂部切換標籤 (Tabs) --- */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => { setIsLogin(true); setError(""); }}
            className={`flex-1 py-4 text-center font-semibold transition-colors ${
              isLogin 
                ? "bg-white text-blue-600 border-b-2 border-blue-600" 
                : "bg-gray-50 text-gray-500 hover:bg-gray-100"
            }`}
          >
            登入 (Sign In)
          </button>
          <button
            onClick={() => { setIsLogin(false); setError(""); }}
            className={`flex-1 py-4 text-center font-semibold transition-colors ${
              !isLogin 
                ? "bg-white text-blue-600 border-b-2 border-blue-600" 
                : "bg-gray-50 text-gray-500 hover:bg-gray-100"
            }`}
          >
            註冊 (Sign Up)
          </button>
        </div>

        <div className="p-8">
          <h2 className="text-xl font-bold mb-6 text-center text-gray-800">
            {isLogin ? "歡迎回來" : "建立新帳號"}
          </h2>
          
          {error && (
            <div className="bg-red-50 text-red-500 text-sm p-3 rounded-md mb-4 text-center border border-red-100">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* 只有在註冊模式才顯示名字欄位 */}
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">暱稱 (選填)</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="block w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Your Name"
                  suppressHydrationWarning
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="name@example.com"
                required
                suppressHydrationWarning
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">密碼</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="••••••••"
                required
                suppressHydrationWarning
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-3 px-4 text-white font-semibold rounded-md transition duration-200 mt-4 ${
                isLoading ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {isLoading 
                ? "處理中..." 
                : (isLogin ? "登入" : "註冊並登入")
              }
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}