// === Helpers ===
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const coarse = matchMedia('(hover: none), (pointer: coarse)').matches;
const lowEnd = (navigator.hardwareConcurrency || 4) < 4;

function rafThrottle(fn) {
  let queued = false;
  let lastArgs;
  return function (...args) {
    lastArgs = args;
    if (!queued) {
      queued = true;
      requestAnimationFrame(() => {
        queued = false;
        fn(...lastArgs);
      });
    }
  };
}

// === Year ===
document.getElementById('year').textContent = new Date().getFullYear();

// === Smooth scroll ===
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

// === Reveal on scroll (sections, cards) ===
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
document.querySelectorAll('.section, .project, .stat, .skill-col, .spotlight, .now-card, .c3d-card').forEach((el) => {
  el.classList.add('reveal');
  io.observe(el);
});

// === Word-by-word reveal for h2 headlines ===
(() => {
  const targets = document.querySelectorAll('.section-head h2');
  targets.forEach((el) => {
    const text = el.textContent;
    el.textContent = '';
    text.split(/(\s+)/).forEach((part) => {
      if (/^\s+$/.test(part)) {
        el.appendChild(document.createTextNode(part));
      } else if (part.length > 0) {
        const word = document.createElement('span');
        word.className = 'word';
        const inner = document.createElement('span');
        inner.className = 'word-inner';
        inner.textContent = part;
        word.appendChild(inner);
        el.appendChild(word);
      }
    });
    el.querySelectorAll('.word-inner').forEach((w, i) => {
      w.style.setProperty('--i', i);
    });
  });
})();

// === Cursor glow follower (background spotlight) ===
const docEl = document.documentElement;
const updateCursorVars = rafThrottle((x, y) => {
  docEl.style.setProperty('--mx', x + 'px');
  docEl.style.setProperty('--my', y + 'px');
});
window.addEventListener('pointermove', (e) => updateCursorVars(e.clientX, e.clientY), { passive: true });

// === Scroll progress ===
const progress = document.getElementById('scrollProgress');
const updateProgress = rafThrottle(() => {
  const h = document.documentElement;
  const pct = (h.scrollTop / (h.scrollHeight - h.clientHeight)) * 100;
  progress.style.width = pct + '%';
});
window.addEventListener('scroll', updateProgress, { passive: true });
updateProgress();

// === Custom cursor (dot + lagging ring) ===
(() => {
  if (coarse) return;
  const dot = document.getElementById('cursorDot');
  const ring = document.getElementById('cursorRing');
  if (!dot || !ring) return;

  let tx = -100, ty = -100, rx = -100, ry = -100;
  window.addEventListener('pointermove', (e) => {
    tx = e.clientX; ty = e.clientY;
    dot.style.setProperty('--x', tx + 'px');
    dot.style.setProperty('--y', ty + 'px');
  }, { passive: true });
  window.addEventListener('pointerdown', () => ring.classList.add('press'));
  window.addEventListener('pointerup',   () => ring.classList.remove('press'));

  const interactiveSel = 'a, button, .btn, .magnetic, input, textarea, .c3d-card, [role="button"]';
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

// === Magnetic buttons ===
(() => {
  if (coarse) return;
  const strength = 0.35;
  document.querySelectorAll('.magnetic').forEach((wrap) => {
    let rect = null;
    const update = rafThrottle((cx, cy) => {
      if (!rect) rect = wrap.getBoundingClientRect();
      const x = cx - (rect.left + rect.width / 2);
      const y = cy - (rect.top + rect.height / 2);
      wrap.style.transform = `translate3d(${x * strength}px, ${y * strength}px, 0)`;
    });
    wrap.addEventListener('pointerenter', () => { rect = wrap.getBoundingClientRect(); });
    wrap.addEventListener('pointermove', (e) => update(e.clientX, e.clientY));
    wrap.addEventListener('pointerleave', () => {
      rect = null;
      wrap.style.transform = '';
    });
  });
})();

// === 3D tilt + spotlight on cards (rect-cached, rAF-throttled) ===
(() => {
  if (coarse) return;
  const sel = '.project, .stat, .skill-col, .contact-grid a, .now-card, .awards li, .spotlight';
  const max = 8;
  document.querySelectorAll(sel).forEach((el) => {
    let rect = null;
    const onMove = rafThrottle((cx, cy) => {
      if (!rect) rect = el.getBoundingClientRect();
      const px = (cx - rect.left) / rect.width;
      const py = (cy - rect.top) / rect.height;
      el.style.setProperty('--rx', ((0.5 - py) * max) + 'deg');
      el.style.setProperty('--ry', ((px - 0.5) * max) + 'deg');
      el.style.setProperty('--mx', (px * 100) + '%');
      el.style.setProperty('--my', (py * 100) + '%');
    });
    el.addEventListener('pointerenter', () => { rect = el.getBoundingClientRect(); });
    el.addEventListener('pointermove', (e) => onMove(e.clientX, e.clientY));
    el.addEventListener('pointerleave', () => {
      rect = null;
      el.style.setProperty('--rx', '0deg');
      el.style.setProperty('--ry', '0deg');
    });
  });
  window.addEventListener('scroll', () => { /* invalidation happens via pointerenter */ }, { passive: true });
})();

// === Scramble decoder text ===
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
    items.forEach((el, i) => setTimeout(() => scramble(el, el.dataset.target, 900), i * 220));
  }
  setTimeout(run, 350);
  const h1 = document.querySelector('.h1-scramble');
  let cooling = false;
  h1?.addEventListener('mouseenter', () => {
    if (cooling) return;
    cooling = true;
    run();
    setTimeout(() => (cooling = false), 1500);
  });
})();

