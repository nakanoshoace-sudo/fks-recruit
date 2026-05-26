/* ==========================================================
   伏見管理サービス 採用サイト  —  JS v8 (giftee-exact animation)
   ========================================================== */

document.documentElement.classList.add('js');

document.addEventListener('DOMContentLoaded', () => {

  /* ══════════════════════════════════════════════════════════
     1. SCROLL HEADER
     ══════════════════════════════════════════════════════════ */
  const scrollHeader = document.getElementById('scrollHeader');
  const scrollInd = document.querySelector('.scroll-indicator');
  const heroEl = document.querySelector('.hero');
  const subTopNav = document.querySelector('.sub-top-nav');
  const isSubpage = document.documentElement.classList.contains('page--sub');
  const onScroll = () => {
    const y = window.scrollY;
    const triggerH = heroEl ? heroEl.offsetHeight * 0.7
                   : subTopNav ? subTopNav.offsetHeight * 0.6
                   : 300;
    if (scrollHeader) {
      scrollHeader.classList.toggle('visible', y > triggerH);
    }
    if (scrollInd) scrollInd.classList.toggle('hidden', y > 300);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ══════════════════════════════════════════════════════════
     2. HERO — logo, nav, tagline, body animations
     ══════════════════════════════════════════════════════════ */

  // 2a. Logo fade-in (giftee: fadeinOpacity 1.2s, delay 0.1s)
  const heroLogo = document.querySelector('.hero-logo');
  if (heroLogo) {
    heroLogo.style.opacity = '0';
    heroLogo.style.animation = 'fadeinOpacity 1.2s cubic-bezier(.39,.575,.565,1) .1s forwards';
  }

  // 2b. Hero side-nav items — stagger slide-in (giftee: fadeinNavItem 1.7s, stagger 0.1s)
  document.querySelectorAll('.hero-sidenav a').forEach((el, i) => {
    el.style.opacity = '0';
    el.style.transform = 'translateX(15px)';
    el.style.animation = `fadeinNavItem 1.7s cubic-bezier(.19,1,.22,1) ${0.2 + i * 0.1}s forwards`;
  });

  // 2c. Hero CTA buttons — fade in
  document.querySelectorAll('.hero-right-col .hero-cta').forEach((el, i) => {
    el.style.opacity = '0';
    el.style.animation = `fadeinOpacity 1s cubic-bezier(.39,.575,.565,1) ${0.3 + i * 0.15}s forwards`;
  });

  // 2d. Tagline character animation (giftee-exact: transition-based)
  const vchars = document.querySelectorAll('.vchar');
  vchars.forEach((el) => {
    const idx = parseInt(el.style.getPropertyValue('--i')) || 0;
    const delay = 0.5 + idx * 0.09;
    el.style.transitionDelay = `${delay}s, ${delay}s, ${delay}s`;
  });
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      vchars.forEach(el => el.classList.add('vchar--in'));
    });
  });
  // Accent "探求" color handled by noiseTextClip (background-image animation)
  // No CSS color transition needed — -webkit-text-fill-color:transparent hides CSS color

  // 2e. Hero body text — slideUp with blur (giftee-style)
  const heroBody = document.querySelector('.hero-body');
  const heroLeftCol = document.querySelector('.hero-left-col');
  const heroRightCol = document.querySelector('.hero-right-col');
  [heroBody].forEach(el => {
    if (!el) return;
    el.style.opacity = '0';
    el.style.filter = 'blur(6px)';
    el.style.transform = 'translateY(20px)';
    el.style.transition = 'opacity 1.8s ease .8s, filter 1.8s ease .8s, transform 1.8s cubic-bezier(.19,1,.22,1) .8s';
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        el.style.opacity = '1';
        el.style.filter = 'blur(0)';
        el.style.transform = 'translateY(0)';
      });
    });
  });

  // 2f. Scroll indicator — fade in late
  if (scrollInd) {
    scrollInd.style.opacity = '0';
    scrollInd.style.animation = 'fadeinOpacity .8s ease 1.8s forwards';
  }

  /* ══════════════════════════════════════════════════════════
     3. SCROLL REVEAL — giftee-style per-element types
        .anim-up        → translateY + opacity (default)
        .anim-up--blur  → + blur
        .anim-up--mask  → clip-path mask top-to-bottom
        .anim-up--scale → scale(0.95) + opacity
     ══════════════════════════════════════════════════════════ */
  const allAnimUp = document.querySelectorAll('.anim-up');

  // Set staggered delays per parent section
  const sections = document.querySelectorAll('.sec, .ws-child');
  sections.forEach(sec => {
    const children = sec.querySelectorAll('.anim-up');
    children.forEach((el, i) => {
      el.style.transitionDelay = `${Math.min(i * 0.08, 0.48)}s`;
    });
  });

  const revealEl = (el) => {
    if (!el.classList.contains('visible')) el.classList.add('visible');
  };

  // IntersectionObserver
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          revealEl(entry.target);
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px 400px 0px', threshold: 0.01 });
    allAnimUp.forEach(el => io.observe(el));
  }

  // Fallback scroll check
  const revealCheck = () => {
    const vh = window.innerHeight;
    allAnimUp.forEach(el => {
      if (el.classList.contains('visible')) return;
      const rect = el.getBoundingClientRect();
      if (rect.top < vh + 120 && rect.bottom > -120) revealEl(el);
    });
  };
  window.addEventListener('scroll', revealCheck, { passive: true });
  window.addEventListener('resize', revealCheck, { passive: true });
  revealCheck();
  setTimeout(revealCheck, 600);
  setTimeout(revealCheck, 1500);
  setTimeout(() => {
    allAnimUp.forEach(el => revealEl(el));
  }, 3000);

  /* ══════════════════════════════════════════════════════════
     4. IMAGE LAZY LOAD — fade-in on complete
     ══════════════════════════════════════════════════════════ */
  document.querySelectorAll('img[loading="lazy"]').forEach(img => {
    // Don't re-apply if already handled
    if (img.classList.contains('img-loaded')) return;
    const markLoaded = () => {
      img.classList.add('img-loaded');
      // For photos inside clip-mask containers
      const parent = img.closest('.anim-up--mask');
      if (parent) parent.classList.add('mask-ready');
    };
    if (img.complete && img.naturalWidth > 0) {
      markLoaded();
    } else {
      img.addEventListener('load', markLoaded, { once: true });
      img.addEventListener('error', markLoaded, { once: true });
    }
  });

  /* ══════════════════════════════════════════════════════════
     5. MOBILE MENU
     ══════════════════════════════════════════════════════════ */
  const mm = document.getElementById('mobileMenu');
  const openBtn = document.getElementById('hamburger');
  const closeBtn = document.getElementById('mobileClose');
  const toggle = (show) => {
    mm.classList.toggle('open', show);
    document.body.style.overflow = show ? 'hidden' : '';
  };
  openBtn?.addEventListener('click', () => toggle(true));
  closeBtn?.addEventListener('click', () => toggle(false));
  mm?.querySelector('.mobile-menu__overlay')?.addEventListener('click', () => toggle(false));
  mm?.querySelectorAll('a').forEach(a => a.addEventListener('click', () => toggle(false)));

  /* ══════════════════════════════════════════════════════════
     6. FAQ ACCORDION
     ══════════════════════════════════════════════════════════ */
  document.querySelectorAll('.faq-q').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = btn.closest('.faq-item');
      const wasOpen = item.classList.contains('open');
      document.querySelectorAll('.faq-item').forEach(i => {
        i.classList.remove('open');
        i.querySelector('.faq-q').setAttribute('aria-expanded', 'false');
      });
      if (!wasOpen) {
        item.classList.add('open');
        btn.setAttribute('aria-expanded', 'true');
      }
    });
  });

  /* ══════════════════════════════════════════════════════════
     7. SMOOTH SCROLL
     ══════════════════════════════════════════════════════════ */
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const href = a.getAttribute('href');
      if (href === '#') return;
      const target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY - 72, behavior: 'smooth' });
      }
    });
  });

  /* ══════════════════════════════════════════════════════════
     8. HERO CANVAS
     ══════════════════════════════════════════════════════════ */
  const canvas = document.getElementById('heroCanvas');
  if (canvas) heroCanvas(canvas);

  /* ══════════════════════════════════════════════════════════
     9. ABOUT PAGE — card scroll reveal + image load
     ══════════════════════════════════════════════════════════ */
  const aboutCards = document.querySelectorAll('.anim--card');
  if (aboutCards.length) {
    const cardIO = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          cardIO.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px 400px 0px', threshold: 0.01 });
    aboutCards.forEach(el => cardIO.observe(el));
    // Fallback: ensure all cards visible after 2s
    setTimeout(() => { aboutCards.forEach(el => el.classList.add('in-view')); }, 2000);
  }
  document.querySelectorAll('.about-card__circle img').forEach(img => {
    const markLoaded = () => img.classList.add('loaded');
    if (img.complete && img.naturalWidth > 0) markLoaded();
    else {
      img.addEventListener('load', markLoaded, { once: true });
      img.addEventListener('error', markLoaded, { once: true });
    }
  });

  /* ══════════════════════════════════════════════════════════
     10. SECTION TITLE — slideUp + blur on scroll
         (initial hidden state handled by CSS:
          html.js .anim-up.anim-up--title { opacity:0; ... }
          Reveal via .visible class addition by IntersectionObserver)
     ══════════════════════════════════════════════════════════ */

  /* ══════════════════════════════════════════════════════════
     11. PARALLAX PHOTO SECTIONS — subtle scroll parallax
     ══════════════════════════════════════════════════════════ */
  const parallaxEls = document.querySelectorAll('[data-parallax]');
  if (parallaxEls.length) {
    const onParallax = () => {
      const scrollY = window.scrollY;
      parallaxEls.forEach(el => {
        const rect = el.getBoundingClientRect();
        const speed = parseFloat(el.dataset.parallax) || 0.08;
        const offset = (rect.top + rect.height / 2 - window.innerHeight / 2) * speed;
        el.style.transform = `translateY(${offset}px)`;
      });
    };
    window.addEventListener('scroll', onParallax, { passive: true });
  }
  /* ══════════════════════════════════════════════════════════
     12. NOISE PLATE — giftee astro-noise-plate reproduction
     ══════════════════════════════════════════════════════════ */
  const noiseTargets = document.querySelectorAll('.vchar--noise-target');
  if (noiseTargets.length) {
    noiseTextClip(noiseTargets, {
      width: 40,
      height: 40,
      durationMs: 400,
      delayMs: 1500,
      startHex: '#ffffff',
      endHex: '#2A5C52',
    });
  }

  /* ══════════════════════════════════════════════════════════
     OFFICE SLIDER (auto-scroll infinite loop + prev/next skip)
     ══════════════════════════════════════════════════════════ */
  const sliderTrack = document.getElementById('officeSlider');
  const prevBtn = document.getElementById('officePrev');
  const nextBtn = document.getElementById('officeNext');
  if (sliderTrack && prevBtn && nextBtn) {
    const slideW = () => {
      const slide = sliderTrack.querySelector('.wsp-slider__slide');
      if (!slide) return 800;
      return slide.offsetWidth + parseInt(getComputedStyle(sliderTrack.querySelector('.wsp-slider__items')).gap || '27');
    };
    // Skip forward/back by adjusting animation delay
    const skipSlider = (direction) => {
      const computed = getComputedStyle(sliderTrack);
      const duration = parseFloat(computed.animationDuration) || 50;
      const totalWidth = sliderTrack.scrollWidth / 2;
      const skipPx = slideW();
      const skipTime = (skipPx / totalWidth) * duration;
      // Pause, adjust delay, resume
      sliderTrack.style.animationPlayState = 'paused';
      const current = parseFloat(computed.animationDelay) || 0;
      sliderTrack.style.animationDelay = (current - direction * skipTime) + 's';
      requestAnimationFrame(() => {
        sliderTrack.style.animationPlayState = 'running';
      });
    };
    prevBtn.addEventListener('click', () => skipSlider(-1));
    nextBtn.addEventListener('click', () => skipSlider(1));
  }

  /* ══════════════════════════════════════════════════════════
     BAR CHART ANIMATION (fill bars on visible)
     ══════════════════════════════════════════════════════════ */
  const barFills = document.querySelectorAll('.wsp-bar__fill');
  if (barFills.length) {
    const barObs = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          const pct = e.target.dataset.pct || '0';
          e.target.style.width = pct + '%';
          barObs.unobserve(e.target);
        }
      });
    }, { rootMargin: '0px 0px -50px 0px' });
    barFills.forEach(b => barObs.observe(b));
  }

  /* ══════════════════════════════════════════════════════════
     DATA CARD FADE-IN (data-fade attribute)
     ══════════════════════════════════════════════════════════ */
  const fadeCards = document.querySelectorAll('[data-fade]');
  if (fadeCards.length) {
    const fadeObs = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('visible');
          fadeObs.unobserve(e.target);
        }
      });
    }, { rootMargin: '0px 0px -80px 0px' });
    fadeCards.forEach(c => fadeObs.observe(c));
  }

});

