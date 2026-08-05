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

/* health benefits: expanding hover card, built as two halves that unfold
   from the middle crease like folded cardboard.
   NOTE: per-benefit imagery + copy pending — sharp-memory image and the
   designed sentence are shared by all tiles for now (Ergun 2026-08-06). */
const BENEFIT_IMG = "assets/img/benefit-sharp-memory.png";
const BENEFIT_DESC =
  "Once you understand what’s happening in your sleep, the next step is choosing the treatment.";

function buildBenefitCards() {
  document.querySelectorAll(".benefit-tile").forEach((tile) => {
    const label = tile.querySelector(".benefit-label").textContent;
    const card = document.createElement("div");
    card.className = "benefit-card";
    card.setAttribute("aria-hidden", "true");
    card.innerHTML =
      '<div class="benefit-card-half benefit-card-upper" style="background-image:url(' + BENEFIT_IMG + ')">' +
      '<span class="benefit-label">' + label + "</span></div>" +
      '<div class="benefit-card-half benefit-card-lower" style="background-image:url(' + BENEFIT_IMG + ')">' +
      '<span class="benefit-card-desc">' + BENEFIT_DESC + "</span></div>";
    tile.appendChild(card);
  });
}

/* stats: wrap the leading number of each value so it can count up */
function buildStatCounters() {
  document.querySelectorAll(".stat-value").forEach((el) => {
    const m = el.textContent.match(/^(\d+)(.*)$/);
    if (!m) return;
    el.innerHTML = '<span class="stat-num" data-target="' + m[1] + '">' + m[1] + "</span>" + m[2];
  });
}

/* ============================================================
   Backdrop arcs — light beams opening from a squished line
   Each colored vector animates individually: the main + mid beams
   start as a line on the section boundary and open; the small light
   vectors stay hidden, then reveal and find their place.
   ============================================================ */
const ARC_ORIGIN = "922.105 578.655"; // the beams' shared midline in svg coords

function arcTimeline(svgSel) {
  const svg = document.querySelector(svgSel);
  if (!svg) return null;
  const main = svg.querySelector(".arc-beam-main");
  const mid = svg.querySelector(".arc-beam-mid");
  const accents = svg.querySelectorAll(".arc-accent");
  gsap.set([main, mid], { svgOrigin: ARC_ORIGIN, scaleY: 0.012 });
  if (accents.length) gsap.set(accents, { svgOrigin: ARC_ORIGIN, scaleY: 0.08, autoAlpha: 0 });
  gsap.set(svg, { visibility: "visible" }); // squished state ready — safe to show
  const tl = gsap.timeline({ paused: true, defaults: { ease: "power2.inOut" } });
  tl.to(main, { scaleY: 1, duration: 2.4 }, 0)
    .to(mid, { scaleY: 1, duration: 2.4 }, 0.2);
  if (accents.length) {
    tl.to(accents, { scaleY: 1, autoAlpha: 1, duration: 1.8, ease: "power3.out", stagger: 0.18 }, 1.15);
  }
  return tl;
}

function scrollArc(svgSel, clipSel) {
  const tl = arcTimeline(svgSel);
  if (!tl) return;
  ScrollTrigger.create({
    trigger: clipSel,
    start: "top 88%",
    once: true,
    onEnter: () => tl.play(),
  });
}

/* ============================================================
   Reveal system — everything is pre-hidden at init, plays on enter
   ============================================================ */
const wipeTargets = [];

function prepReveals() {
  document.querySelectorAll("[data-wipe]").forEach((el) => {
    const split = SplitText.create(el, { type: "lines", mask: "lines", autoSplit: true });
    gsap.set(split.lines, { yPercent: 110 });
    wipeTargets.push({ el, split });
    ScrollTrigger.create({
      trigger: el,
      start: "top 92%",
      once: true,
      onEnter: () =>
        gsap.to(split.lines, { yPercent: 0, duration: 0.9, stagger: 0.09, ease: "power3.out" }),
    });
  });
  document.querySelectorAll("[data-fade]").forEach((el) => {
    gsap.set(el, { autoAlpha: 0, y: 16 });
    ScrollTrigger.create({
      trigger: el,
      start: "top 94%",
      once: true,
      onEnter: () => gsap.to(el, { autoAlpha: 1, y: 0, duration: 0.8, ease: "power2.out" }),
    });
  });
}

