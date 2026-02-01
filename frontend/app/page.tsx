// frontend/app/page.tsx
"use client";

import { useState } from "react";
import api from "../utils/api";
import { useRouter } from "next/navigation";
import ThemeToggle from "./components/ThemeToggle";

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
    <div className="relative min-h-screen overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute -top-24 left-[-10%] h-[420px] w-[420px] rounded-full bg-blue-900/15 blur-[120px]" />
        <div className="absolute top-10 right-[-10%] h-[380px] w-[380px] rounded-full bg-slate-500/15 blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[20%] h-[420px] w-[420px] rounded-full bg-slate-800/15 blur-[130px]" />
      </div>

      <div className="absolute top-6 right-6 z-20">
        <ThemeToggle />
      </div>

      <main className="relative z-10 mx-auto flex min-h-screen w-full max-w-6xl items-center px-6 py-16">
        <div className="grid w-full gap-10 lg:grid-cols-[1.1fr_0.9fr] items-center">
          <section className="space-y-8">
            <div className="inline-flex items-center gap-2 glass-pill px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-slate-600 dark:text-slate-300">
              Focus System
              <span className="h-1.5 w-1.5 rounded-full bg-slate-900 dark:bg-slate-200" />
              Glass Mode
            </div>
            <h1 className="text-4xl md:text-5xl font-display font-semibold leading-tight text-slate-900 dark:text-white">
              Built for deep work, sculpted in glass.
            </h1>
            <p className="text-lg text-slate-600 dark:text-slate-300 max-w-xl">
              Manage tasks, launch focus sessions, and track momentum with a calm UI that keeps your
              attention where it matters.
            </p>
            <div className="grid gap-4 sm:grid-cols-2 text-sm text-slate-600 dark:text-slate-300">
              {[
                "Smart focus profiles + ambient control",
                "Quick-start sessions for instant flow",
                "Daily goal tracking with heatmap insights",
                "Theme toggle built into every surface",
              ].map((item) => (
                <div key={item} className="glass-panel rounded-2xl p-4">
                  <span className="font-semibold">{item}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="glass-card rounded-[2.5rem] p-8 md:p-10">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-display font-semibold text-slate-900 dark:text-white">
                  {isLogin ? "Welcome back" : "Create your account"}
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {isLogin ? "Log in to continue your focus streak." : "Start a new focus ritual in minutes."}
                </p>
              </div>
            </div>

            <div className="mt-6 flex gap-2 glass-pill p-1">
              <button
                onClick={() => { setIsLogin(true); setError(""); }}
                className={`flex-1 rounded-xl px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] transition-all ${
                  isLogin
                    ? "bg-white/90 dark:bg-white/15 text-slate-900 dark:text-white shadow-md"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => { setIsLogin(false); setError(""); }}
                className={`flex-1 rounded-xl px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] transition-all ${
                  !isLogin
                    ? "bg-white/90 dark:bg-white/15 text-slate-900 dark:text-white shadow-md"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                Sign Up
              </button>
            </div>

            {error && (
              <div className="mt-5 rounded-2xl border border-rose-200/60 dark:border-rose-500/30 bg-rose-50/70 dark:bg-rose-950/40 p-3 text-sm text-rose-600 dark:text-rose-200">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              {!isLogin && (
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                    Username
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="glass-input w-full rounded-2xl px-4 py-3 text-sm"
                    placeholder="Your Name"
                    suppressHydrationWarning
                  />
                </div>
              )}

              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="glass-input w-full rounded-2xl px-4 py-3 text-sm"
                  placeholder="name@example.com"
                  required
                  suppressHydrationWarning
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="glass-input w-full rounded-2xl px-4 py-3 text-sm"
                  placeholder="••••••••"
                  required
                  suppressHydrationWarning
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className={`w-full rounded-2xl px-4 py-4 text-xs font-semibold uppercase tracking-[0.25em] text-white transition-all ${
                  isLoading
                    ? "bg-slate-400/60 cursor-not-allowed"
                    : "bg-slate-900 hover:bg-slate-800 shadow-lg shadow-slate-900/20"
                }`}
              >
                {isLoading ? "Processing" : (isLogin ? "Log In" : "Sign Up & Enter")}
              </button>
            </form>
          </section>
        </div>
      </main>
    </div>
  );
}
