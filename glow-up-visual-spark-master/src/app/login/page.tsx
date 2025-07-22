'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';

export default function Login() {
  const { signIn, user, loading, error } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  useEffect(() => {
    if (user) {
      router.replace('/dashboard');
    }
  }, [user, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    await signIn(email, password, rememberMe);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
      <div className="flex flex-col items-center mb-6">
        <img src="/images/logo.png" alt="Family and Fellows Foundation Logo" className="h-16 w-16 w-[64px] h-[64px] object-contain mb-2 shadow" />
        <h2 className="text-lg font-bold text-[#004aad]">Family and Fellows Foundation</h2>
      </div>
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-xs flex flex-col">
        <h1 className="text-2xl font-bold text-center mb-1 text-gray-900">Sign In</h1>
        <p className="text-gray-500 text-center mb-6">Hi welcome back</p>
        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <label className="text-sm font-semibold text-gray-900">Email</label>
          <input
            type="email"
            placeholder="example @gmail.com"
            className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-200"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <label className="text-sm font-semibold text-gray-900">Password</label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="********"
              className="w-full border border-gray-300 p-2 pr-10 rounded focus:outline-none focus:ring-2 focus:ring-blue-200 h-10"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{ paddingTop: '0.5rem', paddingBottom: '0.5rem' }}
            />
            <button 
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
              onClick={() => setShowPassword(!showPassword)}
              tabIndex={-1}
              aria-label={showPassword ? "Hide password" : "Show password"}
              style={{ transform: 'translateY(-50%)' }}
            >
              {showPassword ? (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12s3.75-7.5 9.75-7.5 9.75 7.5 9.75 7.5-3.75 7.5-9.75 7.5S2.25 12 2.25 12z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
                </svg>
              )}
            </button>
            <div className="flex justify-end mt-1">
              <a href="/forgot-password" className="text-[#004aad] text-sm hover:underline font-medium">Forgot Password?</a>
            </div>
          </div>
          {error && <p className="text-red-500 mb-2 text-sm text-center">{error.message}</p>}
          <Button 
            type="submit" 
            className="w-full bg-[#004aad] hover:bg-blue-700 text-white font-semibold py-2 rounded mt-2" 
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </Button>
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600 mb-3">Ready to make a difference, join us today</p>
            <a 
              href="/register" 
              className="inline-block bg-white border border-[#004aad] text-[#004aad] hover:bg-gray-50 font-medium text-sm py-1.5 px-4 rounded transition-colors"
            >
              Create Account
            </a>
          </div>
        </form>
      </div>
      <footer className="mt-6 text-center text-sm text-[#004aad] font-semibold tracking-wide">
        <span className="italic">TOGETHER WE CAN MAKE A DIFFERENCE</span>
      </footer>
    </div>
  );
}