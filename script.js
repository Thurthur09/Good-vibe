(() => {
  const root = document.documentElement;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasGsap = typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';
  const finePointer = window.matchMedia('(pointer: fine)').matches;
  if (reduced || !hasGsap) root.classList.add('no-motion');

  /* ---------- Nav ---------- */
  const nav = document.getElementById('nav');
  const burger = document.getElementById('burger');
  const floatCta = document.querySelector('.float-cta');
  const progress = document.querySelector('.progress');
  const onScroll = () => {
    const y = window.scrollY;
    nav.classList.toggle('scrolled', y > 40);
    const rdvTop = document.getElementById('rdv').getBoundingClientRect().top;
    floatCta.classList.toggle('show', y > window.innerHeight * 0.9 && rdvTop > window.innerHeight * 0.6);
    const max = document.documentElement.scrollHeight - window.innerHeight;
    progress.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
  // Barre claire au-dessus des sections claires
  const lightSections = document.querySelectorAll('.light, .kids');
  const checkLight = () => {
    const y = 40;
    nav.classList.toggle('on-light', [...lightSections].some(s => { const r = s.getBoundingClientRect(); return r.top <= y && r.bottom >= y; }));
  };
  window.addEventListener('scroll', checkLight, { passive: true });
  checkLight();
  const setMenu = open => {
    nav.classList.toggle('open', open);
    burger.setAttribute('aria-expanded', open);
    burger.setAttribute('aria-label', open ? 'Fermer le menu' : 'Menu');
    document.body.style.overflow = open ? 'hidden' : '';
  };
  burger.addEventListener('click', () => setMenu(!nav.classList.contains('open')));
  document.querySelectorAll('#navLinks a').forEach(a => a.addEventListener('click', () => setMenu(false)));
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && nav.classList.contains('open')) setMenu(false); });
  window.addEventListener('resize', () => { if (innerWidth > 900 && nav.classList.contains('open')) setMenu(false); });

  /* ---------- Halo qui suit la souris ---------- */
  const glow = document.querySelector('.cursor-glow');
  if (finePointer && !reduced) {
    let gx = innerWidth / 2, gy = innerHeight / 2, tx = gx, ty = gy;
    window.addEventListener('pointermove', e => { tx = e.clientX; ty = e.clientY; glow.style.opacity = 1; }, { passive: true });
    (function loop() {
      gx += (tx - gx) * 0.12; gy += (ty - gy) * 0.12;
      glow.style.transform = `translate(${gx}px, ${gy}px)`;
      requestAnimationFrame(loop);
    })();
  }

  /* ---------- Ondes de résonance (canvas) ---------- */
  function resonance(canvas, opts) {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const o = Object.assign({ lines: 9, stars: 110, base: 0.68, spread: 0.2 }, opts);
    let w, h, dpr, stars = [], t = 0, visible = true;
    const mouse = { x: 0.7, y: 0.5, tx: 0.7, ty: 0.5 };

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth; h = canvas.clientHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      stars = Array.from({ length: Math.round(o.stars * Math.min(1, w / 1200)) + 30 }, () => ({
        x: Math.random() * w, y: Math.random() * h * 0.75, r: Math.random() * 1.3 + 0.2,
        p: Math.random() * Math.PI * 2, s: 0.5 + Math.random() * 1.5
      }));
    }
    function draw() {
      ctx.clearRect(0, 0, w, h);
      mouse.x += (mouse.tx - mouse.x) * 0.05;
      mouse.y += (mouse.ty - mouse.y) * 0.05;

      for (const s of stars) {
        const a = 0.25 + 0.55 * (0.5 + 0.5 * Math.sin(t * s.s + s.p));
        ctx.fillStyle = `rgba(255,240,225,${a})`;
        ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2); ctx.fill();
      }

      for (let i = 0; i < o.lines; i++) {
        const k = i / (o.lines - 1);
        const baseY = h * (o.base + (k - 0.5) * o.spread);
        const grad = ctx.createLinearGradient(0, 0, w, 0);
        grad.addColorStop(0, `rgba(123,108,246,${0.05 + k * 0.25})`);
        grad.addColorStop(0.5, `rgba(240,169,154,${0.25 + k * 0.4})`);
        grad.addColorStop(1, `rgba(233,194,127,${0.08 + k * 0.25})`);
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1 + k * 0.6;
        ctx.beginPath();
        for (let x = 0; x <= w; x += 6) {
          const nx = x / w;
          const d = Math.exp(-Math.pow((nx - mouse.x) * 3.2, 2));
          const amp = (14 + 40 * d * (0.6 + mouse.y)) * (0.6 + k * 0.6);
          const y = baseY
            + Math.sin(nx * 9 + t * 1.1 + i * 0.55) * amp * 0.6
            + Math.sin(nx * 23 - t * 1.7 + i) * amp * 0.25 * d
            + Math.sin(nx * 3 + t * 0.4) * 10;
          x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
    }
    function loop() {
      if (visible) { t += 0.012; draw(); }
      requestAnimationFrame(loop);
    }
    resize();
    window.addEventListener('resize', resize);
    canvas.parentElement.addEventListener('pointermove', e => {
      const r = canvas.getBoundingClientRect();
      mouse.tx = (e.clientX - r.left) / r.width;
      mouse.ty = (e.clientY - r.top) / r.height;
    }, { passive: true });
    new IntersectionObserver(([en]) => { visible = en.isIntersecting; }).observe(canvas);
    if (reduced) draw(); else loop();
  }
  resonance(document.getElementById('waves'));
  resonance(document.getElementById('waves2'), { lines: 7, stars: 60, base: 0.55, spread: 0.5 });

  /* ---------- Portail du hero qui suit la souris ---------- */
  const portal = document.getElementById('heroPortal');
  if (finePointer && !reduced && portal) {
    document.querySelector('.hero').addEventListener('pointermove', e => {
      const dx = (e.clientX / innerWidth - 0.5), dy = (e.clientY / innerHeight - 0.5);
      if (hasGsap) gsap.to(portal, { x: dx * -24, y: dy * -24, rotationX: dy * 6, rotationY: dx * -6, duration: 1.2, ease: 'power3.out' });
    });
  }

  /* ---------- Cartes inclinables ---------- */
  if (finePointer && !reduced) {
    document.querySelectorAll('.tilt').forEach(el => {
      el.addEventListener('pointermove', e => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
        el.style.transform = `perspective(900px) rotateX(${y * -7}deg) rotateY(${x * 7}deg) translateY(-6px)`;
      });
      el.addEventListener('pointerleave', () => { el.style.transform = ''; });
    });
    /* Boutons magnétiques */
    document.querySelectorAll('.magnetic').forEach(el => {
      el.addEventListener('pointermove', e => {
        const r = el.getBoundingClientRect();
        el.style.setProperty('--mx', `${(e.clientX - r.left - r.width / 2) * 0.25}px`);
        el.style.setProperty('--my', `${(e.clientY - r.top - r.height / 2) * 0.35}px`);
      });
      el.addEventListener('pointerleave', () => { el.style.setProperty('--mx', '0px'); el.style.setProperty('--my', '0px'); });
    });
  }

  /* ---------- Modal de réservation ---------- */
  const modal = document.getElementById('calModal');
  const frame = document.getElementById('calFrame');
  document.querySelectorAll('[data-cal]').forEach(b => b.addEventListener('click', () => {
    document.getElementById('calTitle').textContent = 'Réserver – ' + b.dataset.title;
    frame.src = b.dataset.cal;
    modal.classList.add('open'); modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }));
  const closeModal = () => {
    modal.classList.remove('open'); modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  };
  modal.querySelectorAll('[data-close]').forEach(b => b.addEventListener('click', closeModal));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

  /* ---------- Compteurs ---------- */
  const counters = document.querySelectorAll('.count');
  const runCount = el => {
    const to = +el.dataset.to, from = to > 1000 ? to - 40 : 0, start = performance.now(), dur = 1600;
    const step = now => {
      const p = Math.min(1, (now - start) / dur), e = 1 - Math.pow(1 - p, 4);
      el.textContent = Math.round(from + (to - from) * e);
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
  if (!reduced) {
    const io = new IntersectionObserver(entries => entries.forEach(en => {
      if (en.isIntersecting) { runCount(en.target); io.unobserve(en.target); }
    }), { threshold: 0.6 });
    counters.forEach(c => io.observe(c));
  }

  /* ---------- Étapes de la transe (sans GSAP aussi) ---------- */
  const steps = document.querySelectorAll('.depth-step');
  if (!root.classList.contains('no-motion')) {
    const sio = new IntersectionObserver(entries => entries.forEach(en => {
      en.target.classList.toggle('on', en.isIntersecting || en.boundingClientRect.top < 0);
    }), { rootMargin: '0px 0px -45% 0px' });
    steps.forEach(s => sio.observe(s));
  }

  if (root.classList.contains('no-motion')) return;

  /* =================== GSAP =================== */
  gsap.registerPlugin(ScrollTrigger);

  // Intro du hero
  const intro = gsap.timeline({ defaults: { ease: 'expo.out' } });
  intro
    .from('.hero-title .w', { yPercent: 115, rotate: 4, duration: 1.4, stagger: 0.07 }, 0.15)
    .from('.hero .reveal-up', { y: 30, opacity: 0, duration: 1.2, stagger: 0.12 }, 0.5)
    .from('.hero-portal', { scale: 0.6, opacity: 0, duration: 2, ease: 'expo.out' }, 0.2)
    .from('.nav', { y: -30, opacity: 0, duration: 1, clearProps: 'transform,opacity' }, 0.6);

  // Le hero s'éloigne quand on descend
  gsap.to('.hero-inner', {
    yPercent: -18, opacity: 0.2, ease: 'none',
    scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true }
  });

  // Apparitions au défilement
  gsap.utils.toArray('.reveal-up').forEach(el => {
    if (el.closest('.hero')) return;
    gsap.from(el, {
      y: 50, opacity: 0, duration: 1.1, ease: 'expo.out',
      scrollTrigger: { trigger: el, start: 'top 88%', once: true }
    });
  });

  // Texte qui s'allume mot à mot
  document.querySelectorAll('.scrub-text').forEach(p => {
    p.innerHTML = p.textContent.trim().split(/\s+/).map(w => `<span class="sw">${w}</span>`).join(' ');
    gsap.to(p.querySelectorAll('.sw'), {
      opacity: 1, stagger: 0.1, ease: 'none',
      scrollTrigger: { trigger: p, start: 'top 80%', end: 'bottom 45%', scrub: true }
    });
  });

  // Portail qui s'ouvre en plein écran
  const ex = gsap.timeline({
    scrollTrigger: { trigger: '.expand', start: 'top top', end: 'bottom bottom', scrub: 0.6 }
  });
  ex.fromTo('.expand-media', { clipPath: 'circle(14% at 50% 50%)' }, { clipPath: 'circle(75% at 50% 50%)', ease: 'power2.inOut', duration: 1 })
    .fromTo('.expand-media img', { scale: 1.3 }, { scale: 1, ease: 'none', duration: 1 }, 0)
    .to('.expand-veil', { opacity: 1, duration: 0.4 }, 0.6)
    .fromTo('.expand-copy', { opacity: 0, y: 60 }, { opacity: 1, y: 0, duration: 0.4 }, 0.7)
    .to({}, { duration: 0.35 });

  // Ligne de profondeur de la transe
  gsap.to('.depth-fill', {
    scaleY: 1, ease: 'none',
    scrollTrigger: { trigger: '.depth', start: 'top 60%', end: 'bottom 60%', scrub: true }
  });

  // Parallaxe des images
  gsap.utils.toArray('.parallax').forEach(img => {
    gsap.fromTo(img, { yPercent: -8 }, {
      yPercent: 8, ease: 'none',
      scrollTrigger: { trigger: img.closest('section, .parallax-wrap') || img, start: 'top bottom', end: 'bottom top', scrub: true }
    });
  });

  // Titre Voyages qui s'élargit
  gsap.from('.voy-hero .huge', {
    letterSpacing: '-0.08em', opacity: 0, ease: 'expo.out', duration: 1.6,
    scrollTrigger: { trigger: '.voy-hero', start: 'top 60%', once: true }
  });

  // Les deux disques Hypnose / Biorésonance se rejoignent
  gsap.fromTo('.disc.a', { x: -140 }, { x: 0, ease: 'none', scrollTrigger: { trigger: '.combo', start: 'top 85%', end: 'top 30%', scrub: true } });
  gsap.fromTo('.disc.b', { x: 140 }, { x: 0, ease: 'none', scrollTrigger: { trigger: '.combo', start: 'top 85%', end: 'top 30%', scrub: true } });

  // La lumière derrière la porte s'ouvre
  gsap.fromTo('.door-glow', { scaleX: 0.05, opacity: 0.3 }, {
    scaleX: 3.2, opacity: 1, ease: 'none',
    scrollTrigger: { trigger: '.doors', start: 'top 70%', end: 'center center', scrub: true }
  });

  window.addEventListener('load', () => ScrollTrigger.refresh());
})();
