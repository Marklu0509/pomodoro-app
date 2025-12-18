// src/app/page.tsx
"use client"; // ★ This line is mandatory for using client-side hooks like useState

import { useState } from "react";
import api from "../utils/api"; // Import our custom Axios instance
import { useRouter } from "next/navigation"; // Hook for programmatic navigation

export default function LoginPage() {
  // Initialize the router for page redirection
  const router = useRouter();
  
  // State variables to store user input and error messages
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  // Function to handle form submission
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault(); // Prevent the browser from reloading the page
    setError(""); // Clear any previous error messages

    try {
      // 1. Send a POST request to the backend Login API
      const response = await api.post("/auth/login", {
        email: email,
        password: password,
      });

      // 2. Extract the Access Token from the response
      const token = response.data.accessToken;
      console.log("Login Success! Token:", token);

      // 3. Store the Token securely in the browser's Local Storage
      // This acts as the "passport" for future requests
      localStorage.setItem("token", token);

      // 4. Provide feedback to the user
      alert("Login Successful!");
      
      // 5. (TODO) Redirect the user to the dashboard
      router.push("/dashboard");
      
    } catch (err: any) {
      console.error("Login Failed:", err);
      // Display a user-friendly error message
      setError("Login failed. Please check your credentials.");
    }
  };

  // Render the Login UI
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-100">
      <div className="w-full max-w-md bg-white p-8 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">
          Sign In to Pomodoro
        </h2>
        
        {/* Conditional rendering: Only show error message if 'error' state is not empty */}
        {error && (
          <p className="text-red-500 text-sm mb-4 text-center">{error}</p>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          {/* Email Input Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)} // Update state on typing
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md text-gray-900"
              placeholder="Enter your email"
              suppressHydrationWarning={true}
              required
            />
          </div>

          {/* Password Input Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)} // Update state on typing
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md text-gray-900"
              placeholder="Enter your password"
              required
              suppressHydrationWarning={true}
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-md transition duration-200"
          >
            Sign In
          </button>
        </form>
      </div>
    </div>
  );
}