/* ══════════════════════════════════════════════════════════
   NOISE TEXT CLIP — Perlin noise rendered into background-image,
   clipped to letter shape via background-clip:text.
   Pre-generates all frames upfront, then plays via setInterval.
   ══════════════════════════════════════════════════════════ */
function noiseTextClip(targets, opts) {
  const w = opts.width ?? 40;
  const h = opts.height ?? 40;
  const dur = opts.durationMs ?? 1200;
  const delay = opts.delayMs ?? 0;
  const startHex = opts.startHex ?? '#1a1a1a';
  const endHex = opts.endHex ?? '#5BA899';
  const totalFrames = 20;

  const offCanvas = document.createElement('canvas');
  offCanvas.width = w;
  offCanvas.height = h;
  const ctx = offCanvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return;

  const startC = hexToRgb(startHex);
  const endC = hexToRgb(endHex);

  // Pre-compute 2D noise field
  const noiseField = new Float32Array(w * h);
  const seed1 = Math.random() * 1e9 | 0;
  const scale = 3.2;
  for (let y = 0; y < h; y++) {
    const ny = y / h * scale;
    for (let x = 0; x < w; x++) {
      noiseField[y * w + x] = fbm2d(x / w * scale, ny, seed1, 4);
    }
  }

  const thresh = 0.035;
  const arr = [...targets];
  const imgData = ctx.createImageData(w, h);
  const pixels = imgData.data;

  // Pre-generate all frames as dataURLs
  const frames = [];
  for (let f = 0; f <= totalFrames; f++) {
    const t = f / totalFrames;
    let idx = 0;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const nVal = noiseField[idx];
        const lerp = 1 - smoothstep(t - thresh, t + thresh, nVal);
        pixels[idx * 4 + 0] = clampByte(mix(startC.r, endC.r, lerp));
        pixels[idx * 4 + 1] = clampByte(mix(startC.g, endC.g, lerp));
        pixels[idx * 4 + 2] = clampByte(mix(startC.b, endC.b, lerp));
        pixels[idx * 4 + 3] = 255;
        idx++;
      }
    }
    ctx.putImageData(imgData, 0, 0);
    frames.push(offCanvas.toDataURL('image/jpeg', 0.8));
  }

  // Set initial frame
  arr.forEach(el => { el.style.backgroundImage = 'url(' + frames[0] + ')'; });

  // Play back after delay
  setTimeout(function() {
    var current = 0;
    var interval = dur / totalFrames;
    var timer = setInterval(function() {
      current++;
      if (current >= frames.length) {
        clearInterval(timer);
        arr.forEach(function(el) {
          el.style.backgroundImage = 'linear-gradient(' + endHex + ',' + endHex + ')';
        });
        return;
      }
      arr.forEach(function(el) {
        el.style.backgroundImage = 'url(' + frames[current] + ')';
      });
    }, interval);
  }, delay);
}

