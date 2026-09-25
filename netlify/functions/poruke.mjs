import { bearerToken, tokenIsValid } from "../lib/auth.mjs";
import { deleteMessage, listMessages, messageFromBody, saveMessage } from "../lib/inbox.mjs";

function json(status, data) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

async function readBody(request) {
  const type = request.headers.get("content-type") || "";
  if (type.includes("application/json")) return request.json();
  const text = await request.text();
  return Object.fromEntries(new URLSearchParams(text));
}

export default async (request) => {
  try {
    if (request.method === "GET") {
      if (!tokenIsValid(bearerToken(request))) return json(401, { error: "Prijavite se ponovo." });
      return json(200, { poruke: await listMessages() });
    }

    if (request.method === "DELETE") {
      if (!tokenIsValid(bearerToken(request))) return json(401, { error: "Prijavite se ponovo." });
      const id = new URL(request.url).searchParams.get("id");
      await deleteMessage(id);
      return json(200, { ok: true });
    }

    if (request.method !== "POST") return json(405, { error: "Metoda nije dozvoljena." });

    const parsed = messageFromBody(await readBody(request));
    if (parsed.ignored) return json(200, { ok: true });
    if (parsed.error) return json(400, { error: parsed.error });
    await saveMessage(parsed.message);
    return json(200, { ok: true });
  } catch (error) {
    console.error(error);
    return json(500, { error: "Poruka trenutno ne može da se sačuva." });
  }
};
