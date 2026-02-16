"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { courseApi } from "@/lib/api";
import Button from "@/components/ui/Button";

export default function CoursesPage() {
  const router = useRouter();
  const { user, role, loading, isAuthenticated, logout } = useAuth();
  const toast = useToast();

  const [courses, setCourses] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef(null);

  const fetchCourses = useCallback(async () => {
    try {
      const res = await courseApi.viewAllCourses();
      if (res.success) setCourses(res.data || []);
    } catch (err) {
      toast.error(err.message || "Failed to fetch courses");
    } finally {
      setLoadingCourses(false);
    }
  }, [toast]);

  const searchCourses = useCallback(async (query) => {
    setSearching(true);
    try {
      const res = await courseApi.searchCourses(query);
      if (res.success) setCourses(res.data || []);
    } catch (err) {
      toast.error(err.message || "Search failed");
    } finally {
      setSearching(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (value.trim()) {
        searchCourses(value.trim());
      } else {
        fetchCourses();
      }
    }, 400);
  };

  const handleLogout = async () => {
    await logout();
    toast.success("Logged out successfully");
    router.push("/");
  };

  const goToDashboard = () => {
    if (role === "admin") router.push("/admin/dashboard");
    else if (role === "instructor") router.push("/instructor/dashboard");
    else router.push("/dashboard");
  };



  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* Header */}
      <header className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2 cursor-pointer" onClick={() => router.push("/")}>
                <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold">L</span>
                </div>
                <span className="text-xl font-bold text-zinc-900 dark:text-white">Learnify</span>
              </div>
              <nav className="hidden md:flex items-center gap-6">
                <button
                  onClick={() => router.push("/courses")}
                  className="text-sm font-medium text-indigo-600 dark:text-indigo-400"
                >
                  Courses
                </button>
              </nav>
            </div>
            <div className="flex items-center gap-4">
              {isAuthenticated ? (
                <>
                  <span className="text-sm text-zinc-600 dark:text-zinc-400">
                    {user?.first_name || "User"}
                  </span>
                  <Button variant="outline" size="sm" onClick={goToDashboard}>
                    Dashboard
                  </Button>
                  <Button variant="ghost" size="sm" onClick={handleLogout}>
                    Sign Out
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="outline" size="sm" onClick={() => router.push("/auth/student/login")}>
                    Sign In
                  </Button>
                  <Button size="sm" onClick={() => router.push("/auth/student/register")}>
                    Get Started
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-zinc-900 dark:text-white mb-4">
            Explore Our Courses
          </h1>
          <p className="text-xl text-zinc-600 dark:text-zinc-400">
            Discover and enroll in courses taught by expert instructors
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-8">
          <div className="relative max-w-2xl">
            <input
              type="text"
              placeholder="Search courses..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="w-full px-4 py-3 pl-12 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <svg
              className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            {searching && (
              <div className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            )}
          </div>
        </div>

        {/* Courses Grid */}
        {loadingCourses ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent"></div>
          </div>
        ) : courses.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => (
              <div
                key={course.id}
                className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden hover:shadow-lg hover:border-indigo-500 dark:hover:border-indigo-500 transition-all cursor-pointer group"
                onClick={() => router.push(`/courses/${course.id}`)}
              >
                <div className="h-48 bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                  <svg
                    className="w-16 h-16 text-white/80"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                    />
                  </svg>
                </div>
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {course.title}
                  </h3>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4 line-clamp-3">
                    {course.description}
                  </p>
                  
                  {/* Instructors */}
                  {course.instructors && course.instructors.length > 0 && (
                    <div className="mb-4 flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <span className="line-clamp-1">
                        {course.instructors.slice(0, 2).map(i => typeof i === "string" ? i : `${i.first_name} ${i.last_name}`).join(", ")}
                        {course.instructors.length > 2 && ` +${course.instructors.length - 2}`}
                      </span>
                    </div>
                  )}

                  {/* Sections count */}
                  {course.sections && course.sections.length > 0 && (
                    <div className="mb-4 flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                      </svg>
                      <span>{course.sections.length} section{course.sections.length !== 1 ? "s" : ""}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-4 border-t border-zinc-200 dark:border-zinc-800">
                    <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                      ₹{course.price}
                    </span>
                    <span className="text-sm text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {course.duration_hours}h
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-2">
              No courses found
            </h3>
            <p className="text-zinc-600 dark:text-zinc-400">
              {searchQuery ? "Try adjusting your search" : "Check back later for new courses"}
            </p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-sm text-zinc-600 dark:text-zinc-400">
            © 2026 Learnify. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