// ── Noise helpers ──
function fbm2d(x, y, seed, octaves) {
  let sum = 0, amp = 0.5, freq = 1, total = 0;
  for (let i = 0; i < octaves; i++) {
    sum += amp * noise2d(x * freq, y * freq, seed + i * 1013);
    total += amp;
    amp *= 0.5;
    freq *= 2;
  }
  return sum / total;
}
function fbm3d(x, y, z, seed, octaves) {
  let sum = 0, amp = 0.5, freq = 1, total = 0;
  for (let i = 0; i < octaves; i++) {
    sum += amp * noise3d(x * freq, y * freq, z * freq, seed + i * 1013);
    total += amp;
    amp *= 0.5;
    freq *= 2;
  }
  return sum / total;
}
function noise2d(x, y, seed) {
  const ix = Math.floor(x), iy = Math.floor(y);
  const fx = smootherstep(x - ix), fy = smootherstep(y - iy);
  const a = hash2d(ix, iy, seed), b = hash2d(ix + 1, iy, seed);
  const c = hash2d(ix, iy + 1, seed), d = hash2d(ix + 1, iy + 1, seed);
  return mix(mix(a, b, fx), mix(c, d, fx), fy);
}
function noise3d(x, y, z, seed) {
  const ix = Math.floor(x), iy = Math.floor(y), iz = Math.floor(z);
  const fx = smootherstep(x - ix), fy = smootherstep(y - iy), fz = smootherstep(z - iz);
  const a = hash3d(ix, iy, iz, seed), b = hash3d(ix+1, iy, iz, seed);
  const c = hash3d(ix, iy+1, iz, seed), d = hash3d(ix+1, iy+1, iz, seed);
  const e = hash3d(ix, iy, iz+1, seed), f = hash3d(ix+1, iy, iz+1, seed);
  const g = hash3d(ix, iy+1, iz+1, seed), h = hash3d(ix+1, iy+1, iz+1, seed);
  const ab = mix(a, b, fx), cd = mix(c, d, fx);
  const ef = mix(e, f, fx), gh = mix(g, h, fx);
  return mix(mix(ab, cd, fy), mix(ef, gh, fy), fz);
}
function hash2d(x, y, seed) {
  let h = seed | 0;
  h ^= Math.imul(x, 374761393);
  h ^= Math.imul(y, 668265263);
  h = hashMix(h);
  return (h & 0x0FFFFFFF) / 0x10000000;
}
function hash3d(x, y, z, seed) {
  let h = seed | 0;
  h ^= Math.imul(x, 374761393);
  h ^= Math.imul(y, 668265263);
  h ^= Math.imul(z, 2147483647);
  h = hashMix(h);
  return (h & 0x0FFFFFFF) / 0x10000000;
}
function hashMix(v) {
  v ^= v >>> 16;
  v = Math.imul(v, 2146121005);
  v ^= v >>> 15;
  v = Math.imul(v, 2221713035);
  v ^= v >>> 16;
  return v >>> 0;
}
function smootherstep(t) { return t * t * t * (t * (t * 6 - 15) + 10); }
function hexToRgb(hex) {
  const h = hex.replace('#', '').trim();
  const v = h.length === 3 ? parseInt(h.split('').map(c => c + c).join(''), 16) : parseInt(h, 16);
  return { r: (v >> 16) & 255, g: (v >> 8) & 255, b: v & 255 };
}
function clamp01(t) { return t < 0 ? 0 : t > 1 ? 1 : t; }
function clampByte(v) { return v < 0 ? 0 : v > 255 ? 255 : v | 0; }
function mix(a, b, t) { return a + (b - a) * t; }
function smoothstep(edge0, edge1, x) {
  const t = clamp01((x - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
}
function heroCanvas(canvas) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);

  function resize() {
    const rect = canvas.parentElement.getBoundingClientRect();
    const w = rect.width, h = rect.height;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
  }
  resize();
  window.addEventListener('resize', resize);

  const palette = [
    [212,237,231],[168,216,206],[237,247,244],[220,240,234],[250,252,251]
  ];
  const blobs = Array.from({ length: 5 }, (_, i) => ({
    x: Math.random(), y: Math.random(),
    vx: (Math.random() - 0.5) * 0.00015,
    vy: (Math.random() - 0.5) * 0.00015,
    r: 0.2 + Math.random() * 0.25,
    c: palette[i % palette.length]
  }));

  function draw() {
    const W = canvas.width, H = canvas.height;
    ctx.fillStyle = '#EDF7F4';
    ctx.fillRect(0, 0, W, H);
    blobs.forEach(b => {
      b.x += b.vx; b.y += b.vy;
      if (b.x < -0.3) b.x = 1.3;
      if (b.x > 1.3) b.x = -0.3;
      if (b.y < -0.3) b.y = 1.3;
      if (b.y > 1.3) b.y = -0.3;
      const cx = b.x * W, cy = b.y * H, r = b.r * Math.max(W, H);
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
      g.addColorStop(0, `rgba(${b.c[0]},${b.c[1]},${b.c[2]},.5)`);
      g.addColorStop(1, `rgba(${b.c[0]},${b.c[1]},${b.c[2]},0)`);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
    });
    requestAnimationFrame(draw);
  }
  draw();
}
