"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import AuthLayout from "@/components/auth/AuthLayout";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

export default function InstructorLoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const toast = useToast();
  
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const newErrors = {};
    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email";
    }
    if (!formData.password) {
      newErrors.password = "Password is required";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const response = await login(formData, "instructor");
      toast.success(response.message || "Login successful!");
      router.push("/instructor/dashboard");
    } catch (error) {
      toast.error(error.message || "Login failed. Please try again.");
      
      if (error.message?.includes("Email not verified")) {
        setErrors({ email: "Please verify your email before logging in" });
      } else if (error.message?.includes("not approved")) {
        setErrors({ email: "Your account is pending approval" });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Instructor Sign In"
      subtitle="Access your instructor dashboard"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <Input
          label="Email"
          type="email"
          placeholder="you@example.com"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          error={errors.email}
          required
          autoComplete="email"
        />
        <Input
          label="Password"
          type="password"
          placeholder="••••••••"
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          error={errors.password}
          required
          autoComplete="current-password"
        />
        
        <Button type="submit" className="w-full" loading={loading}>
          Sign In
        </Button>
      </form>

      <div className="mt-6 text-center text-sm">
        <p className="text-zinc-600 dark:text-zinc-400">
          Don&apos;t have an account?{" "}
          <Link href="/auth/instructor/register" className="text-indigo-600 hover:text-indigo-500 font-medium">
            Apply as instructor
          </Link>
        </p>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          Forgot your password?{" "}
          <Link href="/auth/instructor/forgot-password" className="text-indigo-600 hover:text-indigo-500 font-medium">
            Reset it
          </Link>
        </p>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          Need to verify your email?{" "}
          <Link href="/auth/instructor/resend-verification" className="text-indigo-600 hover:text-indigo-500 font-medium">
            Resend verification
          </Link>
        </p>
      </div>

      <div className="mt-6 pt-6 border-t border-zinc-200 dark:border-zinc-700">
        <p className="text-center text-sm text-zinc-500 dark:text-zinc-400">
          Are you a{" "}
          <Link href="/auth/student/login" className="text-indigo-600 hover:text-indigo-500">
            Student
          </Link>
          ?
        </p>
      </div>
    </AuthLayout>
  );
}
