import React, { useState } from "react";
import { motion } from "framer-motion";
import { Mail, Lock, Eye, EyeOff, FileText, Loader2 } from "lucide-react";
import { useAuth } from "../AuthContext";
import { useNavigate } from "react-router-dom";
import TMA from "../assets/TMA.png";
import AnimatedBackground from "../components/AnimatedBackground";
import SEOHelmet from "../components/SEOHelmet";

export default function BlogLoginPage() {
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

      const { data, error } = await signIn(email, password);

      if (error) {
        setError(error.message || "Invalid credentials. Please try again.");
        setSubmitting(false);
        return;
      }

      if (data?.session?.access_token) {
        try {
          // Verify blog access by calling blog API
          const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/blog/writers`, {
            headers: {
              'Authorization': `Bearer ${data.session.access_token}`
            }
          });

          if (response.status === 401 || response.status === 403) {
            setError("You don't have access to the blog system. Please contact an administrator.");
            setSubmitting(false);
            return;
          }

          if (response.ok) {
            // Get current user to check role
            const userResponse = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/blog/posts/my`, {
              headers: {
                'Authorization': `Bearer ${data.session.access_token}`
              }
            });

            // Try to call admin endpoint to check if user is admin
            const adminCheckResponse = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/blog/admin/posts/pending`, {
              headers: {
                'Authorization': `Bearer ${data.session.access_token}`
              }
            });

            if (adminCheckResponse.ok) {
              // User is admin
              navigate("/blog/admin", { replace: true });
            } else {
              // User is writer
              navigate("/blog/dashboard", { replace: true });
            }
          } else {
            setError("Failed to verify blog access. Please try again.");
            setSubmitting(false);
          }
        } catch (err) {
          console.error("Blog verification error:", err);
          setError("Connection error. Please check your network and try again.");
          setSubmitting(false);
        }
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("An unexpected error occurred. Please try again.");
      setSubmitting(false);
    }
  };

  return (
    <>
      <SEOHelmet
        title="Blog Login - Track My Academy"
        description="Login to Track My Academy blog management system"
        noindex={true}
      />

      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4 relative overflow-hidden">
        <AnimatedBackground />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative z-10 w-full max-w-md"
        >
          <div className="bg-gray-800/90 backdrop-blur-sm rounded-2xl shadow-2xl border border-gray-700 p-8">
            {/* Logo and Header */}
            <div className="text-center mb-8">
              <div className="flex justify-center mb-4">
                <img src={TMA} alt="Track My Academy Logo" className="h-16 w-auto" />
              </div>
              <h1 className="text-3xl font-bold text-white mb-2">Blog Login</h1>
              <p className="text-gray-400 flex items-center justify-center gap-2">
                <FileText className="w-4 h-4" />
                Internal Blog Management System
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400 text-sm"
              >
                {error}
              </motion.div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email Field */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={handleEmailChange}
                    disabled={submitting}
                    className={`w-full pl-11 pr-4 py-3 bg-gray-700/50 border ${!isEmailValid ? "border-red-500" : "border-gray-600"
                      } rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all`}
                    placeholder="Enter your email"
                    autoComplete="email"
                  />
                </div>
                {!isEmailValid && (
                  <p className="mt-1 text-sm text-red-400">Please enter a valid email address</p>
                )}
              </div>

              {/* Password Field */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={submitting}
                    className="w-full pl-11 pr-12 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="Enter your password"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300 transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Logging in...
                  </>
                ) : (
                  "Login to Blog Dashboard"
                )}
              </button>
            </form>

            {/* Privacy Note */}
            <div className="mt-6 pt-6 border-t border-gray-700">
              <p className="text-center text-sm text-gray-400">
                This is a private system. Unauthorized access is prohibited.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </>
  );
}
