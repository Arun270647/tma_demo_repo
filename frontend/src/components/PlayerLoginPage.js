import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import ThemeToggle from './ThemeToggle';

const PlayerLoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const { isLight } = useTheme();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Use Supabase auth through context
      const { data, error } = await signIn(email, password);
      
      if (error) {
        setError(error.message || 'Login failed');
        return;
      }

      if (data?.session) {
        // Successfully logged in, navigate to player dashboard
        navigate('/player-dashboard');
      } else {
        setError('Login failed. Please check your credentials.');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center ${isLight ? 'bg-gradient-to-br from-gray-50 via-white to-gray-100' : 'bg-gradient-to-br from-black via-gray-900 to-black'}`}>
      <div className="absolute top-6 right-6">
        <ThemeToggle />
      </div>
      
      <div className="max-w-md w-full space-y-8 px-6">
        <div>
          <div className="mx-auto h-12 w-auto flex justify-center">
            <img 
              src="https://i.ibb.co/1tLZ0Dp1/TMA-LOGO-without-bg.png" 
              alt="Track My Academy" 
              className="h-12 w-auto"
            />
          </div>
          <h2 className={`mt-6 text-xl md:text-3xl font-bold ${isLight ? 'text-gray-900' : 'text-white'}`}>
            Player Portal
          </h2>
          <p className={`mt-2 text-sm md:text-base ${isLight ? 'text-gray-600' : 'text-gray-400'}`}>
            Sign in to access your training dashboard
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className={`${isLight ? 'bg-red-50 border-red-200 text-red-800' : 'bg-red-500/20 border-red-500/30 text-red-400'} border px-4 py-3 rounded-lg text-sm`}>
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="email" className={`block text-sm font-medium ${isLight ? 'text-gray-700' : 'text-gray-300'}`}>
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`mt-1 appearance-none relative block w-full px-3 py-3 ${isLight ? 'bg-white border-gray-300 text-gray-900 placeholder-gray-500' : 'bg-white/5 border-white/10 text-white placeholder-gray-400'} border rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all duration-300`}
                placeholder="Enter your email"
              />
            </div>

            <div>
              <label htmlFor="password" className={`block text-sm font-medium ${isLight ? 'text-gray-700' : 'text-gray-300'}`}>
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`mt-1 appearance-none relative block w-full px-3 py-3 ${isLight ? 'bg-white border-gray-300 text-gray-900 placeholder-gray-500' : 'bg-white/5 border-white/10 text-white placeholder-gray-400'} border rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all duration-300`}
                placeholder="Enter your password"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className={`group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-sky-500 hover:bg-sky-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </div>

          <div className="text-center">
            <Link 
              to="/login" 
              className={`text-sm ${isLight ? 'text-sky-600 hover:text-sky-500' : 'text-sky-400 hover:text-sky-300'} transition-colors duration-300`}
            >
              Are you an academy admin? Sign in here
            </Link>
          </div>

          <div className="mt-6 text-center">
            <Link 
              to="/" 
              className={`text-sm ${isLight ? 'text-gray-600 hover:text-gray-500' : 'text-gray-400 hover:text-gray-300'} transition-colors duration-300`}
            >
              ← Back to Home
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PlayerLoginPage;