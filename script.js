document.getElementById('year').textContent = new Date().getFullYear();

const io = new IntersectionObserver(
  (entries) => {
    for (const e of entries) {
      if (e.isIntersecting) {
        e.target.classList.add('in');
        io.unobserve(e.target);
      }
    }
  },
  { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
);

document.querySelectorAll('.section, .project, .stat, .skill-col, .spotlight, .now-card').forEach((el) => {
  el.classList.add('reveal');
  io.observe(el);
});

document.querySelectorAll('a[href^="#"]').forEach((a) => {
  a.addEventListener('click', (e) => {
    const id = a.getAttribute('href');
    if (id.length > 1) {
      const target = document.querySelector(id);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        history.replaceState(null, '', id);
      }
    }
  });
});

// Cursor glow follower
const docEl = document.documentElement;
window.addEventListener('pointermove', (e) => {
  docEl.style.setProperty('--mx', e.clientX + 'px');
  docEl.style.setProperty('--my', e.clientY + 'px');
}, { passive: true });

// Scroll progress bar
const progress = document.getElementById('scrollProgress');
function updateProgress() {
  const h = document.documentElement;
  const pct = (h.scrollTop / (h.scrollHeight - h.clientHeight)) * 100;
  progress.style.width = pct + '%';
}
window.addEventListener('scroll', updateProgress, { passive: true });
updateProgress();

