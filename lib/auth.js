// Runs in both the Edge middleware and Node API routes, so it only uses Web Crypto
// (globalThis.crypto.subtle), never Node's `crypto` module or Buffer.

export const SESSION_COOKIE = "rtr_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 180; // 180 days

function toHex(buf) {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// The session token is a hash of (SESSION_SECRET + APP_PASSWORD). Binding it to the
// password means changing APP_PASSWORD in Vercel instantly invalidates every existing
// session on every device, with no session store to manage.
export async function expectedSessionToken() {
  const secret = (process.env.SESSION_SECRET || "") + "::" + (process.env.APP_PASSWORD || "");
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(secret));
  return toHex(digest);
}

export async function isValidSession(cookieValue) {
  if (!cookieValue) return false;
  const expected = await expectedSessionToken();
  return cookieValue === expected;
}
