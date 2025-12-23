import React, { useState } from "react";
import { motion } from "framer-motion";
import { Mail, Lock, Eye, EyeOff, ShieldCheck, Loader2 } from "lucide-react";
import { useAuth } from "../AuthContext";
import { useNavigate } from "react-router-dom";
import AnimatedBackground from "./AnimatedBackground";

export default function LoginPage() {
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [isEmailValid, setIsEmailValid] = useState(true);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const validateEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

  const handleEmailChange = (e) => {
    const value = e.target.value;
    setEmail(value);
    setIsEmailValid(value === "" ? true : validateEmail(value));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Please enter both email and password.");
      return;
    }
    if (!validateEmail(email)) {
      setIsEmailValid(false);
      setError("Please enter a valid email address.");
      return;
    }

    try {
      setSubmitting(true);
      console.log("Starting login process...");
      
      const { data, error } = await signIn(email, password);
      console.log("SignIn result:", { data: !!data, error: error?.message });
      
      if (error) {
        console.error("Login error:", error);
        setError(error.message || "Invalid credentials. Please try again.");
        setSubmitting(false);
        return;
      }
      
      console.log("Login successful, checking access token...", !!data?.session?.access_token);
      
      if (data?.session?.access_token) {
        try {
          console.log("Fetching user role...");
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 30000);
          
          const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/auth/user`, {
            headers: {
              'Authorization': `Bearer ${data.session.access_token}`
            },
            signal: controller.signal
          });
          
          clearTimeout(timeoutId);
          
          console.log("Role fetch response status:", response.status);
          
          if (response.ok) {
            const userData = await response.json();
            console.log("User data received:", userData);
            const userRole = userData.user?.role_info;
            console.log("User role:", userRole?.role);
            
            if (userRole?.role === 'super_admin') {
              navigate("/dashboard", { replace: true });
              return;
            } else if (userRole?.role === 'academy_user') {
              navigate("/academy", { replace: true });
              return;
            } else if (userRole?.role === 'coach') {
              navigate("/coach/dashboard", { replace: true });
              return;
            } else if (userRole?.role === 'player') {
              navigate("/player-dashboard", { replace: true });
              return;
            } else {
              console.error("Unknown role:", userRole?.role);
              setError("Invalid user role. Please contact administrator.");
              setSubmitting(false);
              return;
            }
          } else {
            console.error("Role fetch failed with status:", response.status);
            setError("Failed to authenticate. Please try again.");
            setSubmitting(false);
            return;
          }
        } catch (roleError) {
          if (roleError.name === 'AbortError') {
            console.error("Role fetch timeout");
            setError("Login timeout. Please check connection.");
          } else {
            console.error("Role fetch error:", roleError);
            setError("Failed to authenticate. Please try again.");
          }
          setSubmitting(false);
          return;
        }
      } else {
        console.error("No access token received");
        setError("Authentication failed. Please try again.");
        setSubmitting(false);
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("Something went wrong while logging in. Please try again.");
      setSubmitting(false);
    }
  };

  return (
    // FIX: Used 'fixed inset-0 z-50' to force full coverage and ignore parent margins/padding.
    // Fixed 'bg-white-900' typo to 'bg-gray-900'.
    <div className="fixed inset-0 z-50 flex flex-col md:flex-row bg-gray-900 text-gray-100 overflow-hidden m-0 p-0"> 
      {/* Left Panel: Illustration */}
      <div className="hidden md:flex md:w-1/2 items-center justify-center p-0 overflow-hidden bg-[#242635] relative h-full">
        <img
          src="/assets/loginpage_right.svg"
          alt="Login Illustration"
          className="w-full h-full object-cover"
        />
      </div>

      {/* Right Panel (Login Form) */}
      <div className="flex w-full md:w-1/2 items-center justify-center p-4 sm:p-8 relative overflow-hidden h-full">
        {/* Animated particle background */}
        <AnimatedBackground />

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative w-full max-w-md bg-white shadow-xl rounded-lg border border-gray-200 p-6 sm:p-8 z-10"
        >
          {/* Header */}
          <motion.div
            className="flex flex-col items-center mb-4"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <img src="https://i.ibb.co/1tLZ0Dp/TMA-LOGO-without-bg.png" alt="TMA Logo" className="h-12 mb-2" />
            <h2 className="text-xl font-semibold text-gray-800">
              Welcome Back
            </h2>
            <p className="text-gray-500 text-sm">Sign in to your account</p>
          </motion.div>

          {/* Error banner */}
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={handleEmailChange}
                  className={`w-full pl-10 pr-3 py-3 border rounded-lg focus:outline-none transition-all bg-gray-50 text-gray-900
                    ${
                      email === ""
                        ? "border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                        : isEmailValid
                        ? "border-green-500 focus:ring-2 focus:ring-green-200"
                        : "border-red-500 focus:ring-2 focus:ring-red-200"
                    }`}
                  placeholder="you@example.com"
                  autoComplete="username"
                />
                <Mail className="absolute left-3 top-3.5 text-gray-400 w-5 h-5" />
              </div>
              {!isEmailValid && (
                <p className="text-red-500 text-xs mt-1">
                  Enter a valid email address
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:outline-none transition-all bg-gray-50 text-gray-900
                    focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
                <Lock className="absolute left-3 top-3.5 text-gray-400 w-5 h-5" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Remember + Forgot password */}
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center space-x-2 text-gray-600">
                <input type="checkbox" className="rounded border-gray-300" />
                <span>Remember me</span>
              </label>
              <a
                href="/forgot-password"
                className="text-blue-600 hover:underline"
              >
                Forgot password?
              </a>
            </div>

            {/* Submit */}
            <motion.button
              whileHover={{ scale: submitting ? 1 : 1.02 }}
              whileTap={{ scale: submitting ? 1 : 0.97 }}
              type="submit"
              disabled={submitting}
              className={`w-full ${
                submitting ? "bg-blue-500" : "bg-blue-600 hover:bg-blue-700"
              } disabled:opacity-70 disabled:cursor-not-allowed text-white font-medium py-2 rounded-lg flex items-center justify-center space-x-2 shadow-md transition-colors`}
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ShieldCheck className="w-5 h-5" />
                </>
              )}
            </motion.button>
          </form>

          {/* Back link */}
          <div className="text-center mt-4">
            <a href="/" className="text-sm text-gray-500 hover:underline">
              ← Back to Home
            </a>
          </div>
        </motion.div>
      </div>
    </div>
  );
}