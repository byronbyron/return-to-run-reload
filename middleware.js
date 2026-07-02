import { NextResponse } from "next/server";
import { SESSION_COOKIE, isValidSession } from "./lib/auth";

export const config = {
  matcher: ["/", "/api/data"],
};

export async function middleware(req) {
  const cookie = req.cookies.get(SESSION_COOKIE)?.value;
  if (await isValidSession(cookie)) {
    return NextResponse.next();
  }
  if (req.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }
  const url = req.nextUrl.clone();
  url.pathname = "/login";
  return NextResponse.redirect(url);
}
