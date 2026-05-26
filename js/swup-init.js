/* ==========================================================
   Swup — smooth page transition (giftee-style)
   Swup 4 core only — plugins implemented manually
   GUARD: Only initialize once (survives Swup script re-execution)
   ========================================================== */
(function () {
  // Prevent double-init on Swup page transitions (script gets re-executed)
  if (window._swupReady) return;
  window._swupReady = true;

  if (typeof Swup === 'undefined') {
    console.warn('[swup] Swup not loaded');
    return;
  }

  const swup = new Swup({
    containers: ['#swup'],
    animationSelector: '[class*="transition-"]',
    cache: true,
    linkSelector: 'a[href]:not([href^="#"]):not([href^="mailto"]):not([href^="tel"]):not([href^="javascript"]):not([data-no-swup]):not([target="_blank"])',
  });

  /* ── Manual: scroll to top on page change ── */
  swup.hooks.on('content:replace', () => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  });

  /* ── Update <html> classes ── */
  swup.hooks.on('page:view', () => {
    const htmlEl = document.documentElement;
    const hasHero = !!document.querySelector('.hero#hero');
    if (hasHero) {
      htmlEl.classList.remove('page--sub');
    } else {
      htmlEl.classList.add('page--sub');
    }
    htmlEl.classList.add('js');
  });

  /* ── Re-initialize page JS after each transition ── */
  swup.hooks.on('page:view', () => {
    reinitPage();
  });

  function reinitPage() {
    // Force-reveal all animated elements immediately
    document.querySelectorAll('.anim-up').forEach(el => el.classList.add('visible'));
    document.querySelectorAll('.anim--card').forEach(el => el.classList.add('in-view'));

    // Update Three.js background
    const isSub = document.documentElement.classList.contains('page--sub');
    if (typeof window._bg3dSetSubpage === 'function') {
      window._bg3dSetSubpage(isSub);
    }

    // Scroll header behavior
    const scrollHeader = document.getElementById('scrollHeader');
    if (scrollHeader) {
      const heroEl = document.querySelector('.hero');
      const subTopNav = document.querySelector('.sub-top-nav');
      if (heroEl || subTopNav) {
        scrollHeader.classList.remove('visible');
        const triggerEl = heroEl || subTopNav;
        const triggerRatio = heroEl ? 0.7 : 0.6;
        const checkScroll = () => {
          scrollHeader.classList.toggle('visible', window.scrollY > triggerEl.offsetHeight * triggerRatio);
        };
        window.addEventListener('scroll', checkScroll, { passive: true });
        checkScroll();
      } else {
        scrollHeader.classList.add('visible');
      }
    }

    // Scroll indicator
    const scrollInd = document.querySelector('.scroll-indicator');
    if (scrollInd) {
      scrollInd.style.opacity = '0';
      scrollInd.style.animation = 'fadeinOpacity .8s ease .3s forwards';
      const hideOnScroll = () => { scrollInd.classList.toggle('hidden', window.scrollY > 300); };
      window.addEventListener('scroll', hideOnScroll, { passive: true });
    }

    // Hero animations
    const heroLogo = document.querySelector('.hero-logo');
    if (heroLogo) {
      heroLogo.style.opacity = '0';
      heroLogo.style.animation = 'fadeinOpacity 1.2s cubic-bezier(.39,.575,.565,1) .1s forwards';
    }
    document.querySelectorAll('.hero-sidenav a').forEach((el, i) => {
      el.style.opacity = '0';
      el.style.transform = 'translateX(15px)';
      el.style.animation = `fadeinNavItem 1.7s cubic-bezier(.19,1,.22,1) ${0.2 + i * 0.1}s forwards`;
    });
    document.querySelectorAll('.hero-right-col .hero-cta').forEach((el, i) => {
      el.style.opacity = '0';
      el.style.animation = `fadeinOpacity 1s cubic-bezier(.39,.575,.565,1) ${0.3 + i * 0.15}s forwards`;
    });

    // Tagline characters
    const vchars = document.querySelectorAll('.vchar:not(.vchar--in)');
    if (vchars.length) {
      vchars.forEach(el => {
        const idx = parseInt(el.style.getPropertyValue('--i')) || 0;
        const delay = 0.5 + idx * 0.09;
        el.style.transitionDelay = `${delay}s, ${delay}s, ${delay}s`;
      });
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          vchars.forEach(el => el.classList.add('vchar--in'));
        });
      });
    }

    // Hero body text
    const heroBody = document.querySelector('.hero-body');
    if (heroBody) {
      heroBody.style.opacity = '0';
      heroBody.style.filter = 'blur(6px)';
      heroBody.style.transform = 'translateY(20px)';
      heroBody.style.transition = 'opacity 1.8s ease .8s, filter 1.8s ease .8s, transform 1.8s cubic-bezier(.19,1,.22,1) .8s';
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          heroBody.style.opacity = '1';
          heroBody.style.filter = 'blur(0)';
          heroBody.style.transform = 'translateY(0)';
        });
      });
    }

    // Scroll reveal (anim-up) — with IO + fallback
    const allAnimUp = document.querySelectorAll('.anim-up');
    allAnimUp.forEach(el => el.classList.remove('visible'));
    document.querySelectorAll('.sec, .ws-child').forEach(sec => {
      const children = sec.querySelectorAll('.anim-up');
      children.forEach((el, i) => { el.style.transitionDelay = `${Math.min(i * 0.08, 0.48)}s`; });
    });

    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            io.unobserve(entry.target);
          }
        });
      }, { rootMargin: '0px 0px 400px 0px', threshold: 0.01 });
      allAnimUp.forEach(el => io.observe(el));
    }

    const revealCheck = () => {
      const vh = window.innerHeight;
      allAnimUp.forEach(el => {
        if (el.classList.contains('visible')) return;
        const rect = el.getBoundingClientRect();
        if (rect.top < vh + 120 && rect.bottom > -120) el.classList.add('visible');
      });
    };
    window.addEventListener('scroll', revealCheck, { passive: true });
    revealCheck();
    setTimeout(revealCheck, 600);
    // Unconditional fallback — ensure nothing stays hidden
    setTimeout(() => { allAnimUp.forEach(el => el.classList.add('visible')); }, 3000);

    // Lazy images — force load after Swup transition
    document.querySelectorAll('img[loading="lazy"]').forEach(img => {
      if (!img.complete || img.naturalWidth === 0) {
        const src = img.src;
        img.removeAttribute('loading');
        img.src = '';
        img.src = src;
      }
    });

    // FAQ accordion
    document.querySelectorAll('.faq-q').forEach(btn => {
      if (btn._swupBound) return;
      btn._swupBound = true;
      btn.addEventListener('click', () => {
        const item = btn.closest('.faq-item');
        const wasOpen = item.classList.contains('open');
        document.querySelectorAll('.faq-item').forEach(i => {
          i.classList.remove('open');
          i.querySelector('.faq-q')?.setAttribute('aria-expanded', 'false');
        });
        if (!wasOpen) {
          item.classList.add('open');
          btn.setAttribute('aria-expanded', 'true');
        }
      });
    });

    // Smooth scroll for hash links
    document.querySelectorAll('#swup a[href^="#"]').forEach(a => {
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

    // About page cards
    const aboutCards = document.querySelectorAll('.anim--card:not(.in-view)');
    if (aboutCards.length && 'IntersectionObserver' in window) {
      const cardIO = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('in-view');
            cardIO.unobserve(entry.target);
          }
        });
      }, { rootMargin: '0px 0px 400px 0px', threshold: 0.01 });
      aboutCards.forEach(el => cardIO.observe(el));
      setTimeout(() => { aboutCards.forEach(el => el.classList.add('in-view')); }, 2000);
    }

    // About circle images
    document.querySelectorAll('.about-card__circle img:not(.loaded)').forEach(img => {
      const markLoaded = () => img.classList.add('loaded');
      if (img.complete && img.naturalWidth > 0) markLoaded();
      else {
        img.addEventListener('load', markLoaded, { once: true });
        img.addEventListener('error', markLoaded, { once: true });
      }
    });

    // Office slider (workstyle page)
    const sliderTrack = document.getElementById('officeSlider');
    const prevBtn = document.getElementById('officePrev');
    const nextBtn = document.getElementById('officeNext');
    if (sliderTrack && prevBtn && nextBtn) {
      const slideW = () => {
        const slide = sliderTrack.querySelector('.wsp-slider__slide');
        if (!slide) return 800;
        return slide.offsetWidth + parseInt(getComputedStyle(sliderTrack).gap || '27');
      };
      prevBtn.addEventListener('click', () => sliderTrack.scrollBy({ left: -slideW(), behavior: 'smooth' }));
      nextBtn.addEventListener('click', () => sliderTrack.scrollBy({ left: slideW(), behavior: 'smooth' }));
    }

    // Bar chart animation
    const barFills = document.querySelectorAll('.wsp-bar__fill');
    if (barFills.length) {
      const barObs = new IntersectionObserver((entries) => {
        entries.forEach(e => {
          if (e.isIntersecting) {
            e.target.style.width = (e.target.dataset.pct || '0') + '%';
            barObs.unobserve(e.target);
          }
        });
      }, { rootMargin: '0px 0px -50px 0px' });
      barFills.forEach(b => barObs.observe(b));
    }

    // Data card fade-in
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

    // Noise text clip re-init (skip if already running from main.js initial load)
    const noiseTargets = document.querySelectorAll('.vchar--noise-target');
    if (noiseTargets.length && typeof noiseTextClip === 'function') {
      const alreadyApplied = noiseTargets[0].style.backgroundImage && noiseTargets[0].style.backgroundImage !== 'none';
      if (!alreadyApplied) {
        noiseTargets.forEach(el => { el.style.backgroundImage = ''; });
        noiseTextClip(noiseTargets, {
          width: 40, height: 40,
          durationMs: 400, delayMs: 1500,
          startHex: '#ffffff', endHex: '#2A5C52',
        });
      }
    }
  }

  // Expose for external use
  window._swupInstance = swup;
})();
