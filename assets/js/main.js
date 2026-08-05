/* ============================================================
   FixSnoring — main.js
   GSAP + ScrollTrigger + SplitText + Lenis.
   Every animation lives in its own named function so individual
   pieces can be tuned or swapped without touching the rest.
   ============================================================ */

gsap.registerPlugin(ScrollTrigger, SplitText);

/* ---------- smooth scroll (Lenis driven by GSAP ticker) ---------- */
const lenis = new Lenis({
  autoRaf: false,
});
lenis.on("scroll", ScrollTrigger.update);
gsap.ticker.add((time) => lenis.raf(time * 1000));
gsap.ticker.lagSmoothing(0);

/* ---------- night data viz: waveform bars (exact Figma heights) ----------
   110 bars, 10px pitch, bottom-aligned on the 400px baseline.
   Orange runs mark snore / oxygen-dip event clusters. */
const WAVE_HEIGHTS = [
  31, 38, 44, 48, 49, 47, 42, 35, 26, 24, 30, 37, 42, 44, 43, 40, 34, 27, 37, 44,
  50, 53, 53, 49, 43, 36, 36, 43, 49, 52, 126, 119, 107, 90, 72, 85, 97, 104, 105, 100,
  96, 86, 73, 28, 37, 44, 49, 51, 49, 45, 39, 32, 40, 47, 52, 54, 52, 48, 41, 33,
  33, 39, 44, 46, 45, 41, 35, 26, 19, 29, 37, 43, 116, 117, 111, 101, 87, 91, 108, 122,
  129, 131, 126, 115, 100, 32, 39, 45, 49, 50, 48, 42, 35, 26, 26, 32, 36, 41, 43, 42,
  38, 32, 27, 36, 44, 50, 52, 52, 49, 43,
];
const WAVE_EVENT_RANGES = [
  [30, 42],
  [72, 84],
];

function buildWaveform() {
  const host = document.getElementById("snore-waveform");
  if (!host) return;
  const frag = document.createDocumentFragment();
  WAVE_HEIGHTS.forEach((h, i) => {
    const bar = document.createElement("i");
    bar.className = "wave-bar";
    if (WAVE_EVENT_RANGES.some(([a, b]) => i >= a && i <= b)) {
      bar.classList.add("is-event");
    }
    bar.style.left = i * 10 + "px";
    bar.style.height = h + "px";
    frag.appendChild(bar);
  });
  host.appendChild(frag);
}

buildWaveform();

/* Animations are added per-section in the animation pass. */
