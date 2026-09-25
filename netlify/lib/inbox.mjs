import { getStore } from "@netlify/blobs";
import crypto from "node:crypto";

const LIMITS = {
  "Ime i prezime": 120,
  Telefon: 40,
  Usluga: 80,
  Poruka: 4000,
};

function clip(value, max) {
  return String(value || "").replace(/\s+/g, " ").trim().slice(0, max);
}

export function messageFromBody(body) {
  if (body && String(body["bot-field"] || "").trim()) return { ignored: true };

  const ime = clip(body?.["Ime i prezime"], LIMITS["Ime i prezime"]);
  const telefon = clip(body?.Telefon, LIMITS.Telefon);
  const usluga = clip(body?.Usluga, LIMITS.Usluga);
  const poruka = String(body?.Poruka || "").trim().slice(0, LIMITS.Poruka);

  if (!ime || !telefon || !usluga || !poruka) {
    return { error: "Popunite ime, telefon, uslugu i poruku." };
  }

  return {
    message: {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      ime,
      telefon,
      usluga,
      poruka,
    },
  };
}

function store() {
  return getStore({ name: "poruke", consistency: "strong" });
}

export async function saveMessage(message) {
  await store().setJSON(message.id, message);
  return message;
}

export async function listMessages() {
  const inbox = store();
  const { blobs } = await inbox.list();
  const messages = [];
  for (const blob of blobs) {
    const value = await inbox.get(blob.key, { type: "json" });
    if (value) messages.push(value);
  }
  messages.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
  return messages;
}

export async function deleteMessage(id) {
  if (!id) return false;
  await store().delete(id);
  return true;
}
