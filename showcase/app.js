/* ============================================================
   Polydoc Showcase — app.js
   ============================================================ */

// ── Lightbox ──────────────────────────────────────────────

const lightbox = document.getElementById("lightbox");
const lightboxImg = document.getElementById("lightbox-img");
const lightboxClose = document.getElementById("lightbox-close");

function openLightbox(src, alt) {
  lightboxImg.src = src;
  lightboxImg.alt = alt;
  lightbox.classList.add("open");
  document.body.style.overflow = "hidden";
}

function closeLightbox() {
  lightbox.classList.remove("open");
  document.body.style.overflow = "";
}

document.querySelectorAll(".img-zoomable").forEach((img) => {
  img.addEventListener("click", () => openLightbox(img.src, img.alt));
});

lightboxClose.addEventListener("click", closeLightbox);
lightboxImg.addEventListener("click", closeLightbox);
lightbox.addEventListener("click", (e) => { if (e.target === lightbox) closeLightbox(); });
document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeLightbox(); });

// ── Burger menu ───────────────────────────────────────────

const burger = document.getElementById("nav-burger");
const navLinks = document.getElementById("nav-links");

burger.addEventListener("click", () => {
  const open = navLinks.classList.toggle("open");
  burger.classList.toggle("open", open);
  burger.setAttribute("aria-expanded", open);
});

navLinks.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => {
    navLinks.classList.remove("open");
    burger.classList.remove("open");
    burger.setAttribute("aria-expanded", false);
  });
});

// ── Intersection Observer: fade-up animations ─────────────

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.12 }
);

document.querySelectorAll(".fade-up").forEach((el) => observer.observe(el));

// ── Friends / Cost Savings Bar Chart ─────────────────────

const friendsData = [
  { ep: "S1 E1", pct: 0.0 },
  { ep: "S1 E2", pct: 8.8 },
  { ep: "S1 E3", pct: 9.6 },
  { ep: "S1 E4", pct: 12.1 },
  { ep: "S1 E5", pct: 14.3 },
  { ep: "S1 E6", pct: 15.8 },
  { ep: "S1 E7", pct: 17.2 },
  { ep: "S1 E8", pct: 18.0 },
  { ep: "S1 E9", pct: 19.4 },
  { ep: "S1 E10", pct: 21.5 },
];

const MAX_PCT = 22;
const MAX_BAR_H = 160; // px — matches CSS .chart-bar-wrap height

const chartBars = document.getElementById("chart-bars");

friendsData.forEach((item, i) => {
  const barH = Math.round((item.pct / MAX_PCT) * MAX_BAR_H);

  const col = document.createElement("div");
  col.className = "chart-col";
  col.innerHTML = `
    <div class="chart-pct">${item.pct > 0 ? item.pct.toFixed(1) + "%" : ""}</div>
    <div class="chart-bar-wrap">
      <div class="chart-bar" style="--bar-h: ${barH}px; --bar-delay: ${i * 60}ms;"></div>
    </div>
    <div class="chart-ep">${item.ep}</div>
  `;
  chartBars.appendChild(col);
});

// Animate bars when chart comes into view
const chartObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.querySelectorAll(".chart-bar").forEach((bar) => {
          const h = bar.style.getPropertyValue("--bar-h");
          bar.style.height = h;
        });
        chartObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.3 }
);

const friendsChart = document.getElementById("friends-chart");
if (friendsChart) chartObserver.observe(friendsChart);

// ── Stat counter animation ─────────────────────────────

function animateCount(el) {
  const raw = el.dataset.target;
  const target = parseFloat(raw);
  const prefix = el.dataset.prefix || "";
  const suffix = el.dataset.suffix || "";
  const isFloat = raw.includes(".");
  const duration = 1200;
  const start = performance.now();

  function step(now) {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const current = target * eased;
    const num = (isFloat ? current.toFixed(1) : Math.round(current)) + suffix;
    el.innerHTML = prefix ? `<span class="stat-prefix">${prefix}</span>${num}` : num;
    if (progress < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

const statObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        animateCount(entry.target);
        statObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.5 }
);

document.querySelectorAll(".stat-value[data-target]").forEach((el) =>
  statObserver.observe(el)
);
