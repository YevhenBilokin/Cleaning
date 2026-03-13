// ---------- Helpers ----------
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

function formatDKK(amount) {
  // Round to nearest 5 kr for nicer look
  const rounded = Math.round(amount / 5) * 5;
  return new Intl.NumberFormat("da-DK").format(rounded) + " kr";
}

// ---------- Mobile menu ----------
(() => {
  const burger = $("#burger");
  const menu = $("#mobileMenu");
  if (!burger || !menu) return;

  burger.addEventListener("click", () => {
    const open = menu.classList.toggle("open");
    burger.setAttribute("aria-expanded", String(open));
  });

  $$("a", menu).forEach((a) => {
    a.addEventListener("click", () => {
      menu.classList.remove("open");
      burger.setAttribute("aria-expanded", "false");
    });
  });
})();

// ---------- Smooth scroll for anchors on same page ----------
(() => {
  $$('a[href^="#"]').forEach((a) => {
    a.addEventListener("click", (e) => {
      const href = a.getAttribute("href");
      if (!href || href === "#") return;

      const el = document.querySelector(href);
      if (!el) return;

      e.preventDefault();
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });
})();

// ---------- Reveal on scroll ----------
(() => {
  const revealEls = $$(".reveal");
  if (!revealEls.length) return;

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) entry.target.classList.add("in");
      });
    },
    { threshold: 0.12 }
  );

  revealEls.forEach((el) => io.observe(el));
})();

// ---------- Footer year ----------
(() => {
  const year = $("#year");
  if (year) year.textContent = String(new Date().getFullYear());
})();

