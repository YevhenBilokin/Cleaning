const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

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

(() => {
  $$("a[href^='#']").forEach((a) => {
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

(() => {
  const revealEls = $$(".reveal");
  if (!revealEls.length) return;

  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) entry.target.classList.add("in");
    });
  }, { threshold: 0.12 });

  revealEls.forEach((el) => io.observe(el));
})();

(() => {
  const y = $("#year");
  if (y) y.textContent = String(new Date().getFullYear());
})();


// FAQ accordion + schema
(() => {
  const faqItems = Array.from(document.querySelectorAll("[data-faq]"));
  if (!faqItems.length) return;

  faqItems.forEach((item) => {
    const btn = item.querySelector(".faqQ");
    if (!btn) return;
    btn.addEventListener("click", () => {
      const isOpen = item.classList.toggle("open");
      btn.setAttribute("aria-expanded", String(isOpen));
    });
  });

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

// Calculator
(() => {
  const root = document.getElementById("calcNew");
  if (!root) return;

  const panes = Array.from(root.querySelectorAll(".calcPane"));
  const dots = Array.from(root.querySelectorAll(".stepDot"));
  const resultWrap = document.getElementById("calcResult");

  const sqm = document.getElementById("sqm");
  const sqmLabel = document.getElementById("sqmLabel");
  const clientType = document.getElementById("clientType");
  const clientPillsWrap = document.getElementById("clientPills");
  const clientFieldWrap = document.getElementById("clientFieldWrap");
  const step2Text = document.getElementById("step2Text");

  const serviceCards = Array.from(root.querySelectorAll(".optCard"));
  let selectedService = "flyt";

  const calcBtn = document.getElementById("calcBtn");
  const resetBtn = document.getElementById("resetBtn");

  const name = document.getElementById("name");
  const phone = document.getElementById("phone");
  const email = document.getElementById("email");

  const resultPrice = document.getElementById("resultPrice");
  const resultMeta = document.getElementById("resultMeta");
  const rService = document.getElementById("rService");
  const rClient = document.getElementById("rClient");
  const rSqm = document.getElementById("rSqm");

  function formatDKK(amount) {
    const rounded = Math.round(amount / 5) * 5;
    return new Intl.NumberFormat("da-DK").format(rounded) + " kr";
  }

  const serviceLabel = (v) => {
    if (v === "flyt") return "Flytterengøring";
    if (v === "erhverv") return "Erhvervsrengøring";
    return "Privat rengøring";
  };

  const typeLabel = (service, client) => {
    if (service === "erhverv") return "Business";
    return "Privat";
  };

  function estimatePrice({ service, sqm }) {
    const rates = {
      flyt: 28,
      erhverv: 18,
      privat: 14
    };

    const mins = {
      flyt: 3500,
      erhverv: 1500,
      privat: 900
    };

    let base = sqm * (rates[service] ?? 20);

    if (service === "flyt" && sqm > 220) base *= 0.95;
    if (service === "privat" && sqm < 60) base *= 1.12;

    return Math.max(base, mins[service] ?? 1000);
  }

  function setActivePane(step) {
    panes.forEach((p) => p.classList.remove("active"));
    const pane = root.querySelector(`.calcPane[data-pane="${step}"]`);
    if (pane) pane.classList.add("active");

    dots.forEach((d) => {
      const n = Number(d.dataset.dot);
      d.classList.remove("active", "done");
      if (n < step) d.classList.add("done");
      if (n === step) d.classList.add("active");
    });

    if (resultWrap) resultWrap.classList.remove("show");
  }

  function renderClientOptions(service) {
    if (!clientPillsWrap || !clientType || !clientFieldWrap || !step2Text) return;

    let options = [];

    if (service === "erhverv") {
      options = [{ value: "business", label: "Business" }];
      clientType.value = "business";
      step2Text.textContent = "Erhvervsrengøring er kun relevant for virksomheder. Justér arealet nedenfor.";
    } else {
      options = [{ value: "privat", label: "Privat" }];
      clientType.value = "privat";
      step2Text.textContent = "Vælg relevant areal for opgaven.";
    }

    clientPillsWrap.innerHTML = options.map((opt) => `
      <button type="button" class="pill active" data-client="${opt.value}">${opt.label}</button>
    `).join("");

    const pills = Array.from(clientPillsWrap.querySelectorAll(".pill"));
    pills.forEach((btn) => {
      btn.addEventListener("click", () => {
        pills.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        clientType.value = btn.dataset.client || "privat";
      });
    });
  }

  if (sqmLabel && sqm) sqmLabel.textContent = sqm.value;
  sqm?.addEventListener("input", () => {
    sqmLabel.textContent = sqm.value;
  });

  serviceCards.forEach((card) => {
    card.addEventListener("click", () => {
      serviceCards.forEach((c) => c.classList.remove("selected"));
      card.classList.add("selected");
      selectedService = card.dataset.service || "flyt";
      renderClientOptions(selectedService);

      card.animate(
        [{ transform: "translateY(0)" }, { transform: "translateY(-3px)" }, { transform: "translateY(0)" }],
        { duration: 180, easing: "ease-out" }
      );
    });
  });

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
    rClient.textContent = typeLabel(input.service, input.clientType);
    rSqm.textContent = `${input.sqm} m²`;

    resultPrice.textContent = formatDKK(price);
    resultMeta.textContent = `Hej ${nm} — dette er et vejledende estimat. Vi bekræfter altid den endelige pris før opstart.`;

    if (resultWrap) {
      resultWrap.classList.add("show");
      resultWrap.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }

    resultPrice.animate(
      [{ transform: "scale(1)" }, { transform: "scale(1.03)" }, { transform: "scale(1)" }],
      { duration: 220, easing: "ease-out" }
    );

    console.log("Calculator lead:", { name: nm, phone: ph, email: em, ...input, price });
  });

  resetBtn?.addEventListener("click", () => {
    if (name) name.value = "";
    if (phone) phone.value = "";
    if (email) email.value = "";
    selectedService = "flyt";
    serviceCards.forEach((c) => c.classList.remove("selected"));
    serviceCards[0]?.classList.add("selected");
    renderClientOptions(selectedService);
    setActivePane(1);
    root.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  renderClientOptions(selectedService);
  setActivePane(1);
})();
(() => {
  const form = document.getElementById("contactForm");
  const success = document.getElementById("formSuccess");
  const sendAnotherBtn = document.getElementById("sendAnotherBtn");

  if (!form || !success) return;

  const encode = (formData) => {
    return new URLSearchParams(formData).toString();
  };

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const formData = new FormData(form);
    const name = formData.get("name");
    const email = formData.get("email");

    try {
      const formResponse = await fetch("/", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: encode(formData),
      });

      if (!formResponse.ok) {
        throw new Error("Form submit failed");
      }

      try {
        await fetch("/.netlify/functions/autoreply", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ name, email }),
        });
      } catch (err) {
        console.error("Autoresponse failed:", err);
      }

      form.classList.add("hidden");
      success.classList.remove("hidden");
      success.scrollIntoView({ behavior: "smooth", block: "center" });
      form.reset();
    } catch (error) {
      alert("Der opstod en fejl. Prøv igen.");
    }
  });

  sendAnotherBtn?.addEventListener("click", () => {
    success.classList.add("hidden");
    form.classList.remove("hidden");
  });
})();