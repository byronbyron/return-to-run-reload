import { NextResponse } from "next/server";

const API = process.env.GITHUB_API_BASE || "https://api.github.com";
const PLAN_FILE = "plan-data.json";
const PROG_FILE = "progress.json";

function ghHeaders() {
  return {
    Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
}
function contentsUrl(file) {
  const repo = process.env.DATA_REPO; // "owner/name"
  return `${API}/repos/${repo}/contents/${file}`;
}
function b64decode(b64) {
  return Buffer.from((b64 || "").replace(/\n/g, ""), "base64").toString("utf8");
}
function b64encode(str) {
  return Buffer.from(str, "utf8").toString("base64");
}

async function getFile(file) {
  const r = await fetch(contentsUrl(file), { headers: ghHeaders(), cache: "no-store" });
  if (r.status === 404) return null;
  if (r.status === 401) throw new Error("GitHub rejected the server token (401). Check GITHUB_TOKEN in Vercel.");
  if (r.status === 403) throw new Error("Server token can't read the data repo's contents (403).");
  if (!r.ok) throw new Error(`GitHub error ${r.status} reading ${file}.`);
  const j = await r.json();
  return { text: b64decode(j.content), sha: j.sha };
}

async function putFile(file, text, sha, message) {
  const body = { message: message || `update ${file}`, content: b64encode(text) };
  if (sha) body.sha = sha;
  const r = await fetch(contentsUrl(file), {
    method: "PUT",
    headers: ghHeaders(),
    body: JSON.stringify(body),
  });
  if (!r.ok) {
    const detail = await r.text().catch(() => "");
    throw new Error(`GitHub error ${r.status} writing ${file}. ${detail}`.trim());
  }
  const j = await r.json();
  return j.content.sha;
}

function envCheck() {
  const missing = ["GITHUB_TOKEN", "DATA_REPO"].filter((k) => !process.env[k]);
  if (missing.length) throw new Error(`Missing env var(s) on the server: ${missing.join(", ")}.`);
}

export async function GET() {
  try {
    envCheck();
    const planFile = await getFile(PLAN_FILE);
    if (!planFile) {
      return NextResponse.json(
        { error: `No ${PLAN_FILE} found in the data repo yet. Commit your plan-data.json there first.` },
        { status: 404 }
      );
    }
    const progFile = await getFile(PROG_FILE);
    return NextResponse.json({
      plan: JSON.parse(planFile.text),
      progress: progFile ? JSON.parse(progFile.text || "{}") : {},
    });
  } catch (e) {
    return NextResponse.json({ error: String(e.message || e) }, { status: 500 });
  }
}

export async function PUT(req) {
  try {
    envCheck();
    const { progress } = await req.json();
    const existing = await getFile(PROG_FILE);
    const sha = await putFile(PROG_FILE, JSON.stringify(progress ?? {}), existing?.sha, "log progress");
    return NextResponse.json({ ok: true, sha });
  } catch (e) {
    return NextResponse.json({ error: String(e.message || e) }, { status: 500 });
  }
}
