const TOKEN_KEY = "dd-admin";
const loginForm = document.querySelector("#prijava");
const inbox = document.querySelector("#inbox");
const list = document.querySelector("#lista");
const empty = document.querySelector("#prazno");
const loginNote = loginForm.querySelector(".form__note");

function token() {
  return sessionStorage.getItem(TOKEN_KEY) || "";
}

function showLogin(message) {
  inbox.hidden = true;
  loginForm.hidden = false;
  loginNote.textContent = message || "";
  loginNote.className = message ? "form__note is-error" : "form__note";
}

function field(label, value) {
  const wrap = document.createElement("p");
  const name = document.createElement("span");
  name.textContent = label;
  wrap.append(name, document.createTextNode(value));
  return wrap;
}

function renderMessages(messages) {
  list.replaceChildren();
  empty.hidden = messages.length > 0;
  messages.forEach((message) => {
    const article = document.createElement("article");
    article.className = "admin-card";

    const title = document.createElement("h2");
    title.textContent = message.ime;

    const when = document.createElement("time");
    const date = new Date(message.createdAt);
    when.dateTime = message.createdAt;
    when.textContent = Number.isNaN(date.getTime())
      ? ""
      : date.toLocaleString("sr-BA", { dateStyle: "medium", timeStyle: "short" });

    const phone = document.createElement("p");
    const phoneLabel = document.createElement("span");
    phoneLabel.textContent = "Telefon";
    const phoneLink = document.createElement("a");
    phoneLink.href = `tel:${String(message.telefon).replace(/[^\d+]/g, "")}`;
    phoneLink.textContent = message.telefon;
    phone.append(phoneLabel, phoneLink);

    const text = document.createElement("p");
    text.className = "admin-card__text";
    text.textContent = message.poruka;

    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "admin-delete";
    remove.textContent = "Obriši";
    remove.addEventListener("click", () => removeMessage(message.id));

    article.append(title, when, phone, field("Usluga", message.usluga), text, remove);
    list.append(article);
  });
}

async function loadMessages() {
  const response = await fetch("/api/poruke", {
    headers: { Authorization: `Bearer ${token()}` },
  });
  if (response.status === 401) {
    sessionStorage.removeItem(TOKEN_KEY);
    showLogin("Prijavite se ponovo.");
    return;
  }
  if (!response.ok) throw new Error("load failed");
  const data = await response.json();
  loginForm.hidden = true;
  inbox.hidden = false;
  renderMessages(Array.isArray(data.poruke) ? data.poruke : []);
}

async function removeMessage(id) {
  const response = await fetch(`/api/poruke?id=${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token()}` },
  });
  if (!response.ok) return;
  await loadMessages();
}

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const submit = loginForm.querySelector('[type="submit"]');
  submit.disabled = true;
  loginNote.textContent = "";
  loginNote.className = "form__note";

  try {
    const response = await fetch("/api/prijava", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sifra: new FormData(loginForm).get("sifra") }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.token) {
      loginNote.textContent = data.error || "Prijava nije uspjela.";
      loginNote.classList.add("is-error");
      return;
    }
    sessionStorage.setItem(TOKEN_KEY, data.token);
    loginForm.reset();
    await loadMessages();
  } catch {
    loginNote.textContent = "Prijava nije uspjela. Pokušajte ponovo.";
    loginNote.classList.add("is-error");
  } finally {
    submit.disabled = false;
  }
});

document.querySelector("#odjava").addEventListener("click", () => {
  sessionStorage.removeItem(TOKEN_KEY);
  list.replaceChildren();
  showLogin("");
});

if (token()) {
  loadMessages().catch(() => showLogin("Poruke trenutno nisu dostupne."));
}
