import { adminPassword, issueToken, passwordsMatch } from "../lib/auth.mjs";

function json(status, data) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

export default async (request) => {
  if (request.method !== "POST") return json(405, { error: "Metoda nije dozvoljena." });
  if (!adminPassword()) return json(503, { error: "Prijava trenutno nije podešena." });

  try {
    const body = await request.json();
    if (!passwordsMatch(String(body.sifra || ""))) return json(401, { error: "Pogrešna šifra." });
    return json(200, { token: issueToken() });
  } catch {
    return json(400, { error: "Prijava nije uspjela." });
  }
};