/* hero intro: beams open from the line + title wipes + the rest fades in */
function heroIntro() {
  const arcs = arcTimeline(".hero-arcs-svg");
  const split = SplitText.create(".hero-title", { type: "lines", mask: "lines", autoSplit: true });
  gsap.set(split.lines, { yPercent: 110 });
  const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
  if (arcs) tl.add(arcs.play(), 0);
  tl.to(split.lines, { yPercent: 0, duration: 0.9, stagger: 0.09 }, 0.35);
  tl.from(".hero-subtitle", { autoAlpha: 0, y: 18, duration: 0.8 }, 0.7);
  tl.from(".hero-actions > *", { autoAlpha: 0, y: 14, duration: 0.6, stagger: 0.07 }, 0.85);
  tl.from(".nav > *", { autoAlpha: 0, y: -10, duration: 0.6, stagger: 0.08 }, 0.5);
  tl.from(".announcement-container > *", { autoAlpha: 0, duration: 0.6 }, 0.6);
  return tl;
}

/* stats: slow right-to-left build. Bars start at the corner-curve height (so
   the curves never float over nothing), text blocks RIDE the bar tops instead
   of fading, and the orange numbers count up — all on the same spring. */
function statsSequence() {
  const cols = gsap.utils.toArray(".stats-col").reverse(); // right to left
  const MIN_H = 56; // corner curve (50px) + 6
  cols.forEach((col) => {
    const bar = col.querySelector(".stat-line-inner");
    const s0 = Math.min(MIN_H / bar.offsetHeight, 1);
    gsap.set(bar, { scaleY: s0, transformOrigin: "50% 100%" });
    gsap.set(col.querySelector(".stat-block"), { y: bar.offsetHeight * (1 - s0) });
  });
  const tl = gsap.timeline({
    scrollTrigger: { trigger: ".stats-columns", start: "top 88%", once: true },
  });
  cols.forEach((col, i) => {
    const bar = col.querySelector(".stat-line-inner");
    const block = col.querySelector(".stat-block");
    const num = col.querySelector(".stat-num");
    const at = i * 0.32; // tighter stagger so fast scrollers aren't left waiting
    tl.to(bar, { scaleY: 1, duration: 1.9, ease: "back.out(1.15)" }, at);   // springy settle
    tl.to(block, { y: 0, duration: 1.9, ease: "back.out(1.15)" }, at);      // rides the bar top
    if (num) {
      tl.fromTo(num, { innerText: 0 },
        { innerText: +num.dataset.target, duration: 1.9, snap: { innerText: 1 }, ease: "power2.out" }, at);
    }
  });
}

/* symptoms cards entrance */
function symptomCardsIn() {
  const slots = gsap.utils.toArray(".symptom-card-slot");
  gsap.set(slots, { autoAlpha: 0, y: 30 });
  ScrollTrigger.create({
    trigger: ".symptoms-cards",
    start: "top 88%",
    once: true,
    onEnter: () => gsap.to(slots, { autoAlpha: 1, y: 0, duration: 0.9, ease: "power3.out", stagger: 0.1 }),
  });
}

/* night data viz: bars grow up quickly, chips pop in */
function nightVizIn() {
  const bars = () => gsap.utils.toArray(".wave-bar");
  gsap.set(bars(), { scaleY: 0, transformOrigin: "50% 100%" });
  const chips = gsap.utils.toArray(".glass-stat-card, .event-chip, .chip-connector");
  gsap.set(chips, { autoAlpha: 0, y: 12 });
  ScrollTrigger.create({
    trigger: ".night-data-viz",
    start: "top 85%",
    once: true,
    onEnter: () => {
      gsap.to(bars(), { scaleY: 1, duration: 0.5, ease: "power2.out", stagger: { each: 0.006 } });
      gsap.to(chips, { autoAlpha: 1, y: 0, duration: 0.6, ease: "power2.out", stagger: 0.1, delay: 0.35 });
    },
  });
}

/* testimonials: the two columns drift at different speeds over the sticky
   title — left column slower, right column faster */
