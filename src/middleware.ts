import { NextResponse } from "next/server";

export function middleware() {
  // Auth is handled client-side via Supabase JS (localStorage).
  // Server-side cookie auth can be added later with @supabase/ssr.
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|sprites).*)"],
};
