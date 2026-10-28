export const dynamic = "force-dynamic";
export async function GET() { return Response.json({ status: "ok", service: "lifiweb", release: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0,12) ?? "local", checks: { web: "ok", database: "not-checked" } }, { headers: { "Cache-Control": "no-store" } }); }
