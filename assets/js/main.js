/* ============================================================
   FixSnoring — main.js
   GSAP + ScrollTrigger + SplitText + Lenis.
   Every animation is a named function with its own tuning knobs,
   so individual pieces can be adjusted without touching the rest.
   ============================================================ */

gsap.registerPlugin(ScrollTrigger, SplitText);

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------- smooth scroll (Lenis driven by GSAP ticker) ---------- */
const lenis = new Lenis({ autoRaf: false });
lenis.on("scroll", ScrollTrigger.update);
gsap.ticker.add((time) => lenis.raf(time * 1000));
gsap.ticker.lagSmoothing(0);

/* ============================================================
   Static DOM builders
   ============================================================ */

/* night data viz: waveform bars (exact Figma heights).
   110 bars, 10px pitch, bottom-aligned on the 400px baseline. */
const WAVE_HEIGHTS = [
  31, 38, 44, 48, 49, 47, 42, 35, 26, 24, 30, 37, 42, 44, 43, 40, 34, 27, 37, 44,
  50, 53, 53, 49, 43, 36, 36, 43, 49, 52, 126, 119, 107, 90, 72, 85, 97, 104, 105, 100,
  96, 86, 73, 28, 37, 44, 49, 51, 49, 45, 39, 32, 40, 47, 52, 54, 52, 48, 41, 33,
  33, 39, 44, 46, 45, 41, 35, 26, 19, 29, 37, 43, 116, 117, 111, 101, 87, 91, 108, 122,
  129, 131, 126, 115, 100, 32, 39, 45, 49, 50, 48, 42, 35, 26, 26, 32, 36, 41, 43, 42,
  38, 32, 27, 36, 44, 50, 52, 52, 49, 43,
];
const WAVE_EVENT_RANGES = [[30, 42], [72, 84]];

function buildWaveform() {
  const host = document.getElementById("snore-waveform");
  if (!host) return;
  const frag = document.createDocumentFragment();
  WAVE_HEIGHTS.forEach((h, i) => {
    const bar = document.createElement("i");
    bar.className = "wave-bar";
    if (WAVE_EVENT_RANGES.some(([a, b]) => i >= a && i <= b)) bar.classList.add("is-event");
    bar.style.left = i * 10 + "px";
    bar.style.height = h + "px";
    frag.appendChild(bar);
  });
  host.appendChild(frag);
}

/* CTA buttons: wrap label for the slide-up swap + add the circle fill */
function buildButtons() {
  document.querySelectorAll(".btn").forEach((btn) => {
    const label = btn.querySelector(".btn-label");
    if (label && !btn.querySelector(".btn-label-wrap")) {
      const wrap = document.createElement("span");
      wrap.className = "btn-label-wrap";
      label.replaceWith(wrap);
      wrap.appendChild(label);
      const clone = label.cloneNode(true);
      clone.classList.add("btn-label-clone");
      clone.setAttribute("aria-hidden", "true");
      wrap.appendChild(clone);
    }
    if (!btn.querySelector(".btn-fill")) {
      const fill = document.createElement("span");
      fill.className = "btn-fill";
      fill.setAttribute("aria-hidden", "true");
      btn.prepend(fill);
    }
    const d = Math.max(btn.offsetWidth, btn.offsetHeight) * 2.4;
    btn.style.setProperty("--fill-d", d + "px");
  });
}

/* health benefits: build the expanding hover card for every tile.
   NOTE: per-benefit imagery + copy pending — sharp-memory image and the
   designed sentence are used as placeholders for all tiles for now. */
const BENEFIT_DESC =
  "Once you understand what’s happening in your sleep, the next step is choosing the treatment.";

function buildBenefitCards() {
  document.querySelectorAll(".benefit-tile").forEach((tile) => {
    const label = tile.querySelector(".benefit-label").textContent;
    const card = document.createElement("div");
    card.className = "benefit-card";
    card.setAttribute("aria-hidden", "true");
    card.innerHTML =
      '<div class="benefit-card-media"><img src="assets/img/benefit-sharp-memory.png" alt=""></div>' +
      '<span class="benefit-label">' + label + "</span>" +
      '<span class="benefit-card-desc">' + BENEFIT_DESC + "</span>";
    tile.appendChild(card);
  });
}

