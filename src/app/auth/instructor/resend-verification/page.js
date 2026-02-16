"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import AuthLayout from "@/components/auth/AuthLayout";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

export default function InstructorResendVerificationPage() {
  const { resendVerificationEmail } = useAuth();
  const toast = useToast();

  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email) {
      setError("Email is required");
      return;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError("Please enter a valid email");
      return;
    }

    setLoading(true);
    setError("");
    
    try {
      const response = await resendVerificationEmail(email, "instructor");
      toast.success(response.message || "Verification email sent! Please check your inbox.");
      setSent(true);
    } catch (error) {
      toast.error(error.message || "Failed to send verification email. Please try again.");
      setError(error.message || "Failed to send verification email");
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <AuthLayout
        title="Email Sent!"
        subtitle="Check your inbox for the verification link"
      >
        <div className="text-center">
          <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-zinc-600 dark:text-zinc-400 mb-2">
            We&apos;ve sent a verification link to:
          </p>
          <p className="font-medium text-zinc-900 dark:text-white mb-6">{email}</p>
          <div className="space-y-3">
            <Button onClick={() => setSent(false)} variant="outline" className="w-full">
              Send to a different email
            </Button>
            <Link href="/auth/instructor/verify">
              <Button variant="ghost" className="w-full">
                I have my verification code
              </Button>
            </Link>
          </div>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Resend Verification"
      subtitle="Enter your email to receive a new verification link"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <Input
          label="Email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setError("");
          }}
          error={error}
          required
          autoComplete="email"
        />

        <Button type="submit" className="w-full" loading={loading}>
          Send Verification Email
        </Button>
      </form>

      <div className="mt-6 text-center">
        <Link href="/auth/instructor/login" className="text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300">
          ← Back to sign in
        </Link>
      </div>
    </AuthLayout>
  );
}
