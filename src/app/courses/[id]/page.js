"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { courseApi, couponApi, enrollmentApi } from "@/lib/api";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

/* ── Convert any YouTube URL to embed URL ───────────────────────────── */
function toYouTubeEmbed(url) {
  if (!url) return null;
  try {
    const u = new URL(url);
    // Already an embed URL
    if (u.pathname.startsWith("/embed/")) return url;
    // youtu.be/VIDEO_ID
    if (u.hostname === "youtu.be") return `https://www.youtube.com/embed${u.pathname}`;
    // youtube.com/watch?v=VIDEO_ID
    const v = u.searchParams.get("v");
    if (v) return `https://www.youtube.com/embed/${v}`;
    // youtube.com/shorts/VIDEO_ID
    const shortsMatch = u.pathname.match(/\/shorts\/([^/?]+)/);
    if (shortsMatch) return `https://www.youtube.com/embed/${shortsMatch[1]}`;
  } catch {
    // not a valid URL
  }
  return null;
}

export default function CourseDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user, role, loading: authLoading, isAuthenticated, logout } = useAuth();
  const toast = useToast();

  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);

  // Coupon
  const [couponCode, setCouponCode] = useState("");
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const [couponResult, setCouponResult] = useState(null);
  const [couponError, setCouponError] = useState("");

  // Enrollment
  const [enrollmentStatus, setEnrollmentStatus] = useState(null); // null | { status, ... }
  const [enrolling, setEnrolling] = useState(false);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const res = await courseApi.viewCourseById(id);
        if (res.success) {
          setCourse(res.data);
        }
      } catch (err) {
        toast.error(err.message || "Failed to load course");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  // Check enrollment status on load
  useEffect(() => {
    if (!id || !isAuthenticated || role !== "student") return;
    (async () => {
      try {
        const res = await enrollmentApi.getEnrollmentStatus(id);
        if (res.success && res.data) setEnrollmentStatus(res.data);
      } catch { /* not enrolled */ }
    })();
  }, [id, isAuthenticated, role]);

  const formatDate = (d) => {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  };

  const formatPrice = (p) => {
    if (!p || Number(p) === 0) return "Free";
    return `₹${Number(p).toLocaleString("en-IN")}`;
  };

  const embedUrl = toYouTubeEmbed(course?.intro_link);

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

  const handleApplyCoupon = async (e) => {
    e.preventDefault();
    if (!couponCode.trim()) return;
    setApplyingCoupon(true);
    setCouponError("");
    setCouponResult(null);
    try {
      const res = await couponApi.applyCoupon({ code: couponCode, course_id: parseInt(id) });
      if (res.success) {
        setCouponResult(res.data);
        toast.success(res.message || "Coupon applied!");
      }
    } catch (err) {
      setCouponError(err.message || "Invalid coupon code");
    } finally {
      setApplyingCoupon(false);
    }
  };

  const handleEnrollFree = async () => {
    if (!couponResult || couponResult.requires_payment) return;
    setEnrolling(true);
    try {
      const res = await enrollmentApi.enrollFree({ course_id: parseInt(id), coupon_code: couponCode });
      if (res.success) {
        toast.success(res.message || "Enrolled successfully!");
        setEnrollmentStatus({ status: "enrolled" });
      }
    } catch (err) {
      toast.error(err.message || "Enrollment failed");
    } finally {
      setEnrolling(false);
    }
  };

  const isEnrolled = enrollmentStatus?.status === "enrolled" || enrollmentStatus?.status === "completed";

  /* ── Loading ─────────────────────────────────────────────────────── */
  if (loading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">Course Not Found</h2>
          <p className="text-zinc-600 dark:text-zinc-400 mb-6">The course you're looking for doesn't exist or has been removed.</p>
          <Button onClick={() => router.push("/courses")}>Browse Courses</Button>
        </div>
      </div>
    );
  }

  const instructors = course.instructors || [];

  /* ── Render ───────────────────────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* ── Header ──────────────────────────────────────────────────── */}
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
                <button onClick={() => router.push("/courses")} className="text-sm font-medium text-indigo-600 dark:text-indigo-400 cursor-pointer">
                  Courses
                </button>
              </nav>
            </div>
            <div className="flex items-center gap-4">
              {isAuthenticated ? (
                <>
                  <span className="text-sm text-zinc-600 dark:text-zinc-400">{user?.first_name || "User"}</span>
                  <Button variant="outline" size="sm" onClick={goToDashboard}>Dashboard</Button>
                  <Button variant="ghost" size="sm" onClick={handleLogout}>Sign Out</Button>
                </>
              ) : (
                <>
                  <Button variant="outline" size="sm" onClick={() => router.push("/auth/student/login")}>Sign In</Button>
                  <Button size="sm" onClick={() => router.push("/auth/student/register")}>Get Started</Button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ── Hero ────────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-700 dark:from-indigo-900 dark:via-indigo-950 dark:to-purple-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
          <button
            onClick={() => router.push("/courses")}
            className="inline-flex items-center gap-1.5 text-indigo-200 hover:text-white text-sm mb-6 transition-colors cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Courses
          </button>

          <div className="lg:flex lg:items-start lg:gap-12">
            {/* Left */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-4">
                {course.sections?.length > 0 && (
                  <span className="bg-white/15 text-white text-xs font-medium px-2.5 py-1 rounded-full backdrop-blur-sm">
                    {course.sections.length} Section{course.sections.length !== 1 ? "s" : ""}
                  </span>
                )}
                {course.duration_hours && (
                  <span className="bg-white/15 text-white text-xs font-medium px-2.5 py-1 rounded-full backdrop-blur-sm">
                    {course.duration_hours}h
                  </span>
                )}
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white leading-tight mb-4">
                {course.title}
              </h1>

              {course.description && (
                <p className="text-indigo-100 text-lg leading-relaxed mb-6 max-w-2xl line-clamp-3">
                  {course.description}
                </p>
              )}

              {/* Instructors inline */}
              {instructors.length > 0 && (
                <div className="flex flex-wrap items-center gap-3 mb-6">
                  <span className="text-indigo-200 text-sm font-medium">Taught by</span>
                  <div className="flex flex-wrap gap-2">
                    {instructors.map((inst, idx) => {
                      const name = typeof inst === "string" ? inst : `${inst.first_name || ""} ${inst.last_name || ""}`.trim();
                      const initials = typeof inst === "string"
                        ? inst.charAt(0).toUpperCase()
                        : `${(inst.first_name || "")[0] || ""}${(inst.last_name || "")[0] || ""}`.toUpperCase();
                      return (
                        <div key={idx} className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-3 py-1.5">
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-xs font-bold text-white">
                            {initials}
                          </div>
                          <span className="text-sm text-white font-medium">{name}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Quick Stats */}
              <div className="flex flex-wrap gap-6 text-sm text-indigo-200">
                {course.start_date && (
                  <div className="flex items-center gap-1.5">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Starts {formatDate(course.start_date)}
                  </div>
                )}
                <div className="flex items-center gap-1.5">
                  <span className="text-2xl font-extrabold text-white">{formatPrice(course.price)}</span>
                </div>
              </div>
            </div>

            {/* Right – Sidebar card (desktop) */}
            <div className="hidden lg:block w-[360px] shrink-0">
              <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 sticky top-24">
                {/* YouTube Video */}
                {embedUrl && (
                  <div className="aspect-video bg-zinc-100 dark:bg-zinc-800">
                    <iframe
                      src={embedUrl}
                      title="Course intro"
                      className="w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                )}

                <div className="p-6">
                  <div className="text-center mb-5">
                    <span className="text-4xl font-extrabold text-zinc-900 dark:text-white">
                      {formatPrice(course.price)}
                    </span>
                  </div>

                  <div className="space-y-3 text-sm text-zinc-500 dark:text-zinc-400 mb-6">
                    {course.duration_hours && (
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                          Duration
                        </span>
                        <span className="font-medium text-zinc-900 dark:text-white">{course.duration_hours} hours</span>
                      </div>
                    )}
                    {course.sections?.length > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
                          Sections
                        </span>
                        <span className="font-medium text-zinc-900 dark:text-white">{course.sections.length}</span>
                      </div>
                    )}
                    {course.start_date && (
                      <div className="flex items-center justify-between">
                        <span>Start Date</span>
                        <span className="font-medium text-zinc-900 dark:text-white">{formatDate(course.start_date)}</span>
                      </div>
                    )}
                    {course.end_date && (
                      <div className="flex items-center justify-between">
                        <span>End Date</span>
                        <span className="font-medium text-zinc-900 dark:text-white">{formatDate(course.end_date)}</span>
                      </div>
                    )}
                  </div>

                  {/* Coupon Apply (students only) */}
                  {isAuthenticated && role === "student" && (
                    <div className="mb-4">
                      <form onSubmit={handleApplyCoupon} className="flex gap-2">
                        <Input
                          placeholder="Coupon code"
                          value={couponCode}
                          onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                          disabled={applyingCoupon}
                          className="flex-1"
                        />
                        <Button type="submit" variant="outline" size="sm" loading={applyingCoupon} className="shrink-0">Apply</Button>
                      </form>
                      {couponError && <p className="text-xs text-red-500 mt-1">{couponError}</p>}
                      {couponResult && (
                        <div className="mt-3 p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 space-y-1.5 text-sm">
                          <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
                            <span>Original</span><span>₹{couponResult.original_price}</span>
                          </div>
                          <div className="flex justify-between text-green-600 dark:text-green-400">
                            <span>Discount ({couponResult.coupon_code})</span><span>-₹{couponResult.discount_amount}</span>
                          </div>
                          <div className="border-t border-green-200 dark:border-green-800 pt-1.5 flex justify-between font-semibold text-zinc-900 dark:text-white">
                            <span>Final</span><span>₹{couponResult.final_price}</span>
                          </div>
                          {!couponResult.requires_payment && (
                            <p className="text-green-600 dark:text-green-400 text-xs font-medium text-center pt-1">🎉 Free! No payment needed.</p>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {isEnrolled ? (
                    <Button className="w-full" onClick={() => router.push(`/courses/${id}/learn`)}>
                      <span className="flex items-center justify-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        Go to Course
                      </span>
                    </Button>
                  ) : couponResult && !couponResult.requires_payment ? (
                    <Button className="w-full" onClick={handleEnrollFree} loading={enrolling}>
                      🎉 Enroll Free
                    </Button>
                  ) : (
                    <Button className="w-full">Enroll Now</Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Mobile sidebar card ─────────────────────────────────────── */}
      <div className="lg:hidden px-4 -mt-6 mb-8 relative z-10">
        <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
          {embedUrl && (
            <div className="aspect-video bg-zinc-100 dark:bg-zinc-800">
              <iframe
                src={embedUrl}
                title="Course intro"
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          )}
          <div className="p-5">
            <div className="flex items-center justify-between mb-4">
              <span className="text-3xl font-extrabold text-zinc-900 dark:text-white">
                {formatPrice(course.price)}
              </span>
              <div className="text-right text-sm text-zinc-500 dark:text-zinc-400">
                {course.duration_hours && <div>{course.duration_hours} hours</div>}
                {course.sections?.length > 0 && <div>{course.sections.length} sections</div>}
              </div>
            </div>
            {/* Mobile coupon */}
            {isAuthenticated && role === "student" && (
              <div className="mb-3">
                <form onSubmit={handleApplyCoupon} className="flex gap-2">
                  <Input
                    placeholder="Coupon code"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    disabled={applyingCoupon}
                    className="flex-1"
                  />
                  <Button type="submit" variant="outline" size="sm" loading={applyingCoupon} className="shrink-0">Apply</Button>
                </form>
                {couponError && <p className="text-xs text-red-500 mt-1">{couponError}</p>}
                {couponResult && (
                  <div className="mt-3 p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 space-y-1.5 text-sm">
                    <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
                      <span>Original</span><span>₹{couponResult.original_price}</span>
                    </div>
                    <div className="flex justify-between text-green-600 dark:text-green-400">
                      <span>Discount ({couponResult.coupon_code})</span><span>-₹{couponResult.discount_amount}</span>
                    </div>
                    <div className="border-t border-green-200 dark:border-green-800 pt-1.5 flex justify-between font-semibold text-zinc-900 dark:text-white">
                      <span>Final</span><span>₹{couponResult.final_price}</span>
                    </div>
                    {!couponResult.requires_payment && (
                      <p className="text-green-600 dark:text-green-400 text-xs font-medium text-center pt-1">🎉 Free! No payment needed.</p>
                    )}
                  </div>
                )}
              </div>
            )}
            {isEnrolled ? (
              <Button className="w-full" onClick={() => router.push(`/courses/${id}/learn`)}>
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  Go to Course
                </span>
              </Button>
            ) : couponResult && !couponResult.requires_payment ? (
              <Button className="w-full" onClick={handleEnrollFree} loading={enrolling}>
                🎉 Enroll Free
              </Button>
            ) : (
              <Button className="w-full">Enroll Now</Button>
            )}
          </div>
        </div>
      </div>

      {/* ── Main Content ────────────────────────────────────────────── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="lg:flex lg:gap-12">
          <div className="flex-1 min-w-0">

            {/* ── Curriculum ──────────────────────────────────────────── */}
            {course.sections?.length > 0 && (
              <div className="mb-10">
                <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-5">Course Curriculum</h2>
                <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden divide-y divide-zinc-200 dark:divide-zinc-800 bg-white dark:bg-zinc-900 shadow-sm">
                  {course.sections.map((section, sIdx) => (
                    <div key={section.id} className="flex items-center gap-3 px-5 py-4">
                      <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 flex items-center justify-center text-sm font-bold shrink-0">
                        {sIdx + 1}
                      </div>
                      <h3 className="font-medium text-zinc-900 dark:text-white">{section.title}</h3>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── About ───────────────────────────────────────────────── */}
            {course.description && (
              <div className="mb-10">
                <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-4">About This Course</h2>
                <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm">
                  <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed whitespace-pre-line">
                    {course.description}
                  </p>
                </div>
              </div>
            )}

            {/* ── Instructors ─────────────────────────────────────────── */}
            {instructors.length > 0 && (
              <div className="mb-10">
                <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-4">
                  Instructor{instructors.length > 1 ? "s" : ""}
                </h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  {instructors.map((inst, idx) => {
                    const name = typeof inst === "string" ? inst : `${inst.first_name || ""} ${inst.last_name || ""}`.trim();
                    const email = typeof inst === "string" ? null : inst.email;
                    const initials = typeof inst === "string"
                      ? inst.charAt(0).toUpperCase()
                      : `${(inst.first_name || "")[0] || ""}${(inst.last_name || "")[0] || ""}`.toUpperCase();
                    return (
                      <div key={idx} className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5 flex items-center gap-4 shadow-sm">
                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-lg font-bold shrink-0">
                          {initials}
                        </div>
                        <div>
                          <h3 className="font-semibold text-zinc-900 dark:text-white">{name}</h3>
                          {email && <p className="text-sm text-zinc-500 dark:text-zinc-400">{email}</p>}
                          <span className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">Instructor</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── Course Details ───────────────────────────────────────── */}
            <div className="mb-10">
              <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-4">Course Details</h2>
              <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
                <dl className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {course.start_date && (
                    <div className="flex justify-between px-6 py-3.5">
                      <dt className="text-sm text-zinc-500 dark:text-zinc-400">Start Date</dt>
                      <dd className="text-sm font-medium text-zinc-900 dark:text-white">{formatDate(course.start_date)}</dd>
                    </div>
                  )}
                  {course.end_date && (
                    <div className="flex justify-between px-6 py-3.5">
                      <dt className="text-sm text-zinc-500 dark:text-zinc-400">End Date</dt>
                      <dd className="text-sm font-medium text-zinc-900 dark:text-white">{formatDate(course.end_date)}</dd>
                    </div>
                  )}
                  {course.duration_hours && (
                    <div className="flex justify-between px-6 py-3.5">
                      <dt className="text-sm text-zinc-500 dark:text-zinc-400">Duration</dt>
                      <dd className="text-sm font-medium text-zinc-900 dark:text-white">{course.duration_hours} hours</dd>
                    </div>
                  )}
                  <div className="flex justify-between px-6 py-3.5">
                    <dt className="text-sm text-zinc-500 dark:text-zinc-400">Price</dt>
                    <dd className="text-sm font-medium text-zinc-900 dark:text-white">{formatPrice(course.price)}</dd>
                  </div>
                  {course.sections && (
                    <div className="flex justify-between px-6 py-3.5">
                      <dt className="text-sm text-zinc-500 dark:text-zinc-400">Sections</dt>
                      <dd className="text-sm font-medium text-zinc-900 dark:text-white">{course.sections.length}</dd>
                    </div>
                  )}
                </dl>
              </div>
            </div>
          </div>

          {/* Desktop sidebar spacer */}
          <div className="hidden lg:block w-[360px] shrink-0" />
        </div>
      </main>

      {/* ── Footer ──────────────────────────────────────────────────── */}
      <footer className="bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 mt-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-sm text-zinc-600 dark:text-zinc-400">
            © {new Date().getFullYear()} Learnify. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