/* ============================================================
   Animations — one named function per behaviour
   ============================================================ */

/* backdrop arcs open from a single line (hero on load, sections on scroll) */
function animateArcOpen(el, trigger) {
  gsap.set(el, { scaleY: 0.015, opacity: 0, transformOrigin: "50% 50%" });
  const tween = {
    scaleY: 1,
    opacity: 1,
    duration: 1.8,
    ease: "power3.inOut",
  };
  if (trigger) {
    tween.scrollTrigger = { trigger, start: "top 85%", once: true };
    gsap.to(el, tween);
  } else {
    return gsap.to(el, tween); // hero: caller places it on the intro timeline
  }
}

/* split a heading into masked lines and wipe them up */
function wipeUpLines(el, opts = {}) {
  const split = SplitText.create(el, { type: "lines", mask: "lines", autoSplit: true });
  return gsap.from(split.lines, {
    yPercent: 110,
    duration: 0.9,
    stagger: 0.09,
    ease: "power3.out",
    ...opts,
  });
}

/* hero intro: arcs open + title wipes + the rest fades in */
function heroIntro() {
  const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
  tl.add(animateArcOpen(".hero-backdrop-arcs", null), 0);
  tl.add(wipeUpLines(".hero-title"), 0.35);
  tl.from(".hero-subtitle", { opacity: 0, y: 18, duration: 0.8 }, 0.7);
  tl.from(".hero-actions > *", { opacity: 0, y: 14, duration: 0.6, stagger: 0.07 }, 0.85);
  tl.from(".nav > *", { opacity: 0, y: -10, duration: 0.6, stagger: 0.08 }, 0.5);
  tl.from(".announcement-container > *", { opacity: 0, duration: 0.6 }, 0.6);
  return tl;
}

/* generic scroll-in treatments: headings wipe, captions fade */
function sectionTextReveals() {
  document.querySelectorAll("[data-wipe]").forEach((el) => {
    ScrollTrigger.create({
      trigger: el,
      start: "top 85%",
      once: true,
      onEnter: () => wipeUpLines(el),
    });
  });
  document.querySelectorAll("[data-fade]").forEach((el) => {
    gsap.from(el, {
      opacity: 0,
      y: 16,
      duration: 0.8,
      ease: "power2.out",
      scrollTrigger: { trigger: el, start: "top 88%", once: true },
    });
  });
}

/* stats: bars rise from below, one by one, right to left */
function statsBarsRise() {
  gsap.from(".stat-line-inner", {
    scaleY: 0,
    transformOrigin: "50% 100%",
    duration: 1.1,
    ease: "power3.out",
    stagger: { each: 0.14, from: "end" },
    scrollTrigger: { trigger: ".stats-columns", start: "top 75%", once: true },
  });
  gsap.from(".stats-col .stat-block", {
    opacity: 0,
    y: 14,
    duration: 0.7,
    ease: "power2.out",
    stagger: { each: 0.14, from: "end" },
    scrollTrigger: { trigger: ".stats-columns", start: "top 75%", once: true },
  });
}

/* symptoms cards entrance */
function symptomCardsIn() {
  gsap.from(".symptom-card-slot", {
    opacity: 0,
    y: 30,
    duration: 0.9,
    ease: "power3.out",
    stagger: 0.1,
    scrollTrigger: { trigger: ".symptoms-cards", start: "top 82%", once: true },
  });
}

/* night data viz: bars grow up quickly, chips pop in */
function nightVizIn() {
  gsap.from(".wave-bar", {
    scaleY: 0,
    transformOrigin: "50% 100%",
    duration: 0.5,
    ease: "power2.out",
    stagger: { each: 0.006, from: "start" },
    scrollTrigger: { trigger: ".night-data-viz", start: "top 80%", once: true },
  });
  gsap.from(".glass-stat-card, .event-chip, .chip-connector", {
    opacity: 0,
    y: 12,
    duration: 0.6,
    ease: "power2.out",
    stagger: 0.1,
    scrollTrigger: { trigger: ".night-data-viz", start: "top 70%", once: true },
  });
}

