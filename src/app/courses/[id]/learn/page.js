"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { enrollmentApi } from "@/lib/api";
import Button from "@/components/ui/Button";

/* ── Convert any YouTube URL to embed URL ───────────────────────────── */
function toYouTubeEmbed(url) {
    if (!url) return null;
    try {
        const u = new URL(url);
        if (u.pathname.startsWith("/embed/")) return url;
        if (u.hostname === "youtu.be") return `https://www.youtube.com/embed${u.pathname}`;
        const v = u.searchParams.get("v");
        if (v) return `https://www.youtube.com/embed/${v}`;
        const shortsMatch = u.pathname.match(/\/shorts\/([^/?]+)/);
        if (shortsMatch) return `https://www.youtube.com/embed/${shortsMatch[1]}`;
    } catch { /* not a valid URL */ }
    return null;
}

/* ── Content type icons ─────────────────────────────────────────────── */
function ContentIcon({ type }) {
    if (type === "video") return (
        <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
    );
    if (type === "article") return (
        <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
    );
    if (type === "quiz") return (
        <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
    );
    return null;
}

export default function LearnPage() {
    const { id } = useParams();
    const router = useRouter();
    const { role, loading: authLoading, isAuthenticated } = useAuth();
    const toast = useToast();

    const [course, setCourse] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Currently selected lesson
    const [activeLesson, setActiveLesson] = useState(null);
    const [expandedSections, setExpandedSections] = useState({});
    const [sidebarOpen, setSidebarOpen] = useState(true);

    useEffect(() => {
        if (authLoading) return;
        if (!isAuthenticated || role !== "student") {
            router.push("/auth/student/login");
            return;
        }
        if (!id) return;

        (async () => {
            try {
                const res = await enrollmentApi.getEnrolledCourse(id);
                if (res.success) {
                    setCourse(res.data);
                    // Auto-expand all sections and select first lesson
                    const expanded = {};
                    res.data.sections?.forEach(s => { expanded[s.id] = true; });
                    setExpandedSections(expanded);
                    // Select first lesson of first section
                    if (res.data.sections?.[0]?.lessons?.[0]) {
                        setActiveLesson(res.data.sections[0].lessons[0]);
                    }
                }
            } catch (err) {
                if (err.status === 403) {
                    setError("not_enrolled");
                } else if (err.status === 401) {
                    router.push("/auth/student/login");
                } else {
                    setError("general");
                    toast.error(err.message || "Failed to load course");
                }
            } finally {
                setLoading(false);
            }
        })();
    }, [id, authLoading, isAuthenticated, role]);

    const toggleSection = (sectionId) => {
        setExpandedSections(prev => ({ ...prev, [sectionId]: !prev[sectionId] }));
    };

    const totalLessons = course?.sections?.reduce((acc, s) => acc + (s.lessons?.length || 0), 0) || 0;

    /* ── Loading ─────────────────────────────────────────────────────── */
    if (loading || authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent mx-auto mb-4" />
                    <p className="text-zinc-500 dark:text-zinc-400 text-sm">Loading course content...</p>
                </div>
            </div>
        );
    }

    /* ── Not enrolled ────────────────────────────────────────────────── */
    if (error === "not_enrolled") {
        return (
            <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center">
                <div className="text-center max-w-md mx-auto px-4">
                    <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                    </div>
                    <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">Access Restricted</h2>
                    <p className="text-zinc-500 dark:text-zinc-400 mb-6">You need to be enrolled in this course to access its content.</p>
                    <div className="flex gap-3 justify-center">
                        <Button variant="outline" onClick={() => router.push(`/courses/${id}`)}>View Course</Button>
                        <Button onClick={() => router.push("/dashboard")}>Dashboard</Button>
                    </div>
                </div>
            </div>
        );
    }

    /* ── Error ────────────────────────────────────────────────────────── */
    if (error || !course) {
        return (
            <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-zinc-500 dark:text-zinc-400 mb-4">Something went wrong loading this course.</p>
                    <Button onClick={() => router.push("/dashboard")}>Back to Dashboard</Button>
                </div>
            </div>
        );
    }

    const embedUrl = activeLesson ? toYouTubeEmbed(activeLesson.content_url) : null;

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col">
            {/* ── Top Bar ──────────────────────────────────────────────────── */}
            <header className="h-14 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 flex items-center px-4 shrink-0 z-20">
                <button
                    onClick={() => router.push("/dashboard")}
                    className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors mr-4"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Dashboard
                </button>
                <div className="h-5 w-px bg-zinc-200 dark:bg-zinc-700 mr-4" />
                <h1 className="text-sm font-semibold text-zinc-900 dark:text-white truncate flex-1">{course.title}</h1>
                <button
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    className="lg:hidden ml-2 p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                </button>
            </header>

            {/* ── Main Layout ──────────────────────────────────────────────── */}
            <div className="flex flex-1 overflow-hidden">
                {/* ── Content Area ──────────────────────────────────────────── */}
                <main className="flex-1 overflow-y-auto">
                    {activeLesson ? (
                        <div>
                            {/* Video / Content Player */}
                            {activeLesson.content_type === "video" && embedUrl ? (
                                <div className="aspect-video bg-black">
                                    <iframe
                                        src={embedUrl}
                                        title={activeLesson.title}
                                        className="w-full h-full"
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        allowFullScreen
                                    />
                                </div>
                            ) : activeLesson.content_type === "video" && activeLesson.content_url ? (
                                <div className="aspect-video bg-black flex items-center justify-center">
                                    <a href={activeLesson.content_url} target="_blank" rel="noopener noreferrer"
                                        className="text-white underline hover:text-indigo-400 transition-colors">
                                        Open Video Link ↗
                                    </a>
                                </div>
                            ) : activeLesson.content_type === "article" && activeLesson.content_url ? (
                                <div className="w-full flex flex-col" style={{ height: "calc(100vh - 3.5rem)" }}>
                                    {/* Open in new tab bar */}
                                    <div className="flex items-center justify-between px-4 py-2.5 bg-emerald-50 dark:bg-emerald-950/30 border-b border-emerald-200 dark:border-emerald-800/40 shrink-0">
                                        <div className="flex items-center gap-2 min-w-0">
                                            <svg className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                            </svg>
                                            <span className="text-xs text-zinc-500 dark:text-zinc-400 truncate">{activeLesson.content_url}</span>
                                        </div>
                                        <a href={activeLesson.content_url} target="_blank" rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium shadow-sm transition-colors shrink-0 ml-3">
                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                            </svg>
                                            Open Article
                                        </a>
                                    </div>
                                    {/* Embedded via Google Docs Viewer (bypasses X-Frame-Options) */}
                                    <iframe
                                        src={`https://docs.google.com/gview?url=${encodeURIComponent(activeLesson.content_url)}&embedded=true`}
                                        title={activeLesson.title}
                                        className="w-full flex-1 border-0 bg-white dark:bg-zinc-900"
                                        loading="lazy"
                                    />
                                </div>
                            ) : (
                                <div className="aspect-video bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center">
                                    <div className="text-center">
                                        <ContentIcon type={activeLesson.content_type} />
                                        <p className="text-zinc-500 dark:text-zinc-400 mt-2 text-sm capitalize">{activeLesson.content_type} Lesson</p>
                                    </div>
                                </div>
                            )}

                            {/* Lesson Info */}
                            <div className="p-6 lg:p-8 max-w-4xl">
                                <div className="flex items-center gap-3 mb-3">
                                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${activeLesson.content_type === "video"
                                        ? "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400"
                                        : activeLesson.content_type === "article"
                                            ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400"
                                            : "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400"
                                        }`}>
                                        {activeLesson.content_type}
                                    </span>
                                    {activeLesson.duration_minutes && (
                                        <span className="text-xs text-zinc-500 dark:text-zinc-400">
                                            {activeLesson.duration_minutes} min
                                        </span>
                                    )}
                                </div>
                                <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-4">{activeLesson.title}</h2>

                                {/* Quiz */}
                                {activeLesson.content_type === "quiz" && (
                                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 text-center">
                                        <svg className="w-12 h-12 text-amber-500 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <h3 className="font-semibold text-zinc-900 dark:text-white mb-1">Quiz</h3>
                                        <p className="text-sm text-zinc-500 dark:text-zinc-400">Quiz content coming soon</p>
                                    </div>
                                )}

                                {/* Course info section */}
                                <div className="mt-8 border-t border-zinc-200 dark:border-zinc-800 pt-6">
                                    <h3 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-3">About this course</h3>
                                    <p className="text-zinc-600 dark:text-zinc-300 text-sm leading-relaxed">{course.description}</p>
                                    {course.instructors?.length > 0 && (
                                        <div className="mt-4">
                                            <span className="text-xs text-zinc-500 dark:text-zinc-400">Instructors: </span>
                                            <span className="text-sm text-zinc-700 dark:text-zinc-300">
                                                {course.instructors.map(i => `${i.first_name} ${i.last_name}`).join(", ")}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-full">
                            <div className="text-center px-4">
                                <svg className="w-16 h-16 text-zinc-300 dark:text-zinc-700 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                                <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-1">Select a lesson</h3>
                                <p className="text-sm text-zinc-500 dark:text-zinc-400">Choose a lesson from the sidebar to start learning</p>
                            </div>
                        </div>
                    )}
                </main>

                {/* ── Sidebar: Curriculum ────────────────────────────────────── */}
                <aside className={`${sidebarOpen ? "translate-x-0" : "translate-x-full"} 
          fixed lg:static inset-y-14 right-0 w-80 lg:w-[340px] bg-white dark:bg-zinc-900 
          border-l border-zinc-200 dark:border-zinc-800 overflow-y-auto transition-transform duration-200 
          z-10 lg:translate-x-0 shrink-0`}
                >
                    {/* Sidebar header */}
                    <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 sticky top-0 bg-white dark:bg-zinc-900 z-10">
                        <div className="flex items-center justify-between">
                            <h2 className="font-semibold text-zinc-900 dark:text-white text-sm">Course Content</h2>
                            <span className="text-xs text-zinc-500 dark:text-zinc-400">
                                {course.sections?.length} sections • {totalLessons} lessons
                            </span>
                        </div>
                    </div>

                    {/* Sections & lessons */}
                    <nav>
                        {course.sections?.map((section, sIdx) => (
                            <div key={section.id}>
                                {/* Section header */}
                                <button
                                    onClick={() => toggleSection(section.id)}
                                    className="w-full flex items-center justify-between px-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-left"
                                >
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                                            Section {sIdx + 1}
                                        </p>
                                        <p className="text-sm font-medium text-zinc-900 dark:text-white truncate mt-0.5">{section.title}</p>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0 ml-2">
                                        <span className="text-xs text-zinc-400 dark:text-zinc-500">{section.lessons?.length || 0}</span>
                                        <svg className={`w-4 h-4 text-zinc-400 transition-transform ${expandedSections[section.id] ? "rotate-180" : ""}`}
                                            fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </div>
                                </button>

                                {/* Lessons list */}
                                {expandedSections[section.id] && section.lessons?.map((lesson) => (
                                    <button
                                        key={lesson.id}
                                        onClick={() => { setActiveLesson(lesson); setSidebarOpen(false); }}
                                        className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors border-b border-zinc-100 dark:border-zinc-800/50 ${activeLesson?.id === lesson.id
                                            ? "bg-indigo-50 dark:bg-indigo-900/20 border-l-2 border-l-indigo-600"
                                            : "hover:bg-zinc-50 dark:hover:bg-zinc-800/30"
                                            }`}
                                    >
                                        <ContentIcon type={lesson.content_type} />
                                        <div className="flex-1 min-w-0">
                                            <p className={`text-sm truncate ${activeLesson?.id === lesson.id
                                                ? "font-semibold text-indigo-700 dark:text-indigo-400"
                                                : "text-zinc-700 dark:text-zinc-300"
                                                }`}>
                                                {lesson.title}
                                            </p>
                                            {lesson.duration_minutes && (
                                                <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">{lesson.duration_minutes} min</p>
                                            )}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        ))}

                        {(!course.sections || course.sections.length === 0) && (
                            <div className="p-8 text-center">
                                <p className="text-sm text-zinc-500 dark:text-zinc-400">No content available yet</p>
                            </div>
                        )}
                    </nav>
                </aside>
            </div>

            {/* Mobile overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/30 z-[5] lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}
        </div>
    );
}
