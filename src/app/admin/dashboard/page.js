"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { adminApi, courseApi, authApi } from "@/lib/api";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

export default function AdminDashboardPage() {
  const router = useRouter();
  const { user, role, loading, isAuthenticated } = useAuth();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState("instructors");

  // Instructors
  const [instructors, setInstructors] = useState([]);
  const [loadingInstructors, setLoadingInstructors] = useState(true);
  const [approvingId, setApprovingId] = useState(null);
  const [deletingUserId, setDeletingUserId] = useState(null);

  // Students
  const [students, setStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(true);

  // Deleted users
  const [deletedUsers, setDeletedUsers] = useState([]);
  const [loadingDeleted, setLoadingDeleted] = useState(true);

  // Courses
  const [courses, setCourses] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [courseForm, setCourseForm] = useState({
    title: "", description: "", price: "", duration_hours: "", start_date: "", end_date: "", intro_link: "",
  });
  const [submittingCourse, setSubmittingCourse] = useState(false);

  // Sections & Lessons management
  const [showContentModal, setShowContentModal] = useState(false);
  const [contentCourse, setContentCourse] = useState(null);
  const [contentSections, setContentSections] = useState([]);
  const [loadingContent, setLoadingContent] = useState(false);
  const [sectionForm, setSectionForm] = useState({ title: "" });
  const [editingSectionId, setEditingSectionId] = useState(null);
  const [submittingSection, setSubmittingSection] = useState(false);
  const [lessonForm, setLessonForm] = useState({ title: "", content_type: "video", content_url: "" });
  const [editingLessonId, setEditingLessonId] = useState(null);
  const [addLessonSectionId, setAddLessonSectionId] = useState(null);
  const [submittingLesson, setSubmittingLesson] = useState(false);
  const [expandedContentSections, setExpandedContentSections] = useState({});

  // Assign instructor modal
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignCourseId, setAssignCourseId] = useState(null);
  const [assignInstructorId, setAssignInstructorId] = useState("");
  const [assigningInstructor, setAssigningInstructor] = useState(false);

  // Change password
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ old_password: "", new_password: "", confirm_password: "" });
  const [changingPassword, setChangingPassword] = useState(false);

  // Register new admin
  const [adminRegForm, setAdminRegForm] = useState({ first_name: "", last_name: "", email: "", password: "", phone_number: "" });
  const [registeringAdmin, setRegisteringAdmin] = useState(false);

  useEffect(() => {
    if (!loading && (!isAuthenticated || role !== "admin")) {
      router.push("/auth/admin/login");
    }
  }, [loading, isAuthenticated, role, router]);

  const fetchInstructors = useCallback(async () => {
    try {
      const res = await adminApi.getInstructors();
      if (res.success) setInstructors(res.data || []);
    } catch (err) { toast.error(err.message || "Failed to fetch instructors"); }
    finally { setLoadingInstructors(false); }
  }, [toast]);

  const fetchStudents = useCallback(async () => {
    try {
      const res = await adminApi.getStudents();
      if (res.success) setStudents(res.data || []);
    } catch (err) { toast.error(err.message || "Failed to fetch students"); }
    finally { setLoadingStudents(false); }
  }, [toast]);

  const fetchDeletedUsers = useCallback(async () => {
    try {
      const res = await adminApi.getDeletedUsers();
      if (res.success) setDeletedUsers(res.data || []);
    } catch (err) { toast.error(err.message || "Failed to fetch deleted users"); }
    finally { setLoadingDeleted(false); }
  }, [toast]);

  const fetchCourses = useCallback(async () => {
    try {
      const res = await courseApi.adminViewAllCourses();
      if (res.success) {
        setCourses(res.data || []);
        return res.data || [];
      }
    } catch (err) { toast.error(err.message || "Failed to fetch courses"); }
    finally { setLoadingCourses(false); }
    return null;
  }, [toast]);

  useEffect(() => {
    if (isAuthenticated && role === "admin") {
      fetchInstructors();
      fetchStudents();
      fetchCourses();
      fetchDeletedUsers();
    }
  }, [isAuthenticated, role, fetchInstructors, fetchStudents, fetchCourses, fetchDeletedUsers]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleApprove = async (id) => {
    setApprovingId(id);
    try {
      const res = await adminApi.approveInstructor(id);
      toast.success(res.message || "Instructor approved");
      fetchInstructors();
    } catch (err) { toast.error(err.message); }
    finally { setApprovingId(null); }
  };

  const handleDeleteUser = async (id) => {
    if (!confirm("Are you sure you want to delete this user? This action cannot be undone.")) return;
    setDeletingUserId(id);
    try {
      const res = await adminApi.deleteUser(id);
      toast.success(res.message || "User deleted");
      fetchInstructors();
      fetchStudents();
      fetchDeletedUsers();
    } catch (err) { toast.error(err.message); }
    finally { setDeletingUserId(null); }
  };

  const handleCreateCourse = () => {
    setCourseForm({ title: "", description: "", price: "", duration_hours: "", start_date: "", end_date: "", intro_link: "" });
    setEditingCourse(null);
    setShowCourseModal(true);
  };

  const handleEditCourse = (course) => {
    setCourseForm({
      title: course.title,
      description: course.description || "",
      price: course.price.toString(),
      duration_hours: course.duration_hours.toString(),
      start_date: course.start_date?.split("T")[0] || "",
      end_date: course.end_date?.split("T")[0] || "",
      intro_link: course.intro_link || "",
    });
    setEditingCourse(course);
    setShowCourseModal(true);
  };

  const handleSubmitCourse = async (e) => {
    e.preventDefault();
    setSubmittingCourse(true);
    try {
      const data = {
        title: courseForm.title,
        description: courseForm.description,
        price: parseInt(courseForm.price),
        duration_hours: parseInt(courseForm.duration_hours),
        start_date: new Date(courseForm.start_date),
        end_date: new Date(courseForm.end_date),
        ...(courseForm.intro_link ? { intro_link: courseForm.intro_link } : {}),
      };
      if (editingCourse) {
        await courseApi.updateCourse(editingCourse.id, data);
        toast.success("Course updated");
      } else {
        await courseApi.createCourse(data);
        toast.success("Course created");
      }
      setShowCourseModal(false);
      fetchCourses();
    } catch (err) { toast.error(err.message || "Failed to save course"); }
    finally { setSubmittingCourse(false); }
  };

  const handleToggleVisibility = async (courseId) => {
    try {
      await courseApi.toggleVisibility(courseId);
      toast.success("Visibility toggled");
      fetchCourses();
    } catch (err) { toast.error(err.message); }
  };

  const handleDeleteCourse = async (courseId) => {
    if (!confirm("Delete this course?")) return;
    try {
      await courseApi.deleteCourse(courseId);
      toast.success("Course deleted");
      fetchCourses();
    } catch (err) { toast.error(err.message); }
  };

  const handleAssignInstructor = async (e) => {
    e.preventDefault();
    if (!assignInstructorId) return;
    setAssigningInstructor(true);
    try {
      const res = await adminApi.assignInstructor(assignCourseId, assignInstructorId);
      toast.success(res.message || "Instructor assigned");
      setShowAssignModal(false);
      fetchCourses();
    } catch (err) { toast.error(err.message); }
    finally { setAssigningInstructor(false); }
  };

  const handleUnassignInstructor = async (courseId, instructorId) => {
    if (!confirm("Remove this instructor from the course?")) return;
    try {
      const res = await adminApi.unassignInstructor(courseId, instructorId);
      toast.success(res.message || "Instructor removed");
      fetchCourses();
    } catch (err) { toast.error(err.message); }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      toast.error("Passwords do not match");
      return;
    }
    if (passwordForm.new_password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    setChangingPassword(true);
    try {
      const res = await authApi.adminChangePassword({
        old_password: passwordForm.old_password,
        new_password: passwordForm.new_password,
      });
      toast.success(res.message || "Password changed");
      setShowPasswordModal(false);
      setPasswordForm({ old_password: "", new_password: "", confirm_password: "" });
    } catch (err) { toast.error(err.message); }
    finally { setChangingPassword(false); }
  };

  const handleRegisterAdmin = async (e) => {
    e.preventDefault();
    if (adminRegForm.password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    setRegisteringAdmin(true);
    try {
      const res = await authApi.adminRegister(adminRegForm);
      toast.success(res.message || "Admin registered successfully");
      setAdminRegForm({ first_name: "", last_name: "", email: "", password: "", phone_number: "" });
    } catch (err) { toast.error(err.message || "Failed to register admin"); }
    finally { setRegisteringAdmin(false); }
  };

  // ── Sections & Lessons Handlers ───────────────────────────────────────────

  // Refresh both courses list and content modal sections in a single API call
  const refreshContent = useCallback(async (courseId) => {
    setLoadingContent(true);
    try {
      const data = await fetchCourses();
      if (data) {
        const full = data.find((c) => c.id === courseId);
        const sections = full?.sections || [];
        setContentSections(sections);
        const exp = {};
        sections.forEach((s) => (exp[s.id] = true));
        setExpandedContentSections(exp);
      }
    } catch (err) {
      toast.error(err.message || "Failed to load course content");
    } finally {
      setLoadingContent(false);
    }
  }, [fetchCourses, toast]);

  const handleManageContent = async (course) => {
    setContentCourse(course);
    setShowContentModal(true);
    await refreshContent(course.id);
  };

  const handleAddSection = async (e) => {
    e.preventDefault();
    if (!sectionForm.title.trim()) return;
    setSubmittingSection(true);
    try {
      const nextPosition = contentSections.length + 1;
      await adminApi.addSection(contentCourse.id, { title: sectionForm.title, position: nextPosition });
      toast.success("Section added");
      setSectionForm({ title: "" });
      await refreshContent(contentCourse.id);
    } catch (err) { toast.error(err.message || "Failed to add section"); }
    finally { setSubmittingSection(false); }
  };

  const handleUpdateSection = async (e) => {
    e.preventDefault();
    if (!sectionForm.title.trim()) return;
    setSubmittingSection(true);
    try {
      const currentSection = contentSections.find(s => s.id === editingSectionId);
      await adminApi.updateSection(editingSectionId, { title: sectionForm.title, position: currentSection?.position || 1 });
      toast.success("Section updated");
      setSectionForm({ title: "" });
      setEditingSectionId(null);
      await refreshContent(contentCourse.id);
    } catch (err) { toast.error(err.message || "Failed to update section"); }
    finally { setSubmittingSection(false); }
  };

  const handleDeleteSection = async (sectionId) => {
    if (!confirm("Delete this section and all its lessons?")) return;
    try {
      await adminApi.deleteSection(sectionId);
      toast.success("Section deleted");
      await refreshContent(contentCourse.id);
    } catch (err) { toast.error(err.message || "Failed to delete section"); }
  };

  const handleAddLesson = async (e) => {
    e.preventDefault();
    if (!lessonForm.title.trim()) return;
    setSubmittingLesson(true);
    try {
      const section = contentSections.find(s => s.id === addLessonSectionId);
      const nextPosition = (section?.lessons?.length || 0) + 1;
      await adminApi.addLesson(addLessonSectionId, {
        title: lessonForm.title,
        content_type: lessonForm.content_type,
        content_url: lessonForm.content_url || undefined,
        position: nextPosition,
      });
      toast.success("Lesson added");
      setLessonForm({ title: "", content_type: "video", content_url: "" });
      setAddLessonSectionId(null);
      await refreshContent(contentCourse.id);
    } catch (err) { toast.error(err.message || "Failed to add lesson"); }
    finally { setSubmittingLesson(false); }
  };

  const handleUpdateLesson = async (e) => {
    e.preventDefault();
    if (!lessonForm.title.trim()) return;
    setSubmittingLesson(true);
    try {
      const section = contentSections.find(s => s.id === addLessonSectionId);
      const currentLesson = section?.lessons?.find(l => l.id === editingLessonId);
      await adminApi.updateLesson(editingLessonId, {
        title: lessonForm.title,
        content_type: lessonForm.content_type,
        content_url: lessonForm.content_url || undefined,
        position: currentLesson?.position || 1,
      });
      toast.success("Lesson updated");
      setLessonForm({ title: "", content_type: "video", content_url: "" });
      setEditingLessonId(null);
      setAddLessonSectionId(null);
      await refreshContent(contentCourse.id);
    } catch (err) { toast.error(err.message || "Failed to update lesson"); }
    finally { setSubmittingLesson(false); }
  };

  const handleDeleteLesson = async (lessonId) => {
    if (!confirm("Delete this lesson?")) return;
    try {
      await adminApi.deleteLesson(lessonId);
      toast.success("Lesson deleted");
      await refreshContent(contentCourse.id);
    } catch (err) { toast.error(err.message || "Failed to delete lesson"); }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated || role !== "admin") return null;

  const approvedInstructors = instructors.filter((i) => i.admin_verified);

  const tabs = [
    { key: "instructors", label: "Instructors", count: instructors.length },
    { key: "students", label: "Students", count: students.length },
    { key: "courses", label: "Courses", count: courses.length },
    { key: "deleted", label: "Deleted Users", count: deletedUsers.length },
    { key: "settings", label: "Settings" },
  ];

  return (
    <DashboardLayout
      title={`Hello, ${user?.first_name || "Admin"}! 👋`}
      subtitle="Manage your platform from the admin control panel."
      portalLabel="Learnify Admin"
    >
      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-zinc-200 dark:border-zinc-800 overflow-x-auto">
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
              <span className="ml-2 text-xs px-1.5 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded-full">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Instructors Tab ─────────────────────────────────────────────── */}
      {activeTab === "instructors" && (
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
          <div className="p-6 border-b border-zinc-200 dark:border-zinc-800">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">Instructor Management</h2>
          </div>
          {loadingInstructors ? (
            <LoadingSpinner />
          ) : instructors.length === 0 ? (
            <EmptyState message="No instructors found" />
          ) : (
            <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {instructors.map((inst) => (
                <div key={inst.id} className="p-6 hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-all">
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <Avatar name={`${inst.first_name} ${inst.last_name}`} />
                      <div className="min-w-0">
                        <h3 className="font-semibold text-zinc-900 dark:text-white">
                          {inst.first_name} {inst.last_name}
                        </h3>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400 truncate">{inst.email}</p>
                        {inst.phone_number && (
                          <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">{inst.phone_number}</p>
                        )}
                      </div>
                    </div>
                    <SkillBadges skills={inst.skills} />
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <StatusBadge verified={inst.admin_verified} verifiedLabel="Approved" pendingLabel="Pending" />
                      <StatusBadge verified={inst.email_verified} verifiedLabel="Email Verified" pendingLabel="Email Unverified" />
                      {!inst.admin_verified && (
                        <Button size="sm" onClick={() => handleApprove(inst.id)} loading={approvingId === inst.id}>
                          Approve
                        </Button>
                      )}
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleDeleteUser(inst.id)}
                        loading={deletingUserId === inst.id}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Students Tab ────────────────────────────────────────────────── */}
      {activeTab === "students" && (
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
          <div className="p-6 border-b border-zinc-200 dark:border-zinc-800">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">Student Management</h2>
          </div>
          {loadingStudents ? (
            <LoadingSpinner />
          ) : students.length === 0 ? (
            <EmptyState message="No students found" />
          ) : (
            <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {students.map((stu) => (
                <div key={stu.id} className="p-6 hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-all">
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <Avatar name={`${stu.first_name} ${stu.last_name}`} />
                      <div className="min-w-0">
                        <h3 className="font-semibold text-zinc-900 dark:text-white">
                          {stu.first_name} {stu.last_name}
                        </h3>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400 truncate">{stu.email}</p>
                        {stu.phone_number && (
                          <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">{stu.phone_number}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <StatusBadge verified={stu.email_verified} verifiedLabel="Verified" pendingLabel="Unverified" />
                      <span className="text-xs text-zinc-400">
                        Joined {new Date(stu.created_at).toLocaleDateString()}
                      </span>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleDeleteUser(stu.id)}
                        loading={deletingUserId === stu.id}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Courses Tab ─────────────────────────────────────────────────── */}
      {activeTab === "courses" && (
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
          <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">Course Management</h2>
            <Button onClick={handleCreateCourse}>Create Course</Button>
          </div>
          {loadingCourses ? (
            <LoadingSpinner />
          ) : courses.length === 0 ? (
            <EmptyState message="No courses found" />
          ) : (
            <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {courses.map((course) => (
                <div key={course.id} className="p-6 hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">{course.title}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          course.is_published
                            ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400"
                            : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                        }`}>
                          {course.is_published ? "Published" : "Draft"}
                        </span>
                      </div>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-3 line-clamp-2">{course.description}</p>
                      <div className="flex flex-wrap gap-4 text-sm text-zinc-500 dark:text-zinc-400">
                        <span>${Number(course.price).toFixed(2)}</span>
                        <span>{course.duration_hours}h</span>
                        {course.sections && (
                          <span>{course.sections.length} section{course.sections.length !== 1 ? "s" : ""}</span>
                        )}
                        <span>
                          {new Date(course.start_date).toLocaleDateString()} – {new Date(course.end_date).toLocaleDateString()}
                        </span>
                      </div>
                      {/* Assigned instructors */}
                      {course.instructors && course.instructors.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          <span className="text-xs text-zinc-400">Instructors:</span>
                          {(typeof course.instructors === "string"
                            ? JSON.parse(course.instructors)
                            : course.instructors
                          ).map((inst, idx) => {
                            const name = typeof inst === "string" ? inst : `${inst.first_name} ${inst.last_name}`;
                            const instId = typeof inst === "object" ? inst.id : null;
                            return (
                              <span key={idx} className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded text-xs">
                                {name}
                                {instId && (
                                  <button
                                    onClick={() => handleUnassignInstructor(course.id, instId)}
                                    className="ml-1 hover:text-red-500"
                                    title="Remove instructor"
                                  >
                                    &times;
                                  </button>
                                )}
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
                      <Button variant="outline" size="sm" onClick={() => handleManageContent(course)}>
                        Content
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => {
                        setAssignCourseId(course.id);
                        setAssignInstructorId("");
                        setShowAssignModal(true);
                      }}>
                        Assign
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleToggleVisibility(course.id)}>
                        {course.is_published ? "Unpublish" : "Publish"}
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleEditCourse(course)}>
                        Edit
                      </Button>
                      <Button variant="danger" size="sm" onClick={() => handleDeleteCourse(course.id)}>
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Deleted Users Tab ───────────────────────────────────────────── */}
      {activeTab === "deleted" && (
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
          <div className="p-6 border-b border-zinc-200 dark:border-zinc-800">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">Deleted Users Archive</h2>
          </div>
          {loadingDeleted ? (
            <LoadingSpinner />
          ) : deletedUsers.length === 0 ? (
            <EmptyState message="No deleted users" />
          ) : (
            <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {deletedUsers.map((du) => (
                <div key={du.id} className="p-6">
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <Avatar name={`${du.first_name} ${du.last_name}`} />
                      <div className="min-w-0">
                        <h3 className="font-semibold text-zinc-900 dark:text-white">
                          {du.first_name} {du.last_name}
                        </h3>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400 truncate">{du.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-zinc-500 dark:text-zinc-400">
                      <span className="capitalize px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded text-xs">{du.role}</span>
                      <span>Deleted {new Date(du.deleted_at).toLocaleDateString()}</span>
                      {du.deleted_by_name && <span>by {du.deleted_by_name}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Settings Tab ────────────────────────────────────────────────── */}
      {activeTab === "settings" && (
        <div className="max-w-xl space-y-6">
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">Profile</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-zinc-500 dark:text-zinc-400">Name</span>
                <span className="font-medium text-zinc-900 dark:text-white">{user?.first_name} {user?.last_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500 dark:text-zinc-400">Email</span>
                <span className="font-medium text-zinc-900 dark:text-white">{user?.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500 dark:text-zinc-400">Role</span>
                <span className="font-medium text-zinc-900 dark:text-white capitalize">{user?.role}</span>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">Security</h2>
            <Button variant="outline" onClick={() => setShowPasswordModal(true)}>
              Change Password
            </Button>
          </div>
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">Register New Admin</h2>
            <form onSubmit={handleRegisterAdmin} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input label="First Name" required value={adminRegForm.first_name} onChange={(e) => setAdminRegForm({ ...adminRegForm, first_name: e.target.value })} disabled={registeringAdmin} />
                <Input label="Last Name" required value={adminRegForm.last_name} onChange={(e) => setAdminRegForm({ ...adminRegForm, last_name: e.target.value })} disabled={registeringAdmin} />
              </div>
              <Input label="Email" type="email" required value={adminRegForm.email} onChange={(e) => setAdminRegForm({ ...adminRegForm, email: e.target.value })} disabled={registeringAdmin} />
              <Input label="Phone Number" type="tel" required value={adminRegForm.phone_number} onChange={(e) => setAdminRegForm({ ...adminRegForm, phone_number: e.target.value })} disabled={registeringAdmin} />
              <Input label="Password" type="password" required value={adminRegForm.password} onChange={(e) => setAdminRegForm({ ...adminRegForm, password: e.target.value })} disabled={registeringAdmin} autoComplete="new-password" />
              <Button type="submit" loading={registeringAdmin}>Register Admin</Button>
            </form>
          </div>
        </div>
      )}

      {/* ── Course Modal ────────────────────────────────────────────────── */}
      {showCourseModal && (
        <Modal onClose={() => setShowCourseModal(false)} title={editingCourse ? "Edit Course" : "Create Course"}>
          <form onSubmit={handleSubmitCourse} className="space-y-4">
            <Input label="Title" required value={courseForm.title} onChange={(e) => setCourseForm({ ...courseForm, title: e.target.value })} disabled={submittingCourse} />
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Description</label>
              <textarea required value={courseForm.description} onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })} disabled={submittingCourse} rows={4}
                className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Price (₹)" type="number" required min="0" value={courseForm.price} onChange={(e) => setCourseForm({ ...courseForm, price: e.target.value })} disabled={submittingCourse} />
              <Input label="Duration (hours)" type="number" required min="1" value={courseForm.duration_hours} onChange={(e) => setCourseForm({ ...courseForm, duration_hours: e.target.value })} disabled={submittingCourse} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Start Date" type="date" required value={courseForm.start_date} onChange={(e) => setCourseForm({ ...courseForm, start_date: e.target.value })} disabled={submittingCourse} />
              <Input label="End Date" type="date" required value={courseForm.end_date} onChange={(e) => setCourseForm({ ...courseForm, end_date: e.target.value })} disabled={submittingCourse} />
            </div>
            <Input label="Intro Video URL" placeholder="https://www.youtube.com/embed/..." value={courseForm.intro_link} onChange={(e) => setCourseForm({ ...courseForm, intro_link: e.target.value })} disabled={submittingCourse} />
            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setShowCourseModal(false)} disabled={submittingCourse} className="flex-1">Cancel</Button>
              <Button type="submit" loading={submittingCourse} className="flex-1">
                {editingCourse ? "Update Course" : "Create Course"}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ── Assign Instructor Modal ─────────────────────────────────────── */}
      {showAssignModal && (
        <Modal onClose={() => setShowAssignModal(false)} title="Assign Instructor to Course">
          <form onSubmit={handleAssignInstructor} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Select Instructor</label>
              <select
                value={assignInstructorId}
                onChange={(e) => setAssignInstructorId(e.target.value)}
                className="w-full px-4 py-2.5 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              >
                <option value="">Choose an instructor...</option>
                {approvedInstructors.map((inst) => (
                  <option key={inst.id} value={inst.id}>
                    {inst.first_name} {inst.last_name} ({inst.email})
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setShowAssignModal(false)} className="flex-1">Cancel</Button>
              <Button type="submit" loading={assigningInstructor} className="flex-1">Assign</Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ── Change Password Modal ───────────────────────────────────────── */}
      {showPasswordModal && (
        <Modal onClose={() => setShowPasswordModal(false)} title="Change Password">
          <form onSubmit={handleChangePassword} className="space-y-4">
            <Input label="Current Password" type="password" required value={passwordForm.old_password}
              onChange={(e) => setPasswordForm({ ...passwordForm, old_password: e.target.value })} disabled={changingPassword} autoComplete="current-password" />
            <Input label="New Password" type="password" required value={passwordForm.new_password}
              onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })} disabled={changingPassword} autoComplete="new-password" />
            <Input label="Confirm New Password" type="password" required value={passwordForm.confirm_password}
              onChange={(e) => setPasswordForm({ ...passwordForm, confirm_password: e.target.value })} disabled={changingPassword} autoComplete="new-password" />
            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setShowPasswordModal(false)} className="flex-1">Cancel</Button>
              <Button type="submit" loading={changingPassword} className="flex-1">Change Password</Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ── Content Management Modal ────────────────────────────────────── */}
      {showContentModal && contentCourse && (
        <Modal onClose={() => { setShowContentModal(false); setEditingSectionId(null); setAddLessonSectionId(null); setEditingLessonId(null); }} title={`Manage Content — ${contentCourse.title}`}>
          {loadingContent ? (
            <LoadingSpinner />
          ) : (
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
              {/* Add Section Form */}
              <form onSubmit={editingSectionId ? handleUpdateSection : handleAddSection} className="flex gap-2">
                <Input
                  placeholder={editingSectionId ? "Edit section title…" : "New section title…"}
                  value={sectionForm.title}
                  onChange={(e) => setSectionForm({ title: e.target.value })}
                  disabled={submittingSection}
                  className="flex-1"
                />
                <Button type="submit" loading={submittingSection} size="sm">
                  {editingSectionId ? "Update" : "Add Section"}
                </Button>
                {editingSectionId && (
                  <Button type="button" variant="outline" size="sm" onClick={() => { setEditingSectionId(null); setSectionForm({ title: "" }); }}>
                    Cancel
                  </Button>
                )}
              </form>

              {/* Sections List */}
              {contentSections.length === 0 ? (
                <p className="text-sm text-zinc-400 text-center py-6">No sections yet. Add one above.</p>
              ) : (
                <div className="border border-zinc-200 dark:border-zinc-700 rounded-lg divide-y divide-zinc-200 dark:divide-zinc-700">
                  {contentSections.map((section, sIdx) => {
                    const isExpanded = !!expandedContentSections[section.id];
                    return (
                      <div key={section.id}>
                        {/* Section Header */}
                        <div className="flex items-center justify-between px-4 py-3 bg-zinc-50 dark:bg-zinc-800/50">
                          <button
                            className="flex items-center gap-2 flex-1 min-w-0 cursor-pointer"
                            onClick={() => setExpandedContentSections((prev) => ({ ...prev, [section.id]: !prev[section.id] }))}
                          >
                            <svg className={`w-4 h-4 text-zinc-400 transition-transform ${isExpanded ? "rotate-90" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                            <span className="text-xs font-bold text-zinc-400 dark:text-zinc-500 w-6">{sIdx + 1}</span>
                            <span className="font-medium text-zinc-900 dark:text-white text-sm truncate">{section.title}</span>
                            <span className="text-xs text-zinc-400 ml-1">({section.lessons?.length || 0} lesson{(section.lessons?.length || 0) !== 1 ? "s" : ""})</span>
                          </button>
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              onClick={() => { setEditingSectionId(section.id); setSectionForm({ title: section.title }); }}
                              className="p-1.5 text-zinc-400 hover:text-blue-600 transition-colors cursor-pointer"
                              title="Edit section"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleDeleteSection(section.id)}
                              className="p-1.5 text-zinc-400 hover:text-red-600 transition-colors cursor-pointer"
                              title="Delete section"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </div>

                        {/* Lessons */}
                        {isExpanded && (
                          <div className="bg-white dark:bg-zinc-900">
                            {section.lessons?.length > 0 && (
                              <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                                {section.lessons.map((lesson) => (
                                  <div key={lesson.id} className="flex items-center justify-between px-4 py-2.5 pl-12 hover:bg-zinc-50 dark:hover:bg-zinc-800/30">
                                    <div className="flex items-center gap-2 flex-1 min-w-0">
                                      <ContentTypeIcon type={lesson.content_type} />
                                      <span className="text-sm text-zinc-800 dark:text-zinc-200 truncate">{lesson.title}</span>
                                      <span className="text-xs text-zinc-400 capitalize">{lesson.content_type}</span>
                                    </div>
                                    <div className="flex items-center gap-1 shrink-0">
                                      <button
                                        onClick={() => {
                                          setEditingLessonId(lesson.id);
                                          setAddLessonSectionId(section.id);
                                          setLessonForm({ title: lesson.title, content_type: lesson.content_type || "video", content_url: lesson.content_url || "" });
                                        }}
                                        className="p-1 text-zinc-400 hover:text-blue-600 transition-colors cursor-pointer"
                                        title="Edit lesson"
                                      >
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                        </svg>
                                      </button>
                                      <button
                                        onClick={() => handleDeleteLesson(lesson.id)}
                                        className="p-1 text-zinc-400 hover:text-red-600 transition-colors cursor-pointer"
                                        title="Delete lesson"
                                      >
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Add/Edit Lesson Form */}
                            {addLessonSectionId === section.id ? (
                              <form onSubmit={editingLessonId ? handleUpdateLesson : handleAddLesson} className="px-4 py-3 pl-12 border-t border-zinc-100 dark:border-zinc-800 space-y-2">
                                <Input placeholder="Lesson title" value={lessonForm.title} onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })} disabled={submittingLesson} />
                                <div className="grid grid-cols-2 gap-2">
                                  <select
                                    value={lessonForm.content_type}
                                    onChange={(e) => setLessonForm({ ...lessonForm, content_type: e.target.value })}
                                    className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    disabled={submittingLesson}
                                  >
                                    <option value="video">Video</option>
                                    <option value="article">Article</option>
                                    <option value="quiz">Quiz</option>
                                  </select>
                                  <Input placeholder="Content URL (optional)" value={lessonForm.content_url} onChange={(e) => setLessonForm({ ...lessonForm, content_url: e.target.value })} disabled={submittingLesson} />
                                </div>
                                <div className="flex gap-2">
                                  <Button type="submit" size="sm" loading={submittingLesson}>
                                    {editingLessonId ? "Update" : "Add Lesson"}
                                  </Button>
                                  <Button type="button" variant="outline" size="sm" onClick={() => { setAddLessonSectionId(null); setEditingLessonId(null); setLessonForm({ title: "", content_type: "video", content_url: "" }); }}>
                                    Cancel
                                  </Button>
                                </div>
                              </form>
                            ) : (
                              <button
                                onClick={() => { setAddLessonSectionId(section.id); setEditingLessonId(null); setLessonForm({ title: "", content_type: "video", content_url: "" }); }}
                                className="w-full px-4 py-2.5 pl-12 text-left text-sm text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors border-t border-zinc-100 dark:border-zinc-800 cursor-pointer"
                              >
                                + Add Lesson
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </Modal>
      )}
    </DashboardLayout>
  );
}

// ── Shared components ───────────────────────────────────────────────────────

function Modal({ children, onClose, title }) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto" onClick={onClose}>
      <div className="bg-white dark:bg-zinc-900 rounded-xl max-w-2xl w-full p-6 my-8 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">{title}</h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Avatar({ name }) {
  const initials = name.split(" ").map((n) => n[0]).join("").substring(0, 2);
  return (
    <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg flex-shrink-0">
      <span className="text-sm font-bold text-white uppercase">{initials}</span>
    </div>
  );
}

function StatusBadge({ verified, verifiedLabel, pendingLabel }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full ${
      verified
        ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400"
        : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400"
    }`}>
      {verified ? verifiedLabel : pendingLabel}
    </span>
  );
}

function SkillBadges({ skills }) {
  if (!skills || skills.length === 0) {
    return <span className="text-sm text-zinc-400 dark:text-zinc-500">No skills</span>;
  }
  const list = Array.isArray(skills) ? skills : (typeof skills === "string" ? JSON.parse(skills) : []);
  return (
    <div className="flex flex-wrap gap-1.5">
      {list.slice(0, 3).map((skill, idx) => (
        <span key={idx} className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 rounded-md">
          {typeof skill === "string" ? skill.trim() : skill}
        </span>
      ))}
      {list.length > 3 && (
        <span className="px-2 py-0.5 text-xs text-zinc-500">+{list.length - 3}</span>
      )}
    </div>
  );
}

function LoadingSpinner() {
  return (
    <div className="p-12 text-center">
      <div className="animate-spin rounded-full h-8 w-8 border-4 border-indigo-600 border-t-transparent mx-auto" />
    </div>
  );
}

function EmptyState({ message }) {
  return (
    <div className="p-12 text-center">
      <p className="text-zinc-500 dark:text-zinc-400">{message}</p>
    </div>
  );
}

function ContentTypeIcon({ type }) {
  switch (type?.toLowerCase()) {
    case "video":
      return (
        <svg className="w-4 h-4 text-blue-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    case "article":
      return (
        <svg className="w-4 h-4 text-emerald-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      );
    case "quiz":
      return (
        <svg className="w-4 h-4 text-amber-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    default:
      return (
        <svg className="w-4 h-4 text-zinc-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      );
  }
}