// ---------- Calculator logic (improved UI + small animations) ----------
(() => {
  const root = document.getElementById("calcNew");
  if (!root) return; // only on index

  const panes = Array.from(root.querySelectorAll(".calcPane"));
  const dots = Array.from(root.querySelectorAll(".stepDot"));
  const resultWrap = document.getElementById("calcResult");

  const sqm = document.getElementById("sqm");
  const sqmLabel = document.getElementById("sqmLabel");

  const clientType = document.getElementById("clientType");

  const serviceCards = Array.from(root.querySelectorAll(".optCard"));
  let selectedService = "flyt";

  const calcBtn = document.getElementById("calcBtn");
  const resetBtn = document.getElementById("resetBtn");

  const name = document.getElementById("name");
  const phone = document.getElementById("phone");
  const email = document.getElementById("email");

  // Result fields
  const resultPrice = document.getElementById("resultPrice");
  const resultMeta = document.getElementById("resultMeta");
  const rService = document.getElementById("rService");
  const rClient = document.getElementById("rClient");
  const rSqm = document.getElementById("rSqm");

  // ---- utils
  function formatDKK(amount) {
    const rounded = Math.round(amount / 5) * 5;
    return new Intl.NumberFormat("da-DK").format(rounded) + " kr";
  }

  const serviceLabel = (v) => {
    if (v === "flyt") return "Flytterengøring";
    if (v === "erhverv") return "Erhvervsrengøring (B2B)";
    return "Privat rengøring";
  };
  const clientLabel = (v) => (v === "business" ? "Business" : "Privat");

  function estimatePrice({ service, clientType, sqm }) {
    const rates = { flyt: 28, erhverv: 18, privat: 14 };
    const mins = { flyt: 3500, erhverv: 1500, privat: 900 };

    let base = sqm * (rates[service] ?? 20);
    if (clientType === "business") base *= 1.08;
    if (service === "flyt" && sqm > 220) base *= 0.95;
    if (service === "privat" && sqm < 60) base *= 1.12;

    return Math.max(base, mins[service] ?? 1000);
  }

  function setActivePane(step) {
    panes.forEach((p) => p.classList.remove("active"));
    const pane = root.querySelector(`.calcPane[data-pane="${step}"]`);
    if (pane) pane.classList.add("active");

    // dots states
    dots.forEach((d) => {
      const n = Number(d.dataset.dot);
      d.classList.remove("active", "done");
      if (n < step) d.classList.add("done");
      if (n === step) d.classList.add("active");
    });

    // hide result while stepping
    if (resultWrap) resultWrap.classList.remove("show");
  }

  // ---- init slider label
  if (sqmLabel && sqm) sqmLabel.textContent = sqm.value;
  sqm?.addEventListener("input", () => {
    sqmLabel.textContent = sqm.value;
  });

  // ---- service cards
  serviceCards.forEach((card) => {
    card.addEventListener("click", () => {
      serviceCards.forEach((c) => c.classList.remove("selected"));
      card.classList.add("selected");
      selectedService = card.dataset.service || "flyt";

      // tiny tap animation
      card.animate(
        [{ transform: "translateY(0)" }, { transform: "translateY(-3px)" }, { transform: "translateY(0)" }],
        { duration: 180, easing: "ease-out" }
      );
    });
  });

  // ---- client pills
  const clientPills = Array.from(root.querySelectorAll("#clientPills .pill"));
  clientPills.forEach((btn) => {
    btn.addEventListener("click", () => {
      clientPills.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      clientType.value = btn.dataset.client || "privat";
    });
  });

  // ---- nav next/back buttons (data-next / data-back)
  root.querySelectorAll("[data-next]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const active = root.querySelector(".calcPane.active");
      const current = Number(active?.dataset.pane || "1");
      const next = Math.min(3, current + 1);
      setActivePane(next);

      if (next === 3) name?.focus();
    });
  });

  root.querySelectorAll("[data-back]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const active = root.querySelector(".calcPane.active");
      const current = Number(active?.dataset.pane || "1");
      const prev = Math.max(1, current - 1);
      setActivePane(prev);
    });
  });

  // ---- calculate
  calcBtn?.addEventListener("click", () => {
    const nm = (name?.value || "").trim();
    const ph = (phone?.value || "").trim();
    const em = (email?.value || "").trim();

    if (!nm || !ph || !em) {
      alert("Udfyld venligst navn, telefon og email.");
      return;
    }

    const input = {
      service: selectedService,
      clientType: clientType?.value || "privat",
      sqm: Number(sqm?.value || 0),
    };

    const price = estimatePrice(input);

    rService.textContent = serviceLabel(input.service);
    rClient.textContent = clientLabel(input.clientType);
    rSqm.textContent = `${input.sqm} m²`;

    resultPrice.textContent = formatDKK(price);
    resultMeta.textContent = `Hej ${nm} — dette er et vejledende estimat. Vi bekræfter altid endelig pris før opstart.`;

    // Show result
    if (resultWrap) {
      resultWrap.classList.add("show");
      resultWrap.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }

    // small emphasis animation
    resultPrice.animate(
      [{ transform: "scale(1)" }, { transform: "scale(1.03)" }, { transform: "scale(1)" }],
      { duration: 220, easing: "ease-out" }
    );

    console.log("Calculator lead:", { name: nm, phone: ph, email: em, ...input, price });
  });

  resetBtn?.addEventListener("click", () => {
    // reset inputs
    if (name) name.value = "";
    if (phone) phone.value = "";
    if (email) email.value = "";

    setActivePane(1);
    root.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  // default
  setActivePane(1);
})();

// ---------- Contact form (demo) ----------
(() => {
  const form = $("#contactForm");
  if (!form) return;

  const status = $("#formStatus");
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (status) status.textContent = "Tak! Din besked er sendt (demo).";
    form.reset();
  });
})();

// ---------- FAQ accordion + FAQPage schema ----------
(() => {
  const faqItems = Array.from(document.querySelectorAll("[data-faq]"));
  if (!faqItems.length) return;

  // Accordion behavior
  faqItems.forEach((item) => {
    const btn = item.querySelector(".faqQ");
    if (!btn) return;

    btn.addEventListener("click", () => {
      const isOpen = item.classList.toggle("open");
      btn.setAttribute("aria-expanded", String(isOpen));
    });
  });

  // Build FAQPage JSON-LD schema (SEO)
  // Takes only questions/answers from the page content.
  const entities = faqItems.map((item) => {
    const q = item.querySelector(".faqQ")?.childNodes?.[0]?.textContent?.trim() || "";
    const a = item.querySelector(".faqA")?.textContent?.trim() || "";
    return {
      "@type": "Question",
      "name": q,
      "acceptedAnswer": { "@type": "Answer", "text": a }
    };
  }).filter(x => x.name && x.acceptedAnswer.text);

  if (!entities.length) return;

  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": entities
  };

  const script = document.createElement("script");
  script.type = "application/ld+json";
  script.textContent = JSON.stringify(schema);
  document.head.appendChild(script);
})();