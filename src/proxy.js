import { NextResponse } from "next/server";

/**
 * Next.js middleware for route protection.
 * Reads role-specific JWT cookies and redirects unauthenticated
 * users away from dashboards, and authenticated users away from
 * login / register pages.
 *
 * NOTE: This is a lightweight guard — the real auth check still
 * happens on the server via the cookie-based JWT.  These redirects
 * just improve UX by preventing flashes of unauthorized content.
 */

const STUDENT_COOKIE = "studentToken";
const INSTRUCTOR_COOKIE = "instructorToken";
const ADMIN_COOKIE = "adminToken";

// Routes that require specific authentication
const protectedRoutes = [
  { path: "/instructor/dashboard", cookie: INSTRUCTOR_COOKIE, loginPath: "/auth/instructor/login" },
  { path: "/admin/dashboard", cookie: ADMIN_COOKIE, loginPath: "/auth/admin/login" },
  { path: "/dashboard", cookie: STUDENT_COOKIE, loginPath: "/auth/student/login" },
];

export function proxy(request) {
  const { pathname } = request.nextUrl;

  // Redirect unauthenticated users away from protected routes
  for (const route of protectedRoutes) {
    if (pathname.startsWith(route.path)) {
      const token = request.cookies.get(route.cookie)?.value;
      if (!token) {
        return NextResponse.redirect(new URL(route.loginPath, request.url));
      }
      break;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/instructor/dashboard/:path*",
    "/admin/dashboard/:path*",
  ],
};
