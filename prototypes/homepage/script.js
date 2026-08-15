// ===== Footer year =====
document.getElementById("year").textContent = new Date().getFullYear();

// ===== Navbar opacity on scroll =====
const navbar = document.getElementById("navbar");
function updateNavbar() {
  navbar.classList.toggle("scrolled", window.scrollY > 12);
}
updateNavbar();
window.addEventListener("scroll", updateNavbar, { passive: true });

// ===== Scroll reveal =====
const revealTargets = document.querySelectorAll(".reveal");
if ("IntersectionObserver" in window) {
  const revealObserver = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          revealObserver.unobserve(entry.target);
        }
      }
    },
    { threshold: 0.15, rootMargin: "0px 0px -40px 0px" },
  );
  revealTargets.forEach((el) => revealObserver.observe(el));
} else {
  revealTargets.forEach((el) => el.classList.add("visible"));
}

// ===== Pricing monthly/yearly toggle =====
const billingToggle = document.getElementById("billingToggle");
const labelMonthly = document.getElementById("labelMonthly");
const labelYearly = document.getElementById("labelYearly");
const priceAmount = document.querySelector(".price-amount[data-monthly]");
const pricePeriod = document.querySelector(".price-period[data-monthly]");

function setBilling(yearly) {
  billingToggle.setAttribute("aria-checked", String(yearly));
  labelMonthly.classList.toggle("active-label", !yearly);
  labelYearly.classList.toggle("active-label", yearly);
  if (priceAmount && pricePeriod) {
    priceAmount.textContent = yearly
      ? priceAmount.dataset.yearly
      : priceAmount.dataset.monthly;
    pricePeriod.textContent = yearly
      ? pricePeriod.dataset.yearly
      : pricePeriod.dataset.monthly;
  }
}
setBilling(false);
billingToggle.addEventListener("click", () => {
  const isYearly = billingToggle.getAttribute("aria-checked") === "true";
  setBilling(!isYearly);
});

// ===== Chaos icons: drift, bounce, repel from cursor =====
const chaosContainer = document.getElementById("chaosIcons");
const chaosBox = document.getElementById("chaosBox");

if (chaosContainer && chaosBox) {
  const iconEls = Array.from(chaosContainer.querySelectorAll(".chaos-icon"));
  const ICON_SIZE = 60;
  const REPEL_RADIUS = 90;
  const REPEL_STRENGTH = 0.28;
  const MAX_SPEED = 0.55;
  const MAX_REPEL_SPEED = MAX_SPEED * 4;

  let bounds = { width: 0, height: 0 };
  function measure() {
    bounds = {
      width: chaosContainer.clientWidth,
      height: chaosContainer.clientHeight,
    };
  }

  const icons = iconEls.map((el) => {
    const angleSeed = Math.random() * Math.PI * 2;
    return {
      el,
      x: Math.random() * 0.8 * (bounds.width || 260),
      y: Math.random() * 0.8 * (bounds.height || 200),
      vx: (Math.random() - 0.5) * MAX_SPEED,
      vy: (Math.random() - 0.5) * MAX_SPEED,
      rotSeed: angleSeed,
      rotSpeed: 0.4 + Math.random() * 0.4,
      scaleSeed: Math.random() * Math.PI * 2,
      scaleSpeed: 0.6 + Math.random() * 0.5,
    };
  });

  let mouseX = null;
  let mouseY = null;

  chaosBox.addEventListener("mousemove", (event) => {
    const rect = chaosContainer.getBoundingClientRect();
    mouseX = event.clientX - rect.left;
    mouseY = event.clientY - rect.top;
  });
  chaosBox.addEventListener("mouseleave", () => {
    mouseX = null;
    mouseY = null;
  });

  measure();
  window.addEventListener("resize", measure);

  let lastTime = performance.now();

  function tick(now) {
    const dt = Math.min(now - lastTime, 48); // clamp for tab-switch stalls
    lastTime = now;
    const t = now / 1000;

    if (bounds.width === 0) measure();
    const maxX = Math.max(0, bounds.width - ICON_SIZE);
    const maxY = Math.max(0, bounds.height - ICON_SIZE);

    for (const icon of icons) {
      // Repel from cursor
      if (mouseX !== null) {
        const cx = icon.x + ICON_SIZE / 2;
        const cy = icon.y + ICON_SIZE / 2;
        const dx = cx - mouseX;
        const dy = cy - mouseY;
        const dist = Math.hypot(dx, dy) || 1;
        if (dist < REPEL_RADIUS) {
          const force = ((REPEL_RADIUS - dist) / REPEL_RADIUS) * REPEL_STRENGTH;
          icon.vx += (dx / dist) * force;
          icon.vy += (dy / dist) * force;
        }
      }

      // Cap how fast a single repel burst can fling an icon, then bleed off
      // only the excess speed above baseline so icons settle back to a
      // gentle drift instead of decaying to a standstill (or flying off).
      let speed = Math.hypot(icon.vx, icon.vy);
      if (speed > MAX_REPEL_SPEED) {
        const scale = MAX_REPEL_SPEED / speed;
        icon.vx *= scale;
        icon.vy *= scale;
        speed = MAX_REPEL_SPEED;
      }
      if (speed > MAX_SPEED) {
        const target = Math.max(MAX_SPEED, speed * 0.9);
        const scale = target / speed;
        icon.vx *= scale;
        icon.vy *= scale;
      }

      icon.x += icon.vx * (dt / 16);
      icon.y += icon.vy * (dt / 16);

      // Bounce off walls
      if (icon.x < 0) {
        icon.x = 0;
        icon.vx = Math.abs(icon.vx);
      } else if (icon.x > maxX) {
        icon.x = maxX;
        icon.vx = -Math.abs(icon.vx);
      }
      if (icon.y < 0) {
        icon.y = 0;
        icon.vy = Math.abs(icon.vy);
      } else if (icon.y > maxY) {
        icon.y = maxY;
        icon.vy = -Math.abs(icon.vy);
      }

      const rotation = Math.sin(t * icon.rotSpeed + icon.rotSeed) * 12;
      const scale = 1 + Math.sin(t * icon.scaleSpeed + icon.scaleSeed) * 0.08;

      icon.el.style.transform =
        "translate(" + icon.x + "px," + icon.y + "px) rotate(" + rotation.toFixed(2) + "deg) scale(" + scale.toFixed(3) + ")";
    }

    requestAnimationFrame(tick);
  }

  requestAnimationFrame(tick);
}
