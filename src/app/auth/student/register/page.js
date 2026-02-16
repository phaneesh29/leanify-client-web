"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import AuthLayout from "@/components/auth/AuthLayout";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

export default function StudentRegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const toast = useToast();

  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone_number: "",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const newErrors = {};
    
    if (!formData.first_name.trim()) {
      newErrors.first_name = "First name is required";
    }
    if (!formData.last_name.trim()) {
      newErrors.last_name = "Last name is required";
    }
    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email";
    }
    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }
    if (!formData.phone_number) {
      newErrors.phone_number = "Phone number is required";
    } else if (!/^\+?[\d\s-]{10,}$/.test(formData.phone_number)) {
      newErrors.phone_number = "Please enter a valid phone number";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const { confirmPassword, ...data } = formData;
      const response = await register(data, "student");
      toast.success(response.message || "Registration successful! Please check your email to verify your account.");
      router.push("/auth/student/verify");
    } catch (error) {
      toast.error(error.message || "Registration failed. Please try again.");
      
      // Handle specific errors
      if (error.message?.includes("email already exists")) {
        setErrors({ email: "This email is already registered" });
      } else if (error.message?.includes("phone number already exists")) {
        setErrors({ phone_number: "This phone number is already registered" });
      }
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field) => (e) => {
    setFormData({ ...formData, [field]: e.target.value });
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors({ ...errors, [field]: "" });
    }
  };

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Start learning today"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="First Name"
            placeholder="John"
            value={formData.first_name}
            onChange={updateField("first_name")}
            error={errors.first_name}
            required
            autoComplete="given-name"
          />
          <Input
            label="Last Name"
            placeholder="Doe"
            value={formData.last_name}
            onChange={updateField("last_name")}
            error={errors.last_name}
            required
            autoComplete="family-name"
          />
        </div>
        <Input
          label="Email"
          type="email"
          placeholder="you@example.com"
          value={formData.email}
          onChange={updateField("email")}
          error={errors.email}
          required
          autoComplete="email"
        />
        <Input
          label="Phone Number"
          type="tel"
          placeholder="+1 234 567 8900"
          value={formData.phone_number}
          onChange={updateField("phone_number")}
          error={errors.phone_number}
          required
          autoComplete="tel"
        />
        <Input
          label="Password"
          type="password"
          placeholder="••••••••"
          value={formData.password}
          onChange={updateField("password")}
          error={errors.password}
          required
          autoComplete="new-password"
        />
        <Input
          label="Confirm Password"
          type="password"
          placeholder="••••••••"
          value={formData.confirmPassword}
          onChange={updateField("confirmPassword")}
          error={errors.confirmPassword}
          required
          autoComplete="new-password"
        />

        <Button type="submit" className="w-full" loading={loading}>
          Create Account
        </Button>
      </form>

      <div className="mt-6 text-center text-sm">
        <p className="text-zinc-600 dark:text-zinc-400">
          Already have an account?{" "}
          <Link href="/auth/student/login" className="text-indigo-600 hover:text-indigo-500 font-medium">
            Sign in
          </Link>
        </p>
      </div>

      <div className="mt-6 pt-6 border-t border-zinc-200 dark:border-zinc-700">
        <p className="text-center text-sm text-zinc-500 dark:text-zinc-400">
          Want to teach?{" "}
          <Link href="/auth/instructor/register" className="text-indigo-600 hover:text-indigo-500">
            Register as an Instructor
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
