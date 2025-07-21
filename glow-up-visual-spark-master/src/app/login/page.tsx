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
              type="password"
              placeholder="********"
              className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-200 pr-10"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 cursor-pointer">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12s3.75-7.5 9.75-7.5 9.75 7.5 9.75 7.5-3.75 7.5-9.75 7.5S2.25 12 2.25 12z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
              </svg>
            </span>
          </div>
          <div className="flex justify-end mb-2">
            <a href="/forgot-password" className="text-[#004aad] text-sm font-semibold hover:underline">Forget Password?</a>
          </div>
          {error && <p className="text-red-500 mb-2 text-sm text-center">{error.message}</p>}
          <Button 
            type="submit" 
            className="w-full bg-[#004aad] hover:bg-blue-700 text-white font-semibold py-2 rounded mt-4" 
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>

        <p className="mt-2 text-center text-sm text-gray-600">
          Don't have an account?{' '}
          <a href="/register" className="text-[#004aad] hover:underline font-semibold">Sign Up</a>
        </p>
      </div>
      <footer className="mt-6 text-center text-sm text-[#004aad] font-semibold tracking-wide">
        <span className="italic">TOGETHER WE CAN MAKE A DIFFERENCE</span>
      </footer>
    </div>
  );
}