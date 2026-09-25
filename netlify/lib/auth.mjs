import crypto from "node:crypto";

const TWELVE_HOURS = 12 * 60 * 60 * 1000;

export function adminPassword() {
  return process.env.ADMIN_PASSWORD || "";
}

export function passwordsMatch(input) {
  const expected = adminPassword();
  if (!expected || typeof input !== "string") return false;
  const left = Buffer.from(input);
  const right = Buffer.from(expected);
  if (left.length !== right.length) return false;
  return crypto.timingSafeEqual(left, right);
}

export function issueToken() {
  const body = Buffer.from(JSON.stringify({ exp: Date.now() + TWELVE_HOURS })).toString("base64url");
  const sig = crypto.createHmac("sha256", adminPassword()).update(body).digest("base64url");
  return `${body}.${sig}`;
}

export function tokenIsValid(token) {
  if (!adminPassword() || typeof token !== "string") return false;
  const [body, sig] = token.split(".");
  if (!body || !sig) return false;
  const expected = crypto.createHmac("sha256", adminPassword()).update(body).digest("base64url");
  const left = Buffer.from(sig);
  const right = Buffer.from(expected);
  if (left.length !== right.length || !crypto.timingSafeEqual(left, right)) return false;
  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
    return typeof payload.exp === "number" && payload.exp > Date.now();
  } catch {
    return false;
  }
}

export function bearerToken(request) {
  const header = request.headers.get("authorization") || "";
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match ? match[1] : "";
}
