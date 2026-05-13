/* =============================================
   CHAOS CANVAS ANIMATION
   ============================================= */
(function () {
  const canvas = document.getElementById('chaosCanvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const chaosBox = canvas.parentElement;

  // Icons to draw (emoji)
  const ICONS = ['N', 'G', 'S', '⌨', '⧉', '>', '≡', '★'];
  const COLORS = [
    '#3b82f6', '#f59e0b', '#06b6d4', '#22c55e',
    '#ec4899', '#6366f1', '#64748b', '#a855f7',
  ];

  let mouse = { x: -9999, y: -9999 };
  let particles = [];
  let animId;

  function resize() {
    const rect = chaosBox.getBoundingClientRect();
    canvas.width  = rect.width;
    canvas.height = rect.height;
  }

  function createParticles() {
    particles = ICONS.map((icon, i) => ({
      icon,
      color: COLORS[i],
      x: Math.random() * (canvas.width  * 0.7) + canvas.width  * 0.15,
      y: Math.random() * (canvas.height * 0.6) + canvas.height * 0.2,
      vx: (Math.random() - 0.5) * 0.8,
      vy: (Math.random() - 0.5) * 0.8,
      size: 32 + Math.random() * 14,
      rotation: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.02,
      scale: 1,
      targetScale: 1,
    }));
  }

  function drawIcon(p) {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rotation);
    ctx.scale(p.scale, p.scale);

    ctx.font = `${p.size}px monospace`;
    ctx.fillStyle = p.color;
    ctx.globalAlpha = 0.85;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Soft glow
    ctx.shadowColor = p.color;
    ctx.shadowBlur = 12;
    ctx.fillText(p.icon, 0, 0);
    ctx.shadowBlur = 0;

    ctx.restore();
  }

  const REPEL_RADIUS = 80;
  const REPEL_FORCE  = 2.5;
  const FRICTION     = 0.92;
  const SPEED_CAP    = 3.5;

  function updateParticle(p) {
    // Mouse repel
    const dx = p.x - mouse.x;
    const dy = p.y - mouse.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < REPEL_RADIUS && dist > 0.1) {
      const force = (1 - dist / REPEL_RADIUS) * REPEL_FORCE;
      p.vx += (dx / dist) * force;
      p.vy += (dy / dist) * force;
      p.targetScale = 1.3;
    } else {
      p.targetScale = 1;
    }
    p.scale += (p.targetScale - p.scale) * 0.12;

    // Friction
    p.vx *= FRICTION;
    p.vy *= FRICTION;

    // Add slight drift so they keep moving gently
    p.vx += (Math.random() - 0.5) * 0.06;
    p.vy += (Math.random() - 0.5) * 0.06;

    // Speed cap
    const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
    if (speed > SPEED_CAP) {
      p.vx = (p.vx / speed) * SPEED_CAP;
      p.vy = (p.vy / speed) * SPEED_CAP;
    }

    p.x += p.vx;
    p.y += p.vy;
    p.rotation += p.rotSpeed;

    const pad = p.size;
    if (p.x < pad)                    { p.x = pad;                p.vx = Math.abs(p.vx); }
    if (p.x > canvas.width  - pad)    { p.x = canvas.width - pad; p.vx = -Math.abs(p.vx); }
    if (p.y < pad + 32)               { p.y = pad + 32;           p.vy = Math.abs(p.vy); }
    if (p.y > canvas.height - pad)    { p.y = canvas.height - pad; p.vy = -Math.abs(p.vy); }
  }

  function loop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const p of particles) {
      updateParticle(p);
      drawIcon(p);
    }
    animId = requestAnimationFrame(loop);
  }

  // Track mouse relative to canvas
  chaosBox.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
  });
  chaosBox.addEventListener('mouseleave', () => {
    mouse.x = -9999;
    mouse.y = -9999;
  });

  const ro = new ResizeObserver(() => {
    resize();
    createParticles();
  });
  ro.observe(chaosBox);

  resize();
  createParticles();
  loop();
})();


/* =============================================
   NAVBAR SCROLL OPACITY
   ============================================= */
(function () {
  const navbar = document.getElementById('navbar');
  if (!navbar) return;

  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 20);
  }, { passive: true });
})();


/* =============================================
   MOBILE HAMBURGER
   ============================================= */
(function () {
  const btn    = document.getElementById('navHamburger');
  const mobile = document.getElementById('navMobile');
  if (!btn || !mobile) return;

  btn.addEventListener('click', () => {
    mobile.classList.toggle('open');
  });
})();


/* =============================================
   SCROLL FADE-IN (IntersectionObserver)
   ============================================= */
(function () {
  const items = document.querySelectorAll('.fade-in');

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
  );

  items.forEach((el) => observer.observe(el));
})();


/* =============================================
   PRICING TOGGLE
   ============================================= */
(function () {
  const toggle      = document.getElementById('billingToggle');
  const proPrice    = document.getElementById('proPrice');
  const pricePeriod = document.getElementById('pricePeriod');
  const priceSubtext= document.getElementById('priceSubtext');
  const labelMonthly= document.getElementById('labelMonthly');
  const labelYearly = document.getElementById('labelYearly');

  if (!toggle) return;

  toggle.addEventListener('change', () => {
    const yearly = toggle.checked;
    proPrice.textContent     = yearly ? '$72' : '$8';
    pricePeriod.textContent  = yearly ? '/year' : '/month';
    priceSubtext.textContent = yearly
      ? 'Billed annually — 2 months free.'
      : 'Billed monthly. Cancel anytime.';
    labelMonthly.classList.toggle('active', !yearly);
    labelYearly.classList.toggle('active',  yearly);
  });

  // Init state
  labelMonthly.classList.add('active');
})();


/* =============================================
   FOOTER YEAR
   ============================================= */
(function () {
  const el = document.getElementById('footerYear');
  if (el) el.textContent = new Date().getFullYear();
})();