// === Hero particle constellation (IO-paused) ===
(() => {
  const cv = document.getElementById('heroParticles');
  if (!cv || reduced) return;
  const ctx = cv.getContext('2d', { alpha: true });
  let particles = [];
  let w = 0, h = 0;
  let mouseX = -9999, mouseY = -9999;
  let active = true;
  const LINK_DIST = lowEnd ? 100 : 130;
  const MOUSE_DIST = lowEnd ? 150 : 200;

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = cv.clientWidth; h = cv.clientHeight;
    if (w === 0 || h === 0) return;
    cv.width = w * dpr; cv.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    seed();
  }
  function seed() {
    const target = lowEnd
      ? Math.min(30, Math.floor((w * h) / 28000))
      : Math.min(70, Math.max(20, Math.floor((w * h) / 16000)));
    particles = [];
    for (let i = 0; i < target; i++) {
      particles.push({
        x: Math.random() * w, y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.3, vy: (Math.random() - 0.5) * 0.3,
        r: Math.random() * 1.3 + 0.5,
      });
    }
  }
  function tick() {
    requestAnimationFrame(tick);
    if (!active || w === 0 || h === 0) return;
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
          ctx.strokeStyle = `rgba(139,124,255,${(1 - d / LINK_DIST) * 0.28})`;
          ctx.lineWidth = 0.6;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke();
        }
      }

      const dx = p.x - mouseX, dy = p.y - mouseY;
      const dm = Math.sqrt(dx * dx + dy * dy);
      if (dm < MOUSE_DIST) {
        ctx.strokeStyle = `rgba(126,231,196,${(1 - dm / MOUSE_DIST) * 0.5})`;
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y); ctx.lineTo(mouseX, mouseY); ctx.stroke();
        const force = (1 - dm / MOUSE_DIST) * 0.08;
        p.vx += (dx / dm) * force; p.vy += (dy / dm) * force;
      }
      p.vx *= 0.995; p.vy *= 0.995;
      const sp = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
      if (sp < 0.05) {
        p.vx += (Math.random() - 0.5) * 0.04;
        p.vy += (Math.random() - 0.5) * 0.04;
      }
    }
  }
  window.addEventListener('pointermove', (e) => {
    const r = cv.getBoundingClientRect();
    mouseX = e.clientX - r.left; mouseY = e.clientY - r.top;
  }, { passive: true });
  window.addEventListener('pointerleave', () => { mouseX = -9999; mouseY = -9999; });

  const ro = new ResizeObserver(resize); ro.observe(cv);
  resize();

  // Pause when offscreen
  const visIO = new IntersectionObserver((entries) => {
    for (const e of entries) active = e.isIntersecting && !document.hidden;
  });
  visIO.observe(cv);
  document.addEventListener('visibilitychange', () => { active = !document.hidden; });

  requestAnimationFrame(tick);
})();

