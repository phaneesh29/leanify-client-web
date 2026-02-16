"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { instructorApi } from "@/lib/api";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

export default function InstructorDashboardPage() {
  const router = useRouter();
  const { user, role, loading, isAuthenticated, checkAuth, updateProfile } = useAuth();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState("overview");

  // Courses
  const [courses, setCourses] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(true);

  // Skills
  const [skillInput, setSkillInput] = useState("");
  const [addingSkills, setAddingSkills] = useState(false);
  const [removingSkill, setRemovingSkill] = useState(null);

  // Profile editing
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({ first_name: "", last_name: "", phone_number: "" });
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    if (!loading && (!isAuthenticated || role !== "instructor")) {
      router.push("/auth/instructor/login");
    }
  }, [loading, isAuthenticated, role, router]);

  const fetchCourses = useCallback(async () => {
    try {
      const res = await instructorApi.myCourses();
      if (res.success) setCourses(res.data || []);
    } catch (err) {
      toast.error(err.message || "Failed to fetch your courses");
    } finally {
      setLoadingCourses(false);
    }
  }, [toast]);

  useEffect(() => {
    if (isAuthenticated && role === "instructor") {
      fetchCourses();
    }
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

  const handleAddSkills = async (e) => {
    e.preventDefault();
    if (!skillInput.trim()) {
      toast.error("Enter at least one skill");
      return;
    }
    const skills = skillInput.split(",").map((s) => s.trim()).filter(Boolean);
    setAddingSkills(true);
    try {
      await instructorApi.addSkills(skills);
      toast.success("Skills added successfully");
      setSkillInput("");
      await checkAuth(); // Refresh profile to show new skills
    } catch (err) {
      toast.error(err.message || "Failed to add skills");
    } finally {
      setAddingSkills(false);
    }
  };

  const handleRemoveSkill = async (skill) => {
    setRemovingSkill(skill);
    try {
      await instructorApi.removeSkill(skill);
      toast.success(`Removed "${skill}"`);
      await checkAuth();
    } catch (err) {
      toast.error(err.message || "Failed to remove skill");
    } finally {
      setRemovingSkill(null);
    }
  };

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

  if (!isAuthenticated || role !== "instructor") return null;

  const userSkills = Array.isArray(user?.skills)
    ? user.skills
    : typeof user?.skills === "string"
      ? JSON.parse(user.skills || "[]")
      : [];

  const tabs = [
    { key: "overview", label: "Overview" },
    { key: "my-courses", label: "My Courses", count: courses.length },
    { key: "skills", label: "Skills", count: userSkills.length },
    { key: "profile", label: "Profile" },
  ];

  return (
    <DashboardLayout
      title={`Hello, ${user?.first_name || "Instructor"}! 👋`}
      subtitle="Manage your courses and inspire your students."
      portalLabel="Instructor Portal"
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
          {/* Stats */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <StatCard icon="book" value={courses.length} label="My Courses" color="blue" />
            <StatCard icon="users" value={0} label="Students" color="green" />
            <StatCard icon="star" value={userSkills.length} label="Skills" color="purple" />
          </div>

          {/* Recent Courses Preview */}
          {loadingCourses ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent" />
            </div>
          ) : courses.length > 0 ? (
            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">My Courses</h2>
                <button
                  onClick={() => setActiveTab("my-courses")}
                  className="text-sm text-indigo-600 dark:text-indigo-400 font-medium hover:underline cursor-pointer"
                >
                  View All →
                </button>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {courses.slice(0, 3).map((course) => (
                  <div
                    key={course.id}
                    className="border border-zinc-200 dark:border-zinc-800 rounded-lg p-4 hover:border-indigo-500 transition-colors cursor-pointer"
                    onClick={() => router.push(`/courses/${course.id}`)}
                  >
                    <h3 className="font-semibold text-zinc-900 dark:text-white mb-2">{course.title}</h3>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4 line-clamp-2">{course.description}</p>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-indigo-600 dark:text-indigo-400 font-semibold">
                        {Number(course.price) === 0 ? "Free" : `$${Number(course.price).toFixed(2)}`}
                      </span>
                      <span className="text-zinc-500 dark:text-zinc-400">{course.duration_hours}h</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <EmptyState message="You haven't been assigned to any courses yet." />
          )}
        </>
      )}

      {/* ── My Courses ────────────────────────────────────────────────── */}
      {activeTab === "my-courses" && (
        <>
          {loadingCourses ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent" />
            </div>
          ) : courses.length > 0 ? (
            <div className="space-y-4">
              {courses.map((course) => {
                const sectionCount = course.sections?.length || 0;
                const lessonCount = course.sections?.reduce((acc, s) => acc + (s.lessons?.length || 0), 0) || 0;
                const instructors = course.instructors || [];

                return (
                  <div
                    key={course.id}
                    className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 hover:border-indigo-500 transition-colors cursor-pointer"
                    onClick={() => router.push(`/courses/${course.id}`)}
                  >
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-lg text-zinc-900 dark:text-white truncate">
                            {course.title}
                          </h3>

                        </div>
                        <p className="text-sm text-zinc-600 dark:text-zinc-400 line-clamp-2 mb-3">
                          {course.description}
                        </p>
                        <div className="flex flex-wrap gap-4 text-xs text-zinc-500 dark:text-zinc-400">
                          <span className="flex items-center gap-1">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {course.duration_hours}h
                          </span>
                          <span>{sectionCount} section{sectionCount !== 1 ? "s" : ""}</span>
                          <span>{lessonCount} lesson{lessonCount !== 1 ? "s" : ""}</span>
                          {instructors.length > 0 && (
                            <span>
                              {instructors.map((i) =>
                                typeof i === "string" ? i : `${i.first_name} ${i.last_name}`
                              ).join(", ")}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-xl font-bold text-zinc-900 dark:text-white">
                          {Number(course.price) === 0 ? "Free" : `$${Number(course.price).toFixed(2)}`}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState message="You haven't been assigned to any courses yet. An admin will assign you." />
          )}
        </>
      )}

      {/* ── Skills ────────────────────────────────────────────────────── */}
      {activeTab === "skills" && (
        <div className="max-w-2xl space-y-6">
          {/* Add skills */}
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">Add Skills</h2>
            <form onSubmit={handleAddSkills} className="flex gap-3">
              <Input
                placeholder="JavaScript, React, Node.js"
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                disabled={addingSkills}
                className="flex-1"
              />
              <Button type="submit" loading={addingSkills}>
                Add
              </Button>
            </form>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2">Separate multiple skills with commas</p>
          </div>

          {/* Current skills */}
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">Your Skills</h2>
            {userSkills.length === 0 ? (
              <p className="text-zinc-500 dark:text-zinc-400 text-sm">No skills added yet</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {userSkills.map((skill, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded-lg text-sm font-medium"
                  >
                    {typeof skill === "string" ? skill : skill}
                    <button
                      onClick={() => handleRemoveSkill(typeof skill === "string" ? skill : skill)}
                      disabled={removingSkill === skill}
                      className="hover:text-red-500 transition-colors disabled:opacity-50"
                      title="Remove skill"
                    >
                      {removingSkill === skill ? (
                        <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      )}
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Profile ───────────────────────────────────────────────────── */}
      {activeTab === "profile" && (
        <div className="max-w-xl">
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">Profile</h2>
              {!editingProfile && (
                <Button variant="outline" size="sm" onClick={() => setEditingProfile(true)}>
                  Edit
                </Button>
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
                <ProfileRow label="Role" value="Instructor" />
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
