import { NextResponse } from "next/server";
import { SESSION_COOKIE, SESSION_MAX_AGE, expectedSessionToken } from "../../../lib/auth";

export async function POST(req) {
  if (!process.env.APP_PASSWORD) {
    return NextResponse.json(
      { error: "APP_PASSWORD is not set on the server. Add it in Vercel project settings." },
      { status: 500 }
    );
  }
  const body = await req.json().catch(() => ({}));
  const password = body?.password || "";
  if (password !== process.env.APP_PASSWORD) {
    return NextResponse.json({ error: "Incorrect password." }, { status: 401 });
  }
  const token = await expectedSessionToken();
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
  return res;
}