// === Animated stat counters ===
(() => {
  const counters = document.querySelectorAll('.stat-num[data-count]');
  const cio = new IntersectionObserver((entries) => {
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
        el.textContent = Math.floor(eased * target).toLocaleString() + (p === 1 ? suffix : '');
        if (p < 1) requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
      cio.unobserve(el);
    }
  }, { threshold: 0.4 });
  counters.forEach((c) => cio.observe(c));
})();

// === Physics drag chip ===
(() => {
  const chip = document.getElementById('physChip');
  if (!chip || reduced) return;

  let x = 0, y = 0, vx = 0, vy = 0;
  let dragging = false;
  let pointerStart = null;
  let chipStart = null;
  let lastMove = 0;

  function tick() {
    requestAnimationFrame(tick);
    if (dragging) return;
    // Spring back to home (0, 0 offset)
    const ax = -x * 0.045 - vx * 0.16;
    const ay = -y * 0.045 - vy * 0.16;
    vx += ax; vy += ay;
    x += vx; y += vy;
    if (Math.abs(vx) < 0.02 && Math.abs(vy) < 0.02 && Math.abs(x) < 0.3 && Math.abs(y) < 0.3) {
      x = 0; y = 0; vx = 0; vy = 0;
    }
    chip.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0)`;
  }
  requestAnimationFrame(tick);

  chip.addEventListener('pointerdown', (e) => {
    dragging = true;
    chip.setPointerCapture(e.pointerId);
    chip.classList.add('dragging');
    pointerStart = { x: e.clientX, y: e.clientY };
    chipStart = { x, y };
    vx = 0; vy = 0;
    lastMove = performance.now();
  });
  chip.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const newX = chipStart.x + (e.clientX - pointerStart.x);
    const newY = chipStart.y + (e.clientY - pointerStart.y);
    const now = performance.now();
    const dt = Math.max(1, now - lastMove);
    vx = ((newX - x) / dt) * 16;
    vy = ((newY - y) / dt) * 16;
    x = newX; y = newY;
    lastMove = now;
    chip.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0)`;
  });
  function endDrag(e) {
    if (!dragging) return;
    dragging = false;
    try { chip.releasePointerCapture(e.pointerId); } catch (_) {}
    chip.classList.remove('dragging');
  }
  chip.addEventListener('pointerup', endDrag);
  chip.addEventListener('pointercancel', endDrag);
})();

// === 3D Project Carousel ===
(() => {
  const stage = document.getElementById('carouselStage');
  const carousel = document.getElementById('carousel3d');
  const cards = document.querySelectorAll('.c3d-card');
  const currentEl = document.getElementById('c3dCurrent');
  if (!stage || !carousel) return;

  const N = cards.length;
  const STEP = 360 / N;
  let current = 0;
  let rot = 0;
  let autoTimer = null;

  function snap(idx) {
    current = ((idx % N) + N) % N;
    rot = -current * STEP;
    carousel.style.setProperty('--rot', rot + 'deg');
    if (currentEl) currentEl.textContent = String(current + 1).padStart(2, '0');
    cards.forEach((c, i) => c.classList.toggle('active', i === current));
  }
  function nudge(d) {
    snap(current + d);
    resetAuto();
  }
  function startAuto() {
    if (reduced) return;
    autoTimer = setInterval(() => snap(current + 1), 5000);
  }
  function stopAuto() { clearInterval(autoTimer); autoTimer = null; }
  function resetAuto() { stopAuto(); startAuto(); }

  // Drag
  let dragging = false, startX = 0, startRot = 0, dragMoved = false;
  stage.addEventListener('pointerdown', (e) => {
    dragging = true;
    dragMoved = false;
    startX = e.clientX;
    startRot = rot;
    carousel.classList.add('dragging');
    stage.setPointerCapture(e.pointerId);
    stopAuto();
  });
  stage.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const dx = e.clientX - startX;
    if (Math.abs(dx) > 4) dragMoved = true;
    rot = startRot + dx * 0.4;
    carousel.style.setProperty('--rot', rot + 'deg');
  });
  function endDrag(e) {
    if (!dragging) return;
    dragging = false;
    try { stage.releasePointerCapture(e.pointerId); } catch (_) {}
    carousel.classList.remove('dragging');
    if (dragMoved) {
      const nearest = Math.round(-rot / STEP);
      snap(nearest);
    }
    startAuto();
  }
  stage.addEventListener('pointerup', endDrag);
  stage.addEventListener('pointercancel', endDrag);

  // Buttons
  document.querySelectorAll('.c3d-nav').forEach((b) => {
    b.addEventListener('click', () => nudge(parseInt(b.dataset.dir, 10)));
  });

  // Keyboard (only when carousel is in view)
  let inView = false;
  const visIO = new IntersectionObserver((entries) => {
    for (const e of entries) inView = e.isIntersecting;
  }, { threshold: 0.3 });
  visIO.observe(stage);
  window.addEventListener('keydown', (e) => {
    if (!inView) return;
    if (e.key === 'ArrowLeft')  { e.preventDefault(); nudge(-1); }
    if (e.key === 'ArrowRight') { e.preventDefault(); nudge(1); }
  });

  // Wheel scroll (only when over the carousel)
  let wheelCool = 0;
  stage.addEventListener('wheel', (e) => {
    e.preventDefault();
    const now = Date.now();
    if (now - wheelCool < 400) return;
    wheelCool = now;
    nudge(e.deltaY > 0 ? 1 : -1);
  }, { passive: false });

  // Card click
  cards.forEach((card, i) => {
    card.addEventListener('click', (e) => {
      if (dragMoved) { dragMoved = false; return; }
      if (i !== current) { snap(i); return; }
      const href = card.dataset.href;
      if (href) {
        if (href.startsWith('mailto:')) window.location.href = href;
        else window.open(href, '_blank', 'noopener');
      }
    });
  });

  snap(0);
  startAuto();
})();

