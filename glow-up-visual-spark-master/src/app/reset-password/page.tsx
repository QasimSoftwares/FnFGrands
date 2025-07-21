"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();
  const params = useSearchParams();

  useEffect(() => {
    // If user is not coming from Supabase email link, redirect to forgot-password
    if (!params.get("access_token")) {
      setError("Invalid or expired reset link. Please request a new one.");
    }
  }, [params]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    if (password !== confirm) {
      setError("Passwords do not match.");
      setLoading(false);
      return;
    }
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setError(error.message);
    } else {
      setSuccess("Password has been reset. You can now log in.");
      setTimeout(() => router.push("/login"), 2000);
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
        <h1 className="text-2xl font-bold text-center mb-1 text-gray-900">Reset Password</h1>
        <p className="mb-6 text-gray-600 text-center">Enter your new password below.</p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            type="password"
            placeholder="New Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
          <Input
            type="password"
            placeholder="Confirm New Password"
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            required
          />
          <Button type="submit" disabled={loading || !password || !confirm} className="w-full bg-[#004aad] hover:bg-blue-700 text-white font-semibold py-2 rounded mt-2">
            {loading ? "Resetting..." : "Reset Password"}
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
