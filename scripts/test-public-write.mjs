const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? "AIzaSyBLGMtJ6QJSNwakmD_PdgtstARICyu1sEI";
const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "lifiwebapp";
const artifactId = process.env.NEXT_PUBLIC_FIREBASE_ARTIFACT_ID ?? "lifi-2026-prod";
const documentUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/artifacts/${artifactId}/public/data/qaChecks/codex-security-probe`;
const body = JSON.stringify({ fields: { purpose: { stringValue: "temporary-public-write-security-probe" }, createdAt: { timestampValue: new Date().toISOString() } } });

async function anonymousToken() {
  const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${apiKey}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ returnSecureToken: true }),
  });
  if (!response.ok) return null;
  return (await response.json()).idToken;
}

async function probe(label, token) {
  const headers = { "content-type": "application/json", ...(token ? { authorization: `Bearer ${token}` } : {}) };
  const response = await fetch(documentUrl, { method: "PATCH", headers, body });
  const writeAllowed = response.ok;
  let cleanup = "not-needed";
  if (writeAllowed) {
    const deletion = await fetch(documentUrl, { method: "DELETE", headers: token ? { authorization: `Bearer ${token}` } : {} });
    cleanup = deletion.ok || deletion.status === 404 ? "removed" : `failed-${deletion.status}`;
  }
  return { label, writeAllowed, status: response.status, cleanup };
}

const token = await anonymousToken();
const results = [await probe("unauthenticated", null)];
if (token) results.push(await probe("anonymous-auth", token));
console.log(JSON.stringify(results, null, 2));
if (results.some((result) => result.cleanup.startsWith("failed"))) process.exitCode = 2;
