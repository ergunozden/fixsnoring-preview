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
   Per-benefit photos (round 10): grayscale in assets/img/benefits/, the
   orange wash is the CSS ::after. Sharp Memory keeps its original Figma
   asset.
   Per-benefit descriptions (round 11): Claude draft - Gemini pass pending
   (Gemini key unavailable); verify before production. */
const BENEFIT_DESC =
  "Once you understand what’s happening in your sleep, the next step is choosing the treatment.";
const BENEFIT_DESCS = {
  "Heart Health": "Deep sleep lowers blood pressure and gives your heart the nightly rest it needs.",
  "Muscle Growth": "Growth hormone peaks during deep sleep, when your muscles do their real building.",
  "Tissue Repair": "Your body repairs skin, muscle and tissue while you sleep, cell by cell.",
  "Physical Recovery": "A full night of sleep is when soreness fades and your energy stores refill.",
  "Immune Support": "Consistent sleep strengthens the immune responses that keep you from getting sick.",
  "Disease Resistance": "Well-rested bodies fight off infection and inflammation far more effectively.",
  "Better Focus": "One good night sharpens attention. A week of them transforms it.",
  "Sharp Memory": "Sleep is when the brain files the day away, turning moments into lasting memory.",
  "Brain Health": "Overnight, your brain clears the waste that builds up during waking hours.",
  "Mental Clarity": "Rested minds think in straight lines. Fog is a symptom, not a personality.",
  "Problem Solving": "Sleep reorganizes what you learned, so solutions surface that were not there yesterday.",
  "Stress Relief": "Sleep resets cortisol, the stress hormone, so pressure feels lighter by morning.",
  "Mood Regulation": "The difference between a short fuse and a good day often starts the night before.",
  "Lower Anxiety": "A rested brain keeps worry in proportion. Sleep is its nightly maintenance.",
  "Emotional Balance": "REM sleep processes the day's emotions, so you wake steadier than you went to bed.",
  "Hormonal Balance": "From appetite to energy, the hormones that run your day are tuned while you sleep.",
};

function benefitImg(label) {
  if (label === "Sharp Memory") return "assets/img/benefit-sharp-memory.png";
  return "assets/img/benefits/" + label.toLowerCase().replace(/\s+/g, "-") + ".jpg";
}

function buildBenefitCards() {
  document.querySelectorAll(".benefit-tile").forEach((tile) => {
    const label = tile.querySelector(".benefit-label").textContent;
    const img = benefitImg(label);
    const desc = BENEFIT_DESCS[label] || BENEFIT_DESC;
    const card = document.createElement("div");
    card.className = "benefit-card";
    card.setAttribute("aria-hidden", "true");
    card.innerHTML =
      '<div class="benefit-card-half benefit-card-upper" style="background-image:url(' + img + ')">' +
      '<span class="benefit-label">' + label + "</span></div>" +
      '<div class="benefit-card-half benefit-card-lower" style="background-image:url(' + img + ')">' +
      '<span class="benefit-card-desc">' + desc + "</span></div>";
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
  revealOnView(clipSel, "-12%", () => tl.play(0), () => tl.pause(0));
}

/* ============================================================
   Reveal system — everything is pre-hidden at init and plays when
   its trigger is actually on screen. If the user scrolls past
   faster than the animation can finish, the reveal resets and
   plays again the next time the trigger enters the viewport
   (from either direction) — nobody lands on a finished reveal.
   ============================================================ */
const wipeTargets = [];

/* IntersectionObserver, not ScrollTrigger: reveals key off the element's
   REAL rendered position, so late reflows can never leave a reveal firing
   early or late. enterMargin mirrors the old "top N%" starts — "-8%" means
   the element's top must clear the bottom 8% of the viewport. */
function revealOnView(trigger, enterMargin, play, reset) {
  const el = typeof trigger === "string" ? document.querySelector(trigger) : trigger;
  if (!el) return;
  let done = false;
  let anim = null;
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (done) return;
      if (entry.isIntersecting) {
        if (anim) return;
        anim = play();
        anim.eventCallback("onComplete", () => { done = true; io.disconnect(); });
      } else if (anim) {
        reset(anim);
        anim = null;
      }
    });
  }, { rootMargin: "0px 0px " + enterMargin + " 0px" });
  io.observe(el);
}