/* testimonials: cards drift at different speeds over the sticky title */
const TESTIMONIAL_SPEEDS = [40, 110, 60, 130]; // px of extra upward drift per card
function testimonialsParallax() {
  document.querySelectorAll(".testimonial-card").forEach((card, i) => {
    const drift = TESTIMONIAL_SPEEDS[i % TESTIMONIAL_SPEEDS.length];
    gsap.fromTo(card, { y: drift }, {
      y: -drift,
      ease: "none",
      scrollTrigger: {
        trigger: ".testimonials-grid",
        start: "top bottom",
        end: "bottom top",
        scrub: true,
      },
    });
  });
}

/* benefits: snappy expanding hover cards */
function benefitHovers() {
  document.querySelectorAll(".benefit-tile").forEach((tile) => {
    const card = tile.querySelector(".benefit-card");
    if (!card) return;
    gsap.set(card, { left: 0, top: "50%", yPercent: -50, scale: 0.6, opacity: 0, transformOrigin: "0% 50%" });
    const open = gsap.timeline({ paused: true })
      .to(card, { opacity: 1, scale: 1, duration: 0.28, ease: "power3.out" }, 0)
      .to(tile, { zIndex: 6, duration: 0 }, 0);
    tile.addEventListener("mouseenter", () => { tile.style.zIndex = 6; open.timeScale(1).play(); });
    tile.addEventListener("mouseleave", () => {
      open.timeScale(1.6).reverse();
      open.eventCallback("onReverseComplete", () => (tile.style.zIndex = ""));
    });
  });
}

/* faq: exclusive accordion, answers open smoothly, lines fade in */
function faqAccordion() {
  const items = document.querySelectorAll(".faq-item");
  items.forEach((item) => {
    const head = item.querySelector(".faq-item-head");
    const answer = item.querySelector(".faq-answer");
    const inner = item.querySelector(".faq-answer-inner");
    head.addEventListener("click", () => {
      const isOpen = item.classList.contains("is-open");
      // close everything else first
      items.forEach((other) => {
        if (other !== item && other.classList.contains("is-open")) {
          other.classList.remove("is-open");
          other.querySelector(".faq-item-head").setAttribute("aria-expanded", "false");
          gsap.to(other.querySelector(".faq-answer"), { height: 0, duration: 0.45, ease: "power3.inOut" });
        }
      });
      if (isOpen) {
        item.classList.remove("is-open");
        head.setAttribute("aria-expanded", "false");
        gsap.to(answer, { height: 0, duration: 0.45, ease: "power3.inOut" });
      } else {
        item.classList.add("is-open");
        head.setAttribute("aria-expanded", "true");
        gsap.to(answer, { height: "auto", duration: 0.55, ease: "power3.inOut" });
        if (!reducedMotion) {
          const split = SplitText.create(inner, { type: "lines" });
          gsap.from(split.lines, {
            opacity: 0,
            y: 10,
            duration: 0.5,
            stagger: 0.06,
            delay: 0.12,
            ease: "power2.out",
            onComplete: () => split.revert(),
          });
        }
      }
    });
  });
}

/* footer: quick staggered reveal — never make the user wait */
function footerReveal() {
  animateArcOpen(".footer-arcs", ".footer");
  gsap.from(".footer-container > *", {
    opacity: 0,
    y: 16,
    duration: 0.55,
    ease: "power2.out",
    stagger: 0.06,
    scrollTrigger: { trigger: ".footer", start: "top 80%", once: true },
  });
}

/* ============================================================
   Init
   ============================================================ */
buildWaveform();
buildButtons();
buildBenefitCards();

document.fonts.ready.then(() => {
  if (reducedMotion) {
    faqAccordion();
    return; // no motion beyond the accordion's accessibility behaviour
  }
  heroIntro();
  animateArcOpen(".symptoms-arcs", ".how-it-works-content");
  sectionTextReveals();
  statsBarsRise();
  symptomCardsIn();
  nightVizIn();
  testimonialsParallax();
  benefitHovers();
  faqAccordion();
  footerReveal();
  ScrollTrigger.refresh();
});
