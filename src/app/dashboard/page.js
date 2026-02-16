"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { courseApi } from "@/lib/api";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

export default function DashboardPage() {
  const router = useRouter();
  const { user, role, loading, isAuthenticated, checkAuth, updateProfile } = useAuth();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState("overview");
  const [courses, setCourses] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(true);

  // Profile editing
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({ first_name: "", last_name: "", phone_number: "" });
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    if (!loading && (!isAuthenticated || role !== "student")) {
      router.push("/auth/student/login");
    }
  }, [loading, isAuthenticated, role, router]);

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

  useEffect(() => {
    if (isAuthenticated && role === "student") fetchCourses();
  }, [isAuthenticated, role, fetchCourses]);

  useEffect(() => {
    if (user) {
      setProfileForm({
        first_name: user.first_name || "",
        last_name: user.last_name || "",
        phone_number: user.phone_number || "",
      });
    }
  }, [user]);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const res = await updateProfile(profileForm);
      toast.success(res.message || "Profile updated");
      setEditingProfile(false);
      await checkAuth();
    } catch (err) {
      toast.error(err.message || "Failed to update profile");
    } finally {
      setSavingProfile(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated || role !== "student") return null;

  const tabs = [
    { key: "overview", label: "Overview" },
    { key: "courses", label: "Courses", count: courses.length },
    { key: "profile", label: "Profile" },
  ];

  return (
    <DashboardLayout
      title={`Hello, ${user?.first_name || "Student"}! 👋`}
      subtitle="Ready to continue your learning journey?"
      portalLabel="Student Portal"
    >
      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-zinc-200 dark:border-zinc-800">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2.5 font-medium text-sm transition-colors border-b-2 whitespace-nowrap ${
              activeTab === tab.key
                ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                : "border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
            }`}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span className="ml-2 text-xs px-1.5 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded-full">{tab.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* ── Overview ──────────────────────────────────────────────────── */}
      {activeTab === "overview" && (
        <>
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <StatCard value={courses.length} label="Available Courses" color="blue" />
            <StatCard value={0} label="Enrolled" color="green" />
            <StatCard value="0h" label="Learning Time" color="purple" />
          </div>

          {/* Quick Actions */}
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 mb-8">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">Quick Actions</h2>
            <div className="flex flex-wrap gap-3">
              <Button variant="outline" size="sm" onClick={() => router.push("/courses")}>Browse All Courses</Button>
              <Button variant="outline" size="sm" onClick={() => setActiveTab("profile")}>Edit Profile</Button>
            </div>
          </div>

          {/* Recent Courses Preview */}
          {!loadingCourses && courses.length > 0 && (
            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">Featured Courses</h2>
                <Button variant="outline" size="sm" onClick={() => setActiveTab("courses")}>View All</Button>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {courses.slice(0, 3).map((course) => (
                  <CourseCard key={course.id} course={course} onClick={() => router.push(`/courses/${course.id}`)} />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* ── Courses ───────────────────────────────────────────────────── */}
      {activeTab === "courses" && (
        <>
          {loadingCourses ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent" />
            </div>
          ) : courses.length > 0 ? (
            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">Available Courses</h2>
                <Button variant="outline" size="sm" onClick={() => router.push("/courses")}>Browse Catalog</Button>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {courses.map((course) => (
                  <CourseCard key={course.id} course={course} onClick={() => router.push(`/courses/${course.id}`)} />
                ))}
              </div>
            </div>
          ) : (
            <EmptyState message="No courses available yet. Check back later!" />
          )}
        </>
      )}

      {/* ── Profile ───────────────────────────────────────────────────── */}
      {activeTab === "profile" && (
        <div className="max-w-xl">
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">Profile</h2>
              {!editingProfile && (
                <Button variant="outline" size="sm" onClick={() => setEditingProfile(true)}>Edit</Button>
              )}
            </div>

            {editingProfile ? (
              <form onSubmit={handleSaveProfile} className="space-y-4">
                <Input label="First Name" value={profileForm.first_name} onChange={(e) => setProfileForm({ ...profileForm, first_name: e.target.value })} disabled={savingProfile} required />
                <Input label="Last Name" value={profileForm.last_name} onChange={(e) => setProfileForm({ ...profileForm, last_name: e.target.value })} disabled={savingProfile} required />
                <Input label="Phone" type="tel" value={profileForm.phone_number} onChange={(e) => setProfileForm({ ...profileForm, phone_number: e.target.value })} disabled={savingProfile} />
                <div className="flex gap-3 pt-2">
                  <Button type="button" variant="outline" onClick={() => setEditingProfile(false)} className="flex-1">Cancel</Button>
                  <Button type="submit" loading={savingProfile} className="flex-1">Save</Button>
                </div>
              </form>
            ) : (
              <div className="space-y-4 text-sm">
                <ProfileRow label="Name" value={`${user?.first_name} ${user?.last_name}`} />
                <ProfileRow label="Email" value={user?.email} />
                <ProfileRow label="Phone" value={user?.phone_number || "Not set"} />
                <ProfileRow label="Role" value="Student" />
                <ProfileRow label="Joined" value={user?.created_at ? new Date(user.created_at).toLocaleDateString() : "—"} />
              </div>
            )}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

function ProfileRow({ label, value }) {
  return (
    <div className="flex justify-between py-2 border-b border-zinc-100 dark:border-zinc-800 last:border-0">
      <span className="text-zinc-500 dark:text-zinc-400">{label}</span>
      <span className="font-medium text-zinc-900 dark:text-white">{value}</span>
    </div>
  );
}

function CourseCard({ course, onClick }) {
  return (
    <div
      className="border border-zinc-200 dark:border-zinc-800 rounded-lg p-4 hover:border-indigo-500 transition-colors cursor-pointer"
      onClick={onClick}
    >
      <h3 className="font-semibold text-zinc-900 dark:text-white mb-2">{course.title}</h3>
      <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4 line-clamp-2">{course.description}</p>
      <div className="flex items-center justify-between text-sm">
        <span className="text-indigo-600 dark:text-indigo-400 font-semibold">₹{course.price}</span>
        <span className="text-zinc-500 dark:text-zinc-400">{course.duration_hours}h</span>
      </div>
    </div>
  );
}

function StatCard({ value, label, color }) {
  const colors = {
    blue: "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400",
    green: "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400",
    purple: "bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400",
  };
  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${colors[color]}`}>
          <span className="text-xl font-bold">{value}</span>
        </div>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium">{label}</p>
      </div>
    </div>
  );
}

function EmptyState({ message }) {
  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-12 text-center">
      <p className="text-zinc-500 dark:text-zinc-400">{message}</p>
    </div>
  );
}
