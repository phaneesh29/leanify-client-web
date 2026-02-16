"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import AuthLayout from "@/components/auth/AuthLayout";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

export default function StudentVerifyPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { verifyEmail } = useAuth();
  const toast = useToast();

  const [token, setToken] = useState(searchParams.get("token") || "");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [verified, setVerified] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!token.trim()) {
      setError("Verification token is required");
      return;
    }

    setLoading(true);
    setError("");
    
    try {
      const response = await verifyEmail(token, "student");
      toast.success(response.message || "Email verified successfully!");
      setVerified(true);
    } catch (error) {
      toast.error(error.message || "Verification failed. Please try again.");
      setError(error.message || "Invalid or expired verification token");
    } finally {
      setLoading(false);
    }
  };

  if (verified) {
    return (
      <AuthLayout
        title="Email Verified!"
        subtitle="Your email has been successfully verified"
      >
        <div className="text-center">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-zinc-600 dark:text-zinc-400 mb-6">
            You can now sign in to your account and start learning!
          </p>
          <Button onClick={() => router.push("/auth/student/login")} className="w-full">
            Continue to Sign In
          </Button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Verify your email"
      subtitle="Enter the verification code sent to your email"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <Input
          label="Verification Token"
          placeholder="Enter your verification token"
          value={token}
          onChange={(e) => {
            setToken(e.target.value);
            setError("");
          }}
          error={error}
          required
        />

        <Button type="submit" className="w-full" loading={loading}>
          Verify Email
        </Button>
      </form>

      <div className="mt-6 text-center text-sm">
        <p className="text-zinc-600 dark:text-zinc-400">
          Didn&apos;t receive the email?{" "}
          <Link href="/auth/student/resend-verification" className="text-indigo-600 hover:text-indigo-500 font-medium">
            Resend verification email
          </Link>
        </p>
      </div>

      <div className="mt-4 text-center">
        <Link href="/auth/student/login" className="text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300">
          ← Back to sign in
        </Link>
      </div>
    </AuthLayout>
  );
}
