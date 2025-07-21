"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) {
      setError(error.message);
    } else {
      setSuccess("Password reset email sent. Please check your inbox.");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
      <div className="flex flex-col items-center mb-6">
        <img src="/images/logo.png" alt="Family and Fellows Foundation Logo" className="h-16 w-16 w-[64px] h-[64px] object-contain mb-2 shadow" />
        <h2 className="text-lg font-bold text-[#004aad]">Family and Fellows Foundation</h2>
      </div>
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-xs flex flex-col">
        <h1 className="text-2xl font-bold text-center mb-1 text-gray-900">Forgot Password</h1>
        <p className="mb-6 text-gray-600 text-center">Enter your email address and we'll send you a link to reset your password.</p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
          <Button type="submit" disabled={loading || !email} className="w-full bg-[#004aad] hover:bg-blue-700 text-white font-semibold py-2 rounded mt-2">
            {loading ? "Sending..." : "Send Reset Link"}
          </Button>
        </form>
        {success && <div className="mt-4 text-green-600 text-center">{success}</div>}
        {error && <div className="mt-4 text-red-600 text-center">{error}</div>}
        <Button variant="link" className="mt-4 w-full text-[#004aad]" onClick={() => router.push("/login")}>Back to Login</Button>
      </div>
      <footer className="mt-6 text-center text-sm text-[#004aad] font-semibold tracking-wide">
        <span className="italic">TOGETHER WE CAN MAKE A DIFFERENCE</span>
      </footer>
    </div>
  );
}
