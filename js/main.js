const header = document.querySelector(".site-header");
const toggle = document.querySelector(".nav-toggle");
const nav = document.querySelector(".nav");
const sections = [...document.querySelectorAll("main section[id]")];
const reveals = document.querySelectorAll(".reveal");

function closeMenu() {
  if (!nav || !toggle) return;
  nav.classList.remove("is-open");
  toggle.setAttribute("aria-expanded", "false");
  document.body.classList.remove("nav-open");
}

function openMenu() {
  nav.classList.add("is-open");
  toggle.setAttribute("aria-expanded", "true");
  document.body.classList.add("nav-open");
}

if (toggle && nav) {
  toggle.addEventListener("click", () => {
    const open = toggle.getAttribute("aria-expanded") === "true";
    if (open) closeMenu();
    else openMenu();
  });

  nav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", closeMenu);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeMenu();
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 900) closeMenu();
  });
}

function onScroll() {
  if (header) header.classList.toggle("is-scrolled", window.scrollY > 12);

  const marker = window.scrollY + (header ? header.offsetHeight : 0) + 80;
  let current = sections[0];
  sections.forEach((section) => {
    if (section.offsetTop <= marker) current = section;
  });
  if (!current) return;
  document.querySelectorAll(".nav a, .footer__links a").forEach((link) => {
    const active = link.getAttribute("href") === `#${current.id}`;
    if (active) link.setAttribute("aria-current", "true");
    else link.removeAttribute("aria-current");
  });
}

onScroll();
window.addEventListener("scroll", onScroll, { passive: true });

if ("IntersectionObserver" in window && reveals.length) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-in");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.16, rootMargin: "0px 0px -8% 0px" }
  );
  reveals.forEach((item) => observer.observe(item));
} else {
  reveals.forEach((item) => item.classList.add("is-in"));
}

const dialog = document.querySelector(".lightbox");
const lightboxImg = dialog ? dialog.querySelector("img") : null;
const lightboxCaption = dialog ? dialog.querySelector("figcaption") : null;
let activeItems = [];
let galleryIndex = 0;

function visibleItems(scope) {
  return [...scope.querySelectorAll(".gallery__item")].filter((item) => !item.closest(".is-hidden"));
}

function showGallery(index) {
  if (!dialog || !activeItems.length) return;
  galleryIndex = (index + activeItems.length) % activeItems.length;
  const item = activeItems[galleryIndex];
  const image = item.querySelector("img");
  lightboxImg.src = item.dataset.full || image.src;
  lightboxImg.alt = image.alt;
  lightboxCaption.textContent = item.dataset.caption || "";
  if (!dialog.open) dialog.showModal();
}

document.addEventListener("click", (event) => {
  const item = event.target.closest(".gallery__item");
  if (!item || item.closest(".is-hidden")) return;
  const scope = item.closest("[data-lightbox]") || document;
  activeItems = visibleItems(scope);
  const index = activeItems.indexOf(item);
  if (index >= 0) showGallery(index);
});

const filterBar = document.querySelector(".filters");

if (filterBar) {
  filterBar.addEventListener("click", (event) => {
    const button = event.target.closest("[data-filter]");
    if (!button) return;
    const filter = button.dataset.filter;

    filterBar.querySelectorAll("[data-filter]").forEach((item) => {
      const active = item === button;
      item.classList.toggle("is-active", active);
      item.setAttribute("aria-pressed", active ? "true" : "false");
    });

    document.querySelectorAll(".project__block").forEach((block) => {
      const cats = (block.dataset.cat || "").split(/\s+/);
      block.classList.toggle("is-hidden", filter !== "sve" && !cats.includes(filter));
    });

    document.querySelectorAll(".project").forEach((project) => {
      project.classList.toggle("is-hidden", !project.querySelector(".project__block:not(.is-hidden)"));
    });
  });
}

if (dialog) {
  dialog.querySelector(".lightbox__close").addEventListener("click", () => dialog.close());
  dialog.querySelector(".lightbox__nav--prev").addEventListener("click", () => showGallery(galleryIndex - 1));
  dialog.querySelector(".lightbox__nav--next").addEventListener("click", () => showGallery(galleryIndex + 1));

  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();
  });

  dialog.addEventListener("close", () => {
    lightboxImg.src = "";
  });

  document.addEventListener("keydown", (event) => {
    if (!dialog.open) return;
    if (event.key === "ArrowRight") showGallery(galleryIndex + 1);
    if (event.key === "ArrowLeft") showGallery(galleryIndex - 1);
  });
}

const form = document.querySelector(".form");

if (form) {
  const note = form.querySelector(".form__note");
  const submit = form.querySelector('[type="submit"]');

  form.querySelectorAll("input, select, textarea").forEach((field) => {
    field.addEventListener("invalid", () => {
      if (field.validity.valueMissing) field.setCustomValidity("Popunite ovo polje.");
      else if (field.validity.typeMismatch) field.setCustomValidity("Provjerite uneseni podatak.");
      else field.setCustomValidity("");
    });
    field.addEventListener("input", () => field.setCustomValidity(""));
    field.addEventListener("change", () => field.setCustomValidity(""));
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    submit.disabled = true;
    const previous = submit.textContent;
    submit.textContent = "Šalje se...";
    note.textContent = "";
    note.className = "form__note";

    try {
      const body = new URLSearchParams(new FormData(form));
      const response = await fetch("/", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: body.toString(),
      });

      if (!response.ok) throw new Error("request failed");

      form.reset();
      note.textContent = "Hvala. Vaš upit je poslat. Javićemo vam se uskoro.";
      note.classList.add("is-ok");
    } catch (error) {
      note.textContent = "Poruka nije poslata. Pozovite nas na 066 281-073 ili pokušajte ponovo.";
      note.classList.add("is-error");
    } finally {
      submit.disabled = false;
      submit.textContent = previous;
    }
  });
}