const TESTIMONIAL_COL_SPEEDS = { left: 55, right: 140 }; // px of drift per column
function testimonialsParallax() {
  document.querySelectorAll(".testimonial-card").forEach((card) => {
    const isLeft = (card.style.gridColumn || "").trim().startsWith("1");
    const drift = isLeft ? TESTIMONIAL_COL_SPEEDS.left : TESTIMONIAL_COL_SPEEDS.right;
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

/* benefits: the tile itself morphs into the card — both halves start
   collapsed onto the tile band (the middle 64px of the card), stay joined at
   the crease while they grow apart like an envelope opening from the middle,
   and collapse back into the tile on unhover. No gap, no thin air. */
function benefitHovers() {
  const BAND = 0.233; // 32px per half = the 64px tile band
  document.querySelectorAll(".benefit-tile").forEach((tile) => {
    const card = tile.querySelector(".benefit-card");
    if (!card) return;
    const upper = card.querySelector(".benefit-card-upper");
    const lower = card.querySelector(".benefit-card-lower");
    gsap.set(card, { autoAlpha: 0 });
    gsap.set(upper, { scaleY: BAND, rotateX: -22, transformOrigin: "50% 100%", transformPerspective: 900 });
    gsap.set(lower, { scaleY: BAND, transformOrigin: "50% 0%" });
    const tl = gsap.timeline({ paused: true })
      .to(card, { autoAlpha: 1, duration: 0.08, ease: "none" }, 0)
      .to(upper, { scaleY: 1, rotateX: 0, duration: 0.38, ease: "power3.out" }, 0.02)
      .to(lower, { scaleY: 1, duration: 0.34, ease: "power3.out" }, 0.02);
    tile.addEventListener("mouseenter", () => {
      tile.style.zIndex = 7;
      tl.timeScale(1).play();
    });
    tile.addEventListener("mouseleave", () => {
      tl.timeScale(1.45).reverse();
      tl.eventCallback("onReverseComplete", () => (tile.style.zIndex = ""));
    });
  });
}

/* faq: exclusive accordion. Answers are pre-split ONCE so the line-by-line
   fade never reflows the page; open + close run in one flow with matched
   easing so the page glides instead of jumping. */
function faqAccordion() {
  const items = document.querySelectorAll(".faq-item");
  items.forEach((item) => {
    const inner = item.querySelector(".faq-answer-inner");
    if (!reducedMotion) {
      item._split = SplitText.create(inner, { type: "lines", autoSplit: true });
    }
  });
  items.forEach((item) => {
    const head = item.querySelector(".faq-item-head");
    const answer = item.querySelector(".faq-answer");
    head.addEventListener("click", () => {
      const isOpen = item.classList.contains("is-open");
      const flow = gsap.timeline({ defaults: { duration: 0.5, ease: "power3.inOut" } });
      items.forEach((other) => {
        if (other !== item && other.classList.contains("is-open")) {
          other.classList.remove("is-open");
          other.querySelector(".faq-item-head").setAttribute("aria-expanded", "false");
          flow.to(other.querySelector(".faq-answer"), { height: 0 }, 0);
        }
      });
      if (isOpen) {
        item.classList.remove("is-open");
        head.setAttribute("aria-expanded", "false");
        flow.to(answer, { height: 0 }, 0);
      } else {
        item.classList.add("is-open");
        head.setAttribute("aria-expanded", "true");
        flow.to(answer, { height: "auto" }, 0);
        if (item._split) {
          flow.fromTo(item._split.lines,
            { autoAlpha: 0, y: 10 },
            { autoAlpha: 1, y: 0, duration: 0.45, stagger: 0.06, ease: "power2.out" }, 0.15);
        }
      }
    });
  });
}

/* footer: quick staggered reveal — never make the user wait */
function footerReveal() {
  scrollArc(".footer-arc-clip .section-arcs-svg", ".footer-arc-clip");
  const rows = gsap.utils.toArray(".footer-container > *");
  gsap.set(rows, { autoAlpha: 0, y: 16 });
  ScrollTrigger.create({
    trigger: ".footer",
    start: "top 85%",
    once: true,
    onEnter: () => gsap.to(rows, { autoAlpha: 1, y: 0, duration: 0.55, ease: "power2.out", stagger: 0.06 }),
  });
}

/* ============================================================
   Init
   ============================================================ */
buildWaveform();
buildButtons();
buildBenefitCards();
buildStatCounters();

document.fonts.ready.then(() => {
  if (reducedMotion) {
    gsap.set(".backdrop-arcs", { visibility: "visible" });
    faqAccordion();
    benefitHovers();
    return; // no motion beyond hover/accordion behaviour
  }
  heroIntro();
  scrollArc(".symptoms-arc-clip .section-arcs-svg", ".symptoms-arc-clip");
  prepReveals();
  statsSequence();
  symptomCardsIn();
  nightVizIn();
  testimonialsParallax();
  benefitHovers();
  faqAccordion();
  footerReveal();
  ScrollTrigger.refresh();
});