function prepReveals() {
  document.querySelectorAll("[data-wipe]").forEach((el) => {
    const split = SplitText.create(el, { type: "lines", mask: "lines", autoSplit: true });
    gsap.set(split.lines, { yPercent: 110 });
    wipeTargets.push({ el, split });
    revealOnView(el, "-8%",
      () => gsap.to(split.lines, { yPercent: 0, duration: 0.9, stagger: 0.09, ease: "power3.out" }),
      (tw) => { tw.kill(); gsap.set(split.lines, { yPercent: 110 }); });
  });
  document.querySelectorAll("[data-fade]").forEach((el) => {
    gsap.set(el, { autoAlpha: 0, y: 16 });
    revealOnView(el, "-6%",
      () => gsap.to(el, { autoAlpha: 1, y: 0, duration: 0.8, ease: "power2.out" }),
      (tw) => { tw.kill(); gsap.set(el, { autoAlpha: 0, y: 16 }); });
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
  const tl = gsap.timeline({ paused: true });
  cols.forEach((col, i) => {
    const bar = col.querySelector(".stat-line-inner");
    const block = col.querySelector(".stat-block");
    const num = col.querySelector(".stat-num");
    const at = i * 0.32; // tighter stagger so fast scrollers aren't left waiting
    tl.to(bar, { scaleY: 1, duration: 1.9, ease: "power2.inOut" }, at);   // smooth in and out, no bounce
    tl.to(block, { y: 0, duration: 1.9, ease: "power2.inOut" }, at);      // rides the bar top
    if (num) {
      tl.fromTo(num, { innerText: 0 },
        { innerText: +num.dataset.target, duration: 1.9, snap: { innerText: 1 }, ease: "power2.inOut" }, at);
    }
  });
  revealOnView(".stats-columns", "-12%", () => tl.play(0), () => tl.pause(0));
}

/* symptoms cards entrance */
function symptomCardsIn() {
  const slots = gsap.utils.toArray(".symptom-card-slot");
  gsap.set(slots, { autoAlpha: 0, y: 30 });
  revealOnView(".symptoms-cards", "-12%",
    () => gsap.to(slots, { autoAlpha: 1, y: 0, duration: 0.9, ease: "power3.out", stagger: 0.1 }),
    (tw) => { tw.kill(); gsap.set(slots, { autoAlpha: 0, y: 30 }); });
}

/* night data viz: bars grow up quickly, chips pop in */
function nightVizIn() {
  const bars = gsap.utils.toArray(".wave-bar");
  gsap.set(bars, { scaleY: 0, transformOrigin: "50% 100%" });
  const chips = gsap.utils.toArray(".glass-stat-card, .event-chip, .chip-connector");
  gsap.set(chips, { autoAlpha: 0, y: 12 });
  const tl = gsap.timeline({ paused: true })
    .to(bars, { scaleY: 1, duration: 0.5, ease: "power2.out", stagger: { each: 0.006 } }, 0)
    .to(chips, { autoAlpha: 1, y: 0, duration: 0.6, ease: "power2.out", stagger: 0.1 }, 0.35);
  revealOnView(".night-data-viz", "-15%", () => tl.play(0), () => tl.pause(0));
}

/* testimonials: the two columns drift at different speeds over the sticky
   title — left column slower, right column faster */
const TESTIMONIAL_COL_SPEEDS = { left: 80, right: 300 }; // px of drift per column
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

/* trust: the coach panel and the four pillars rise in together */
function trustPillarsIn() {
  const items = gsap.utils.toArray(".trust-panel, .trust-pillar");
  gsap.set(items, { autoAlpha: 0, y: 24 });
  revealOnView(".trust-pillars", "-15%",
    () => gsap.to(items, { autoAlpha: 1, y: 0, duration: 0.9, ease: "power3.out", stagger: 0.09 }),
    (tw) => { tw.kill(); gsap.set(items, { autoAlpha: 0, y: 24 }); });
}

/* testimonials: each card fades in where it stands — opacity only,
   the parallax scrub owns the y axis */
function testimonialCardsIn() {
  document.querySelectorAll(".testimonial-card").forEach((card) => {
    gsap.set(card, { autoAlpha: 0 });
    revealOnView(card, "-8%",
      () => gsap.to(card, { autoAlpha: 1, duration: 0.9, ease: "power2.out" }),
      (tw) => { tw.kill(); gsap.set(card, { autoAlpha: 0 }); });
  });
}

/* benefits: tiles rise in ROW pairs (round 10 — per-tile firing read as
   a random dribble). Each grid row is one reveal unit: both tiles come
   up together on a tight offset, snappier curve, less travel. */
function benefitTilesIn() {
  const rows = {};
  document.querySelectorAll(".benefit-tile").forEach((tile) => {
    const row = (tile.style.gridRow || "0").split("/")[0].trim();
    (rows[row] = rows[row] || []).push(tile);
  });
  Object.values(rows).forEach((tiles) => {
    gsap.set(tiles, { autoAlpha: 0, y: 14 });
    revealOnView(tiles[0], "-6%",
      () => gsap.to(tiles, { autoAlpha: 1, y: 0, duration: 0.5, ease: "power2.out", stagger: 0.08 }),
      (tw) => { tw.kill(); gsap.set(tiles, { autoAlpha: 0, y: 14 }); });
  });
}

/* faq: each row rises in as it enters */
function faqItemsIn() {
  document.querySelectorAll(".faq-item").forEach((item) => {
    gsap.set(item, { autoAlpha: 0, y: 16 });
    revealOnView(item, "-6%",
      () => gsap.to(item, { autoAlpha: 1, y: 0, duration: 0.7, ease: "power2.out" }),
      (tw) => { tw.kill(); gsap.set(item, { autoAlpha: 0, y: 16 }); });
  });
}

/* video ctas + product tiles: the imagery fades up underneath the
   text reveals those blocks already have */
function mediaTilesIn() {
  document.querySelectorAll(".video-cta").forEach((tile) => {
    const media = tile.querySelectorAll(".video-cta-video, .video-cta-overlay");
    if (!media.length) return;
    gsap.set(media, { autoAlpha: 0 });
    revealOnView(tile, "-15%",
      () => gsap.to(media, { autoAlpha: 1, duration: 1.0, ease: "power2.out" }),
      (tw) => { tw.kill(); gsap.set(media, { autoAlpha: 0 }); });
  });
  document.querySelectorAll(".product-tile-img").forEach((img) => {
    gsap.set(img, { autoAlpha: 0, scale: 1.04 });
    revealOnView(img, "-10%",
      () => gsap.to(img, { autoAlpha: 1, scale: 1, duration: 1.1, ease: "power2.out" }),
      (tw) => { tw.kill(); gsap.set(img, { autoAlpha: 0, scale: 1.04 }); });
  });
}

/* benefits: the tile itself morphs into the card — both halves start
   collapsed onto the tile band (the middle 64px of the card), stay joined at
   the crease while they grow apart like an envelope opening from the middle,
   and collapse back into the tile on unhover. No gap, no thin air. */
function benefitHovers() {
  const BAND = 0.233; // 32px per half = the 64px tile band
  const records = [];
  document.querySelectorAll(".benefit-tile").forEach((tile) => {
    const card = tile.querySelector(".benefit-card");
    if (!card) return;
    const upper = card.querySelector(".benefit-card-upper");
    const lower = card.querySelector(".benefit-card-lower");
    const setClosed = () => {
      gsap.set(card, { autoAlpha: 0 });
      gsap.set(upper, { scaleY: BAND, rotateX: -22, transformOrigin: "50% 100%", transformPerspective: 900 });
      gsap.set(lower, { scaleY: BAND, transformOrigin: "50% 0%" });
    };
    setClosed();
    const tl = gsap.timeline({ paused: true })
      .to(card, { autoAlpha: 1, duration: 0.08, ease: "none" }, 0)
      .to(upper, { scaleY: 1, rotateX: 0, duration: 0.38, ease: "power3.out" }, 0.02)
      .to(lower, { scaleY: 1, duration: 0.34, ease: "power3.out" }, 0.02);
    const rec = {
      tile,
      // direct tile-to-tile handoff: the old card must get out of the way
      // instantly, so it quick-fades instead of reverse-folding beside the
      // new one (round 10 — the double fold read as lag)
      closeFast() {
        if (!tl.progress() && !tl.isActive()) return;
        tl.eventCallback("onReverseComplete", null);
        tl.pause();
        // drop UNDER the incoming card right away — clearing z-index only
        // after the fade made the stack reorder visibly (round 11 flash)
        tile.style.zIndex = 6;
        rec.fade = gsap.to(card, {
          autoAlpha: 0, duration: 0.16, ease: "none",
          onComplete: () => { tl.pause(0); setClosed(); tile.style.zIndex = ""; rec.fade = null; },
        });
      },
    };
    records.push(rec);
    tile.addEventListener("mouseenter", () => {
      records.forEach((other) => { if (other !== rec) other.closeFast(); });
      if (rec.fade) { rec.fade.kill(); rec.fade = null; tl.pause(0); setClosed(); }
      tile.style.zIndex = 7;
      tl.eventCallback("onReverseComplete", null);
      tl.timeScale(1).play();
    });
    tile.addEventListener("mouseleave", () => {
      if (rec.fade) return; // already being cleared by a handoff
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
    // GSAP owns the height inline from the start. A class-based height:auto
    // would snap open before the tween runs — the first-click jump.
    gsap.set(item.querySelector(".faq-answer"),
      { height: item.classList.contains("is-open") ? "auto" : 0 });
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

/* sound toggle: deep smooth brown noise — the airplane-cabin rumble
   (Ergun round 10; the tone drone read as a deep beep-beep alarm, and
   the raw round-5 noise was too dirty). Normalized brown noise through
   a DOUBLE lowpass: the steep rolloff removes the hiss/crackle that
   read as dirt and leaves only the smooth deep bed. Steady on purpose —
   no swell, a cabin does not pulse. Tuning knobs below. */
const SOUND_LEVEL = 0.12;  // master volume
const RUMBLE_HZ = 500;     // lowpass corner x2 - lower = deeper cabin
const NOISE_SECONDS = 6;   // loop length, long enough to hide the seam

function soundToggle() {
  const btn = document.getElementById("sound-toggle");
  if (!btn) return;
  let ctx = null;
  let gain = null;
  function startBrownNoise() {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    gain = ctx.createGain();
    gain.gain.value = 0;
    gain.connect(ctx.destination);

    const len = ctx.sampleRate * NOISE_SECONDS;
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    let last = 0;
    let peak = 0;
    for (let i = 0; i < len; i++) {
      const white = Math.random() * 2 - 1;
      last = (last + 0.02 * white) / 1.02;
      data[i] = last;
      if (Math.abs(last) > peak) peak = Math.abs(last);
    }
    for (let i = 0; i < len; i++) data[i] *= 0.9 / peak; // predictable level

    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.loop = true;
    const lp1 = ctx.createBiquadFilter();
    const lp2 = ctx.createBiquadFilter();
    lp1.type = lp2.type = "lowpass";
    lp1.frequency.value = lp2.frequency.value = RUMBLE_HZ;
    src.connect(lp1).connect(lp2).connect(gain);
    src.start();
  }
  btn.addEventListener("click", () => {
    const on = btn.classList.toggle("is-sound-on");
    btn.setAttribute("aria-pressed", String(on));
    btn.setAttribute("aria-label", on ? "Turn sound off" : "Turn sound on");
    if (on) {
      if (!ctx) startBrownNoise();
      ctx.resume();
      gain.gain.cancelScheduledValues(ctx.currentTime);
      gain.gain.setTargetAtTime(SOUND_LEVEL, ctx.currentTime, 0.5); // sleepy fade in
    } else if (gain) {
      gain.gain.cancelScheduledValues(ctx.currentTime);
      gain.gain.setTargetAtTime(0, ctx.currentTime, 0.35);
    }
  });
}

/* footer: quick staggered reveal — never make the user wait */
function footerReveal() {
  scrollArc(".footer-arc-clip .section-arcs-svg", ".footer-arc-clip");
  const rows = gsap.utils.toArray(".footer-container > *");
  gsap.set(rows, { autoAlpha: 0, y: 16 });
  revealOnView(".footer", "-15%",
    () => gsap.to(rows, { autoAlpha: 1, y: 0, duration: 0.55, ease: "power2.out", stagger: 0.06 }),
    (tw) => { tw.kill(); gsap.set(rows, { autoAlpha: 0, y: 16 }); });
}

/* ============================================================
   Init
   ============================================================ */
buildWaveform();
buildButtons();
buildBenefitCards();
buildStatCounters();

document.fonts.ready.then(() => {
  soundToggle();
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
  trustPillarsIn();
  testimonialsParallax();
  testimonialCardsIn();
  benefitTilesIn();
  mediaTilesIn();
  faqItemsIn();
  benefitHovers();
  faqAccordion();
  footerReveal();
  ScrollTrigger.refresh();

  // the page keeps reflowing a little after init (late media, async
  // SplitText re-splits) which leaves trigger positions stale — watch the
  // body height and recompute once things go quiet
  const settleRefresh = gsap.delayedCall(0.35, () => ScrollTrigger.refresh()).pause();
  let lastBodyH = document.body.scrollHeight;
  new ResizeObserver(() => {
    if (Math.abs(document.body.scrollHeight - lastBodyH) > 2) {
      lastBodyH = document.body.scrollHeight;
      settleRefresh.restart(true);
    }
  }).observe(document.body);
  window.addEventListener("load", () => settleRefresh.restart(true));
});
