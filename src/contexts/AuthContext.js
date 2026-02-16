"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { authApi } from "@/lib/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState(null); // 'student' | 'instructor' | 'admin'

  // Check auth status on mount
  useEffect(() => {
    checkAuth();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const checkAuth = useCallback(async () => {
    setLoading(true);

    const storedRole = typeof window !== "undefined" ? localStorage.getItem("userRole") : null;

    if (!storedRole) {
      setLoading(false);
      return;
    }

    try {
      let profile;
      switch (storedRole) {
        case "student":
          profile = await authApi.studentProfile();
          break;
        case "instructor":
          profile = await authApi.instructorProfile();
          break;
        case "admin":
          profile = await authApi.adminProfile();
          break;
        default:
          throw new Error("Invalid role");
      }

      if (profile.status === "success" && profile.data) {
        const userData = profile.data.student || profile.data.instructor || profile.data.admin;
        setUser(userData);
        setRole(storedRole);
      }
    } catch {
      localStorage.removeItem("userRole");
      setUser(null);
      setRole(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const login = useCallback(
    async (credentials, userRole) => {
      let response;

      switch (userRole) {
        case "student":
          response = await authApi.studentLogin(credentials);
          break;
        case "instructor":
          response = await authApi.instructorLogin(credentials);
          break;
        case "admin":
          response = await authApi.adminLogin(credentials);
          break;
        default:
          throw new Error("Invalid role");
      }

      if (response.status === "success") {
        localStorage.setItem("userRole", userRole);
        setRole(userRole);
        await checkAuth();
      }

      return response;
    },
    [checkAuth]
  );

  const logout = useCallback(async () => {
    try {
      switch (role) {
        case "student":
          await authApi.studentLogout();
          break;
        case "instructor":
          await authApi.instructorLogout();
          break;
        case "admin":
          await authApi.adminLogout();
          break;
      }
    } catch {
      // Ignore logout errors
    } finally {
      localStorage.removeItem("userRole");
      setUser(null);
      setRole(null);
    }
  }, [role]);

  const register = useCallback(async (data, userRole) => {
    switch (userRole) {
      case "student":
        return authApi.studentRegister(data);
      case "instructor":
        return authApi.instructorRegister(data);
      case "admin":
        return authApi.adminRegister(data);
      default:
        throw new Error("Invalid role");
    }
  }, []);

  const verifyEmail = useCallback(async (token, userRole) => {
    switch (userRole) {
      case "student":
        return authApi.studentVerify(token);
      case "instructor":
        return authApi.instructorVerify(token);
      default:
        throw new Error("Email verification not supported for this role");
    }
  }, []);

  const resendVerificationEmail = useCallback(async (email, userRole) => {
    switch (userRole) {
      case "student":
        return authApi.studentResendEmail(email);
      case "instructor":
        return authApi.instructorResendEmail(email);
      default:
        throw new Error("Email verification not supported for this role");
    }
  }, []);

  const forgotPassword = useCallback(async (email, userRole) => {
    switch (userRole) {
      case "student":
        return authApi.studentForgotPassword(email);
      case "instructor":
        return authApi.instructorForgotPassword(email);
      default:
        throw new Error("Password reset not supported for this role");
    }
  }, []);

  const resetPassword = useCallback(async (data, userRole) => {
    switch (userRole) {
      case "student":
        return authApi.studentResetPassword(data);
      case "instructor":
        return authApi.instructorResetPassword(data);
      default:
        throw new Error("Password reset not supported for this role");
    }
  }, []);

  const updateProfile = useCallback(
    async (data) => {
      switch (role) {
        case "student":
          return authApi.studentUpdateProfile(data);
        case "instructor":
          return authApi.instructorUpdateProfile(data);
        default:
          throw new Error("Profile update not supported for this role");
      }
    },
    [role]
  );

  const value = {
    user,
    role,
    loading,
    isAuthenticated: !!user,
    login,
    logout,
    register,
    verifyEmail,
    resendVerificationEmail,
    forgotPassword,
    resetPassword,
    updateProfile,
    checkAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