// --- Custom cursor (dot + lagging ring) ---
(() => {
  if (matchMedia('(hover: none), (pointer: coarse)').matches) return;
  const dot = document.getElementById('cursorDot');
  const ring = document.getElementById('cursorRing');
  if (!dot || !ring) return;

  let tx = -100, ty = -100;
  let rx = -100, ry = -100;

  window.addEventListener('pointermove', (e) => {
    tx = e.clientX;
    ty = e.clientY;
    dot.style.setProperty('--x', tx + 'px');
    dot.style.setProperty('--y', ty + 'px');
  }, { passive: true });

  window.addEventListener('pointerdown', () => ring.classList.add('press'));
  window.addEventListener('pointerup',   () => ring.classList.remove('press'));

  const interactiveSel = 'a, button, .btn, .magnetic, input, textarea, [role="button"]';
  document.querySelectorAll(interactiveSel).forEach((el) => {
    el.addEventListener('pointerenter', () => ring.classList.add('hover'));
    el.addEventListener('pointerleave', () => ring.classList.remove('hover'));
  });

  function loop() {
    rx += (tx - rx) * 0.18;
    ry += (ty - ry) * 0.18;
    ring.style.setProperty('--x', rx + 'px');
    ring.style.setProperty('--y', ry + 'px');
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();

// --- Magnetic buttons ---
(() => {
  if (matchMedia('(hover: none), (pointer: coarse)').matches) return;
  const strength = 0.35;
  document.querySelectorAll('.magnetic').forEach((wrap) => {
    wrap.addEventListener('pointermove', (e) => {
      const r = wrap.getBoundingClientRect();
      const x = e.clientX - (r.left + r.width / 2);
      const y = e.clientY - (r.top + r.height / 2);
      wrap.style.transform = `translate(${x * strength}px, ${y * strength}px)`;
    });
    wrap.addEventListener('pointerleave', () => {
      wrap.style.transform = '';
    });
  });
})();

// --- 3D Tilt + spotlight on cards ---
(() => {
  if (matchMedia('(hover: none), (pointer: coarse)').matches) return;
  const sel = '.project, .stat, .skill-col, .contact-grid a, .now-card, .awards li, .spotlight';
  const max = 8; // max rotation in degrees
  document.querySelectorAll(sel).forEach((el) => {
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width;
      const py = (e.clientY - r.top) / r.height;
      const rx = (0.5 - py) * max;
      const ry = (px - 0.5) * max;
      el.style.setProperty('--rx', rx + 'deg');
      el.style.setProperty('--ry', ry + 'deg');
      el.style.setProperty('--mx', px * 100 + '%');
      el.style.setProperty('--my', py * 100 + '%');
    });
    el.addEventListener('pointerleave', () => {
      el.style.setProperty('--rx', '0deg');
      el.style.setProperty('--ry', '0deg');
    });
  });
})();

// --- Scramble decoder text ---
(() => {
  const charset = '!<>-_\\/[]{}=+*^?#░▒▓█01';
  function scramble(el, target, duration = 900) {
    const len = target.length;
    const start = performance.now();
    function frame(now) {
      const elapsed = now - start;
      let out = '';
      for (let i = 0; i < len; i++) {
        const cs = (i / len) * duration * 0.55;
        const cd = duration * 0.45;
        const t = (elapsed - cs) / cd;
        if (t >= 1) out += target[i];
        else if (t > 0) out += charset[(Math.random() * charset.length) | 0];
        else out += ' ';
      }
      el.textContent = out;
      if (elapsed < duration) requestAnimationFrame(frame);
      else el.textContent = target;
    }
    requestAnimationFrame(frame);
  }

  const items = document.querySelectorAll('.scramble[data-target]');
  function run() {
    items.forEach((el, i) => {
      setTimeout(() => scramble(el, el.dataset.target, 900), i * 220);
    });
  }
  // initial play after short delay
  setTimeout(run, 350);
  // replay on hover over the headline
  const h1 = document.querySelector('.h1-scramble');
  let cooling = false;
  h1?.addEventListener('mouseenter', () => {
    if (cooling) return;
    cooling = true;
    run();
    setTimeout(() => (cooling = false), 1500);
  });
})();

// --- Hero particle constellation ---
(() => {
  const cv = document.getElementById('heroParticles');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  let particles = [];
  let w = 0, h = 0;
  let mouseX = -9999, mouseY = -9999;
  const LINK_DIST = 130;
  const MOUSE_DIST = 200;

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = cv.clientWidth;
    h = cv.clientHeight;
    if (w === 0 || h === 0) return;
    cv.width = w * dpr;
    cv.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    seed();
  }

  function seed() {
    const target = Math.min(70, Math.max(20, Math.floor((w * h) / 16000)));
    particles = [];
    for (let i = 0; i < target; i++) {
      particles.push({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        r: Math.random() * 1.3 + 0.5,
      });
    }
  }

  function tick() {
    if (w === 0 || h === 0) { requestAnimationFrame(tick); return; }
    ctx.clearRect(0, 0, w, h);

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0 || p.x > w) p.vx *= -1;
      if (p.y < 0 || p.y > h) p.vy *= -1;

      ctx.fillStyle = 'rgba(139, 124, 255, 0.7)';
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();

      for (let j = i + 1; j < particles.length; j++) {
        const q = particles[j];
        const dx = p.x - q.x;
        const dy = p.y - q.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < LINK_DIST * LINK_DIST) {
          const d = Math.sqrt(d2);
          const alpha = (1 - d / LINK_DIST) * 0.28;
          ctx.strokeStyle = `rgba(139, 124, 255, ${alpha})`;
          ctx.lineWidth = 0.6;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(q.x, q.y);
          ctx.stroke();
        }
      }

      const dx = p.x - mouseX;
      const dy = p.y - mouseY;
      const dm = Math.sqrt(dx * dx + dy * dy);
      if (dm < MOUSE_DIST) {
        const alpha = (1 - dm / MOUSE_DIST) * 0.5;
        ctx.strokeStyle = `rgba(126, 231, 196, ${alpha})`;
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(mouseX, mouseY);
        ctx.stroke();

        // gentle repulsion
        const force = (1 - dm / MOUSE_DIST) * 0.08;
        p.vx += (dx / dm) * force;
        p.vy += (dy / dm) * force;
      }

      // velocity damping so particles don't shoot off
      p.vx *= 0.995;
      p.vy *= 0.995;
      // minimum drift
      const sp = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
      if (sp < 0.05) {
        p.vx += (Math.random() - 0.5) * 0.04;
        p.vy += (Math.random() - 0.5) * 0.04;
      }
    }
    requestAnimationFrame(tick);
  }

  window.addEventListener('pointermove', (e) => {
    const r = cv.getBoundingClientRect();
    mouseX = e.clientX - r.left;
    mouseY = e.clientY - r.top;
  }, { passive: true });
  window.addEventListener('pointerleave', () => { mouseX = -9999; mouseY = -9999; });

  const ro = new ResizeObserver(resize);
  ro.observe(cv);
  resize();
  requestAnimationFrame(tick);
})();

// Animated counters
const counters = document.querySelectorAll('.stat-num[data-count]');
const counterIO = new IntersectionObserver((entries) => {
  for (const e of entries) {
    if (!e.isIntersecting) continue;
    const el = e.target;
    const target = parseInt(el.dataset.count, 10);
    const suffix = el.dataset.suffix || '';
    const dur = 1400;
    const start = performance.now();
    function tick(t) {
      const p = Math.min((t - start) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      const value = Math.floor(eased * target);
      el.textContent = value.toLocaleString() + (p === 1 ? suffix : '');
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
    counterIO.unobserve(el);
  }
}, { threshold: 0.4 });
counters.forEach((c) => counterIO.observe(c));
