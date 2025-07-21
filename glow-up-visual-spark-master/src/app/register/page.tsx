'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/auth-context'

export default function Register() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { signUp } = useAuth()
  const router = useRouter()

  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    // Client-side validation
    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }
    
    if (password !== confirmPassword) {
      setError("Passwords don't match");
      return;
    }
    
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address');
      return;
    }
    
    if (!fullName.trim()) {
      setError('Please enter your full name');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const result = await signUp(email, password, {
        full_name: fullName.trim()
      });
      
      if (!result) {
        throw new Error('Registration failed. Please try again.');
      }
      
      // If we get here, registration was successful
      setRegistrationSuccess(true);
      setRegisteredEmail(email);
      
      // Clear the form
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setFullName('');
      
      // Handle successful registration
      if (result.requiresEmailConfirmation) {
        // Show email confirmation message
        setRegistrationSuccess(true);
        setRegisteredEmail(email);
      } else if (result.session) {
        // Auto-login was successful, redirect to dashboard
        try {
          // Wait a moment to ensure the session is fully established
          await new Promise(resolve => setTimeout(resolve, 500));
          router.push('/dashboard');
        } catch (error) {
          console.error('Redirect error:', error);
          // Fallback to home if dashboard redirect fails
          router.push('/');
        }
      }
    } catch (error: any) {
      // Error message is already formatted by the auth context
      setError(error.message || 'An error occurred during registration');
      console.error('Registration error:', error);
    } finally {
      setIsLoading(false);
    }
  }

  if (registrationSuccess) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
        <div className="flex flex-col items-center mb-6">
          <img src="/images/logo.png" alt="Family and Fellows Foundation Logo" className="h-16 w-16 w-[64px] h-[64px] object-contain mb-2 shadow" />
          <h2 className="text-lg font-bold text-[#004aad]">Family and Fellows Foundation</h2>
        </div>
        <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-xs flex flex-col items-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-2">
            <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-center mb-2 text-gray-900">
            Registration Successful!
          </h2>
          <p className="mb-4 text-sm text-gray-600 text-center">
            Your account has been created successfully. 
            {registeredEmail && (
              <span>We've sent a confirmation email to <span className="font-medium">{registeredEmail}</span>.</span>
            )}
          </p>
          <Link
            href="/login"
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#004aad] hover:bg-blue-700"
          >
            Go to Login
          </Link>
        </div>
        <footer className="mt-6 text-center text-sm text-[#004aad] font-semibold tracking-wide">
          Together we can make a difference
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col items-center mb-6">
        <img src="/images/logo.png" alt="Family and Fellows Foundation Logo" className="h-16 w-16 w-[64px] h-[64px] object-contain mb-2 shadow" />
        <h2 className="text-lg font-bold text-[#004aad]">Family and Fellows Foundation</h2>
      </div>
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-xs flex flex-col">
        <h1 className="text-2xl font-bold text-center mb-1 text-gray-900">Sign Up</h1>
        <p className="text-gray-500 text-center mb-6">Create your new account</p>
        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <label className="text-sm font-semibold text-gray-900">Full Name</label>
          <input
            id="fullName"
            name="fullName"
            type="text"
            required
            className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-200"
            placeholder="Full Name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            disabled={isLoading}
          />
          <label className="text-sm font-semibold text-gray-900">Email</label>
          <input
            id="email-address"
            name="email"
            type="email"
            autoComplete="email"
            required
            className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-200"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
          />
          <label className="text-sm font-semibold text-gray-900">Password</label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-200"
            placeholder="Password (min 8 characters)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
            minLength={8}
          />
          <label className="text-sm font-semibold text-gray-900">Confirm Password</label>
          <input
            id="confirm-password"
            name="confirm-password"
            type="password"
            autoComplete="new-password"
            required
            className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-200"
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={isLoading}
            minLength={8}
          />
          {error && <div className="text-red-600 text-center text-sm">{error}</div>}
          <button
            type="submit"
            className={`w-full bg-[#004aad] hover:bg-blue-700 text-white font-semibold py-2 rounded mt-4 ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Creating account...
              </>
            ) : (
              'Sign Up'
            )}
          </button>
        </form>
        <p className="mt-2 text-center text-sm text-gray-600">
          Already have an account?{' '}
          <Link href="/login" className="text-[#004aad] hover:underline font-semibold">Sign In</Link>
        </p>
      </div>
      <footer className="mt-6 text-center text-sm text-[#004aad] font-semibold tracking-wide">
        <span className="italic">TOGETHER WE CAN MAKE A DIFFERENCE</span>
      </footer>
    </div>
  )
}
