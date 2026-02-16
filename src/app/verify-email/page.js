"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useToast } from "@/contexts/ToastContext";
import { authApi } from "@/lib/api";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const toast = useToast();
  const token = searchParams.get("token");
  const hasAttempted = useRef(false);

  const [status, setStatus] = useState("verifying"); // verifying, success, error
  const [message, setMessage] = useState("");
  const [userType, setUserType] = useState(null); // student or instructor

  useEffect(() => {
    if (hasAttempted.current) return;
    hasAttempted.current = true;

    const verifyToken = async () => {
      if (!token) {
        setStatus("error");
        setMessage("No verification token provided");
        return;
      }

      // Try student verification first
      try {
        const response = await authApi.studentVerify(token);
        setStatus("success");
        setMessage(response.message || "Email verified successfully!");
        setUserType("student");
        toast.success("Email verified successfully!");
        return;
      } catch (studentError) {
        // If student verification fails, try instructor
        try {
          const response = await authApi.instructorVerify(token);
          setStatus("success");
          setMessage(response.message || "Email verified successfully!");
          setUserType("instructor");
          toast.success("Email verified successfully!");
          return;
        } catch (instructorError) {
          // Both failed - show error
          setStatus("error");
          setMessage(studentError.message || "Invalid or expired verification token");
          toast.error(studentError.message || "Verification failed");
        }
      }
    };

    verifyToken();
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-8 text-center">
          {/* Logo */}
          <Link href="/" className="inline-flex items-center gap-2 mb-8">
            <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/25">
              <span className="text-white font-bold text-lg">L</span>
            </div>
            <span className="text-xl font-bold text-zinc-900 dark:text-white">Learnify</span>
          </Link>

          {status === "verifying" && (
            <>
              <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-indigo-600 dark:text-indigo-400 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">
                Verifying your email...
              </h1>
              <p className="text-zinc-600 dark:text-zinc-400">
                Please wait while we verify your email address.
              </p>
            </>
          )}

          {status === "success" && (
            <>
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">
                Email Verified!
              </h1>
              <p className="text-zinc-600 dark:text-zinc-400 mb-6">
                {message}
              </p>
              <Link
                href={userType === "instructor" ? "/auth/instructor/login" : "/auth/student/login"}
                className="inline-flex items-center justify-center w-full px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-medium hover:from-indigo-700 hover:to-purple-700 transition-all"
              >
                Continue to Sign In
              </Link>
            </>
          )}

          {status === "error" && (
            <>
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">
                Verification Failed
              </h1>
              <p className="text-zinc-600 dark:text-zinc-400 mb-6">
                {message}
              </p>
              <div className="space-y-3">
                <Link
                  href="/auth/student/resend-verification"
                  className="inline-flex items-center justify-center w-full px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-medium hover:from-indigo-700 hover:to-purple-700 transition-all"
                >
                  Resend Verification Email
                </Link>
                <Link
                  href="/"
                  className="inline-flex items-center justify-center w-full px-6 py-3 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-xl font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all"
                >
                  Back to Home
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center">
        <div className="text-zinc-600 dark:text-zinc-400">Loading...</div>
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}
