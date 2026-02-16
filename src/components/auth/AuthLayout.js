"use client";

import Link from "next/link";

export default function AuthLayout({ children, title, subtitle }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">L</span>
            </div>
            <span className="text-2xl font-bold text-zinc-900 dark:text-white">Learnify</span>
          </Link>
          {title && (
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">{title}</h1>
          )}
          {subtitle && (
            <p className="mt-2 text-zinc-600 dark:text-zinc-400">{subtitle}</p>
          )}
        </div>
        <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-lg border border-zinc-200 dark:border-zinc-800 p-8">
          {children}
        </div>
      </div>
    </div>
  );
}