// === Konami code → matrix rain ===
(() => {
  const code = ['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','b','a'];
  let idx = 0;
  let raining = false;

  const mcv = document.getElementById('matrixCanvas');
  const mmsg = document.getElementById('matrixMsg');
  if (!mcv || !mmsg) return;
  const mctx = mcv.getContext('2d');

  const chars = 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホ0123456789ABCDEF$#%&*+=?<>{}'.split('');
  let cols = [];

  function setupCols() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    mcv.width = innerWidth * dpr;
    mcv.height = innerHeight * dpr;
    mcv.style.width = innerWidth + 'px';
    mcv.style.height = innerHeight + 'px';
    mctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const colW = 16;
    const count = Math.floor(innerWidth / colW);
    cols = Array.from({ length: count }, () => ({
      y: Math.random() * innerHeight,
      speed: 2 + Math.random() * 6,
    }));
  }

  function draw() {
    if (!raining) return;
    mctx.fillStyle = 'rgba(0, 0, 0, 0.075)';
    mctx.fillRect(0, 0, innerWidth, innerHeight);
    mctx.font = '14px "JetBrains Mono", monospace';
    for (let i = 0; i < cols.length; i++) {
      const c = cols[i];
      const ch = chars[(Math.random() * chars.length) | 0];
      const x = i * 16;
      // leading char brighter
      mctx.fillStyle = Math.random() > 0.96 ? '#cfffd9' : '#00ff88';
      mctx.fillText(ch, x, c.y);
      c.y += c.speed;
      if (c.y > innerHeight + 20) { c.y = -20; c.speed = 2 + Math.random() * 6; }
    }
    requestAnimationFrame(draw);
  }

  function activate() {
    if (raining) return;
    raining = true;
    setupCols();
    mcv.classList.add('on');
    mmsg.classList.add('on');
    requestAnimationFrame(draw);
  }
  function deactivate() {
    if (!raining) return;
    raining = false;
    mcv.classList.remove('on');
    mmsg.classList.remove('on');
    setTimeout(() => mctx.clearRect(0, 0, innerWidth, innerHeight), 500);
  }

  window.addEventListener('keydown', (e) => {
    const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    if (key === 'Escape' && raining) { deactivate(); return; }
    if (key === code[idx]) {
      idx++;
      if (idx === code.length) {
        activate();
        idx = 0;
      }
    } else {
      idx = (key === code[0]) ? 1 : 0;
    }
  });
  window.addEventListener('resize', () => { if (raining) setupCols(); }, { passive: true });
})();
