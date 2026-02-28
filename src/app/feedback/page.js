"use client";

import { useState } from "react";
import Link from "next/link";
import { feedbackApi } from "@/lib/api";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

const categories = [
    { value: "general", label: "General" },
    { value: "course_content", label: "Course Content" },
    { value: "platform_issue", label: "Platform Issue" },
    { value: "instructor", label: "Instructor" },
    { value: "suggestion", label: "Suggestion" },
    { value: "complaint", label: "Complaint" },
];

export default function FeedbackPage() {
    const [form, setForm] = useState({
        name: "", email: "", subject: "", category: "general", message: "", rating: 0,
    });
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState("");
    const [hoverRating, setHoverRating] = useState(0);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setSubmitting(true);
        try {
            const data = {
                name: form.name,
                email: form.email,
                subject: form.subject,
                category: form.category,
                message: form.message,
                ...(form.rating > 0 ? { rating: form.rating } : {}),
            };
            await feedbackApi.submitFeedback(data);
            setSubmitted(true);
        } catch (err) {
            setError(err.message || "Failed to submit feedback. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    if (submitted) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950 px-4 py-12">
                <div className="w-full max-w-md text-center">
                    <div className="w-16 h-16 bg-green-100 dark:bg-green-900/40 rounded-full flex items-center justify-center mx-auto mb-6">
                        <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">Thank You!</h1>
                    <p className="text-zinc-600 dark:text-zinc-400 mb-8">
                        Your feedback has been submitted successfully. We appreciate you taking the time to share your thoughts with us.
                    </p>
                    <div className="flex gap-3 justify-center">
                        <Button onClick={() => { setSubmitted(false); setForm({ name: "", email: "", subject: "", category: "general", message: "", rating: 0 }); }}>
                            Submit Another
                        </Button>
                        <Link href="/">
                            <Button variant="outline">Back to Home</Button>
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 px-4 py-12">
            <div className="w-full max-w-2xl mx-auto">
                {/* Header */}
                <div className="text-center mb-10">
                    <Link href="/" className="inline-flex items-center gap-2 mb-6">
                        <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center">
                            <span className="text-white font-bold text-xl">L</span>
                        </div>
                        <span className="text-2xl font-bold text-zinc-900 dark:text-white">Learnify</span>
                    </Link>
                    <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">Share Your Feedback</h1>
                    <p className="mt-2 text-zinc-600 dark:text-zinc-400">
                        We value your input. Help us improve by sharing your experience.
                    </p>
                </div>

                {/* Form Card */}
                <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-lg border border-zinc-200 dark:border-zinc-800 p-8">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {error && (
                            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm">
                                {error}
                            </div>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Input label="Name" required placeholder="Your name" value={form.name}
                                onChange={(e) => setForm({ ...form, name: e.target.value })} disabled={submitting} />
                            <Input label="Email" type="email" required placeholder="you@example.com" value={form.email}
                                onChange={(e) => setForm({ ...form, email: e.target.value })} disabled={submitting} />
                        </div>

                        <Input label="Subject" required placeholder="Brief summary of your feedback" value={form.subject}
                            onChange={(e) => setForm({ ...form, subject: e.target.value })} disabled={submitting} />

                        <div>
                            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Category</label>
                            <select
                                value={form.category}
                                onChange={(e) => setForm({ ...form, category: e.target.value })}
                                disabled={submitting}
                                className="w-full px-4 py-2.5 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors duration-200"
                            >
                                {categories.map((c) => (
                                    <option key={c.value} value={c.value}>{c.label}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                                Message <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                value={form.message}
                                onChange={(e) => setForm({ ...form, message: e.target.value })}
                                disabled={submitting}
                                required
                                minLength={10}
                                maxLength={2000}
                                rows={5}
                                placeholder="Tell us about your experience..."
                                className="w-full px-4 py-2.5 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors duration-200 resize-none"
                            />
                            <p className="mt-1 text-xs text-zinc-400">{form.message.length}/2000 characters</p>
                        </div>

                        {/* Star Rating */}
                        <div>
                            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                                Rating <span className="text-zinc-400 font-normal">(optional)</span>
                            </label>
                            <div className="flex items-center gap-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                        key={star}
                                        type="button"
                                        disabled={submitting}
                                        onClick={() => setForm({ ...form, rating: form.rating === star ? 0 : star })}
                                        onMouseEnter={() => setHoverRating(star)}
                                        onMouseLeave={() => setHoverRating(0)}
                                        className="p-1 transition-transform hover:scale-110 cursor-pointer disabled:cursor-not-allowed"
                                    >
                                        <svg
                                            className={`w-8 h-8 transition-colors ${(hoverRating || form.rating) >= star
                                                    ? "text-yellow-400 fill-yellow-400"
                                                    : "text-zinc-300 dark:text-zinc-600"
                                                }`}
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                            strokeWidth={1.5}
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                                            />
                                        </svg>
                                    </button>
                                ))}
                                {form.rating > 0 && (
                                    <span className="ml-2 text-sm text-zinc-500">{form.rating}/5</span>
                                )}
                            </div>
                        </div>

                        <div className="pt-2">
                            <Button type="submit" loading={submitting} className="w-full">
                                Submit Feedback
                            </Button>
                        </div>
                    </form>
                </div>

                {/* Back to home link */}
                <div className="text-center mt-6">
                    <Link href="/" className="text-sm text-zinc-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                        ← Back to home
                    </Link>
                </div>
            </div>
        </div>
    );
}
