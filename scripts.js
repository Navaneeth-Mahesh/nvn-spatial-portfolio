/* =====================================================
   CORE STATE
===================================================== */

const state = {
  scrollY: 0,
  vh: window.innerHeight,
  dh: document.body.scrollHeight,
  mouse: { x: 0, y: 0 },
  smooth: { x: 0, y: 0 },
  heroVisible: true
};

const lerp = (a, b, t) => a + (b - a) * t;

/* =====================================================
   ELEMENT REFERENCES
===================================================== */

const scrollBar = document.querySelector(".scroll-progress");
const hero = document.querySelector(".hero");
const heroInner = document.querySelector(".hero-inner");
const spline = document.querySelector("spline-viewer");

const skillsSection = document.querySelector(".skills-section");
const skillsLine = document.querySelector("#skillsLine");
const skillsActive = document.querySelector("#skillsLineActive");
const skillsDot = document.querySelector("#skillsDot");
const skillNodes = [...document.querySelectorAll(".skill-node")].reverse();

const glow = document.querySelector(".cursor-glow");
const contact = document.querySelector("#contact");
const resumeBtn = document.querySelector(".hero-btn");

/* =====================================================
   BASIC LISTENERS (LIGHT)
===================================================== */

window.addEventListener("scroll", () => {
  state.scrollY = window.scrollY;
}, { passive: true });

window.addEventListener("resize", () => {
  state.vh = window.innerHeight;
  state.dh = document.body.scrollHeight;
}, { passive: true });

window.addEventListener("mousemove", (e) => {
  state.mouse.x = (e.clientX / window.innerWidth - 0.5) * 2;
  state.mouse.y = (e.clientY / window.innerHeight - 0.5) * 2;
}, { passive: true });

/* =====================================================
   SKILLS SETUP
===================================================== */

let skillsLength = 0;
let step = 0;

if (skillsLine && skillsActive && skillNodes.length) {
  skillsLength = skillsLine.getTotalLength();
  skillsActive.style.strokeDasharray = skillsLength;
  skillsActive.style.strokeDashoffset = skillsLength;
  step = 1 / skillNodes.length;
}

/* =====================================================
   MAIN RAF LOOP
===================================================== */

function update() {

  /* Scroll Progress */
  if (scrollBar) {
    const percent = (state.scrollY / (state.dh - state.vh)) * 100;
    scrollBar.style.height = `${percent}%`;
  }

  /* Hero Fade */
  if (heroInner) {
    heroInner.style.opacity = Math.max(0, 1 - state.scrollY / 220);
  }

  /* Hero Visibility */
  if (hero) {
    state.heroVisible = state.scrollY < hero.offsetHeight - 120;
  }

  /* Spline Interaction (ONLY when visible) */
  if (spline && state.heroVisible) {
    state.smooth.x = lerp(state.smooth.x, state.mouse.x, 0.06);
    state.smooth.y = lerp(state.smooth.y, state.mouse.y, 0.06);

    spline.setVariable("mouseX", state.smooth.x);
    spline.setVariable("mouseY", state.smooth.y);
  }

  /* Skills Animation (ONLY when visible) */
  if (skillsSection && skillsActive && skillsDot) {
    const rect = skillsSection.getBoundingClientRect();

    if (rect.top < state.vh && rect.bottom > 0) {
      const start = state.vh * 0.2;
      const end = state.vh * 0.9;

      const raw = (state.vh - rect.top - start) / (end - start);
      const progress = Math.min(1, Math.max(0, raw));

      const draw = skillsLength * progress;
      skillsActive.style.strokeDashoffset = skillsLength - draw;

      const p = skillsLine.getPointAtLength(draw);
      skillsDot.setAttribute("cx", p.x);
      skillsDot.setAttribute("cy", p.y);

      const index = Math.min(
        skillNodes.length - 1,
        Math.floor(progress / step)
      );

      skillNodes.forEach((n, i) => {
        n.classList.toggle("is-active", i === index);
        n.classList.toggle("is-past", i < index);
      });
    }
  }

  requestAnimationFrame(update);
}

requestAnimationFrame(update);

/* =====================================================
   SMOOTH ANCHORS
===================================================== */

document.querySelectorAll('a[href^="#"]').forEach(link => {
  link.addEventListener("click", e => {
    const target = document.querySelector(link.getAttribute("href"));
    if (!target) return;
    e.preventDefault();
    target.scrollIntoView({ behavior: "smooth" });
  });
});

/* =====================================================
   CURSOR GLOW
===================================================== */

if (glow) {
  let gx = window.innerWidth / 2;
  let gy = window.innerHeight / 2;

  function glowRAF() {
    gx += (state.mouse.x * window.innerWidth - gx) * 0.08;
    gy += (state.mouse.y * window.innerHeight - gy) * 0.08;
    glow.style.transform = `translate(${gx}px, ${gy}px) translate(-50%, -50%)`;
    requestAnimationFrame(glowRAF);
  }
  glowRAF();
}

/* =====================================================
   CONTACT VISIBILITY
===================================================== */

if (contact) {
  window.addEventListener("scroll", () => {
    const r = contact.getBoundingClientRect();
    document.body.classList.toggle("on-contact", r.top < state.vh && r.bottom > 0);
  });
}

/* =====================================================
   RESUME BUTTON
===================================================== */

if (resumeBtn) {
  resumeBtn.addEventListener("click", e => {
    e.preventDefault();
    alert("Resume will be updated soon. Stay tuned.");
  });
}
