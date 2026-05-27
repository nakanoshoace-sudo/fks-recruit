/* ==========================================================
   Three.js Background — giftee-style SDF lens circles
   Adapted for 伏見管理サービス (Opal Green theme)
   ========================================================== */
(function () {
  'use strict';

  // Bail if Three.js not loaded
  if (typeof THREE === 'undefined') {
    console.warn('[bg3d] THREE not found, falling back to canvas');
    return;
  }

  // ── Config ──
  const BG_COLOR   = [1.0, 1.0, 1.0]; // #FFFFFF — pure white background
  // Allow URL param override: ?circle=8fbc8f
  const urlCircle = new URLSearchParams(window.location.search).get('circle');
  const FORE_COLOR = urlCircle
    ? [parseInt(urlCircle.slice(0,2),16)/255, parseInt(urlCircle.slice(2,4),16)/255, parseInt(urlCircle.slice(4,6),16)/255]
    : [59/255, 199/255, 129/255];   // #3BC781 default

  const ITEMS = [
    { x: 0.02, y: 0.083, size: 0.80, opacity: 1,   lensWeight: 1,    grad: 0 },  // A — main circle (giftee exact)
    { x: 0.00, y: 0.00,  size: 0.00, opacity: 0,   lensWeight: 0,    grad: 0 },  // B — disabled (giftee exact)
    { x: 0.22, y: 1.45,  size: 0.94, opacity: 1,   lensWeight: 0.25, grad: 1 },  // C — lower circle (giftee exact)
    { x: 0.00, y: 0.00,  size: 0.00, opacity: 0,   lensWeight: 0,    grad: 0 },  // White — disabled
  ];

  // ── Subpage detection: camera shifts per page (circles stay fixed) ──
  const isSubpage = document.documentElement.classList.contains('page--sub');
  const cameraOffset = { x: 0, y: 0 };
  const cameraOffsetTarget = { x: 0, y: 0 };

  // Per-page camera offsets (camera moves → circles appear to move opposite)
  // about:     camera right+down  → circles appear left+down
  // culture:   camera more right+down → circles further left+down
  // workstyle: camera right+up   → circles appear left+up
  // jobs:      camera far right (zoomed out feel) → circles appear far left
  const PAGE_OFFSETS = {
    'about':        { x: 0.20, y: -0.15 },
    'culture':      { x: 0.30, y: -0.25 },
    'workstyle':    { x: 0.25, y:  0.20 },
    'jobs':         { x: 0.40, y:  0.05 },
    'message':      { x: 0.15, y: -0.10 },
    'services':     { x: 0.20, y:  0.10 },
    'vision':       { x: 0.35, y: -0.05 },
    'newgrads':     { x: 0.25, y:  0.15 },
    'privacy':      { x: 0.20, y:  0.00 },
    'positions':    { x: 0.35, y:  0.10 },
    'front':        { x: -0.50, y: -0.30 },
    'construction': { x: -0.50, y: -0.30 },
    'admin':        { x: -0.50, y: -0.30 },
  };
  const DEFAULT_SUB_OFFSET = { x: 0.25, y: 0.00 };

  function detectPageOffset() {
    const path = window.location.pathname.replace(/.*\//, '').replace('.html', '').replace(/\/$/, '') || 'index';
    if (path === 'index' || path === '') return { x: 0, y: 0 };
    return PAGE_OFFSETS[path] || DEFAULT_SUB_OFFSET;
  }

  // ── Shaders ──
  const vertexShader = `
    varying vec2 v_texcoord;
    void main() {
      v_texcoord = uv;
      gl_Position = vec4(position, 1.0);
    }
  `;

  const fragmentShader = `
    precision highp float;
    varying vec2 v_texcoord;

    uniform vec2 u_mouse;
    uniform vec2 u_resolution;
    uniform float u_pixelRatio;
    uniform vec3 u_backColor;
    uniform vec3 u_foreColor;
    uniform float u_blurSize;
    uniform float u_time;
    uniform float u_circleSize;
    uniform float u_circleEdge;
    uniform float u_scrollOffset;
    uniform float u_scrollOffsetWhite;
    uniform float u_whiteOpacity;
    uniform float u_whiteBlurMultiplier;

    uniform float u_sizeA;
    uniform float u_opacityA;
    uniform float u_lensWeightA;
    uniform float u_gradA;
    uniform vec2 u_circleCenter;

    uniform float u_sizeB;
    uniform float u_opacityB;
    uniform float u_lensWeightB;
    uniform float u_gradB;
    uniform vec2 u_circleCenter2;

    uniform float u_sizeC;
    uniform float u_opacityC;
    uniform float u_lensWeightC;
    uniform float u_gradC;
    uniform vec2 u_circleCenter3;

    uniform float u_sizeWhite;
    uniform float u_opacityD;
    uniform float u_gradD;
    uniform vec2 u_centerWhite;

    uniform float u_noiseIntensity;
    uniform float u_noiseSize;
    uniform float u_aspectRatio;

    float sdCircle(vec2 p, float r) { return length(p) - r; }
    float smin(float a, float b, float k) {
      float h = clamp(0.5 + 0.5*(b-a)/k, 0.0, 1.0);
      return mix(b, a, h) - k*h*(1.0-h);
    }
    float hash12(vec2 p) {
      vec3 p3 = fract(vec3(p.xyx) * .1031);
      p3 += dot(p3, p3.yzx + 33.33);
      return fract((p3.x + p3.y) * p3.z);
    }
    float calcGradientMask(vec2 p, vec2 center, float radius, float type) {
      if (abs(type) < 0.1) return 1.0;
      float dx = (p.x - center.x) / max(radius, 0.001);
      float t = dx * type;
      return 1.0 - smoothstep(-0.5, 0.6, t);
    }

    void main() {
      float safeAspect = max(u_aspectRatio, 0.001);
      vec2 aspectScale = (safeAspect > 1.0) ? vec2(safeAspect, 1.0) : vec2(1.0, 1.0/safeAspect);
      vec2 p = (v_texcoord - 0.5) * aspectScale;

      vec2 normalizedMouse = (u_mouse * u_pixelRatio) / u_resolution;
      normalizedMouse.y = 1.0 - normalizedMouse.y;
      vec2 posMouse = (normalizedMouse - 0.5) * aspectScale;

      vec2 center1 = (u_circleCenter - 0.5) * aspectScale;  center1.y += u_scrollOffset;
      vec2 center2 = (u_circleCenter2 - 0.5) * aspectScale; center2.y += u_scrollOffset;
      vec2 center3 = (u_circleCenter3 - 0.5) * aspectScale; center3.y += u_scrollOffset;
      vec2 centerWhite = (u_centerWhite - 0.5) * aspectScale; centerWhite.y += u_scrollOffsetWhite;

      // Lens weights
      float dToC1 = length(posMouse - center1);
      float dToC2 = length(posMouse - center2);
      float dToC3 = length(posMouse - center3);
      float lensCutoff = 1.8;
      float lensCutoffStart = lensCutoff * 0.4;
      float epsOp = 0.001;

      float w1 = 0.0;
      if (u_sizeA >= 0.001 && u_opacityA > epsOp) {
        float fade = 1.0 - smoothstep(lensCutoffStart, lensCutoff, dToC1);
        w1 = (1.0/(dToC1+0.12))*fade*max(u_lensWeightA, 0.0);
      }
      float w2 = 0.0;
      if (u_sizeB >= 0.001 && u_opacityB > epsOp) {
        float fade = 1.0 - smoothstep(lensCutoffStart, lensCutoff, dToC2);
        w2 = (1.0/(dToC2+0.12))*fade*max(u_lensWeightB, 0.0);
      }
      float w3 = 0.0;
      if (u_sizeC >= 0.001 && u_opacityC > epsOp) {
        float fade = 1.0 - smoothstep(lensCutoffStart, lensCutoff, dToC3);
        w3 = (1.0/(dToC3+0.12))*fade*max(u_lensWeightC, 0.0);
      }

      float totalW = w1 + w2 + w3;
      float effectiveSize = u_sizeA;
      if (totalW > 0.001) {
        float pw = 8.0;
        float a = pow(max(u_sizeA,0.0),pw);
        float b = pow(max(u_sizeB,0.0),pw);
        float c = pow(max(u_sizeC,0.0),pw);
        effectiveSize = pow(max((a*w1+b*w2+c*w3)/totalW, 0.0), 1.0/pw);
      }

      float baseSize = max(max(u_sizeA, u_sizeB), u_sizeC);
      float baseFloor = 0.9;
      float ratioCap = 1.15;
      float sizeRatio = u_circleSize / max(max(baseSize, 0.001), baseFloor);
      sizeRatio = min(sizeRatio, ratioCap);

      float dynamicLens = effectiveSize * sizeRatio;
      float mouseDist = sdCircle(p - posMouse, 0.0) * 2.0;
      float sdfOrange = 1.0 - smoothstep(dynamicLens - u_circleEdge, dynamicLens + u_circleEdge, mouseDist);
      float edgeLens = max(sdfOrange, 0.001);

      float dynamicWhite = u_sizeWhite * sizeRatio;
      float sdfWhite = 1.0 - smoothstep(dynamicWhite - u_circleEdge, dynamicWhite + u_circleEdge, mouseDist);
      float edgeWhite = max(sdfWhite, 0.001);

      // SDF for each circle
      float dist1 = length(p - center1); float r1 = u_sizeA*0.5;
      float sdf1 = (u_sizeA < 0.001) ? 10.0 : dist1 - r1;
      float dist2 = length(p - center2); float r2 = u_sizeB*0.5;
      float sdf2 = (u_sizeB < 0.001) ? 10.0 : dist2 - r2;
      float dist3 = length(p - center3); float r3 = u_sizeC*0.5;
      float sdf3 = (u_sizeC < 0.001) ? 10.0 : dist3 - r3;

      float maskA = calcGradientMask(p, center1, r1, u_gradA);
      float maskB = calcGradientMask(p, center2, r2, u_gradB);
      float maskC = calcGradientMask(p, center3, r3, u_gradC);

      float fOpA = u_opacityA * maskA;
      float fOpB = u_opacityB * maskB;
      float fOpC = u_opacityC * maskC;

      float wA = (u_sizeA < 0.001) ? 0.0 : clamp(fOpA, 0.0, 1.0);
      float wB = (u_sizeB < 0.001) ? 0.0 : clamp(fOpB, 0.0, 1.0);
      float wC = (u_sizeC < 0.001) ? 0.0 : clamp(fOpC, 0.0, 1.0);

      // White circle
      float distW = length(p - centerWhite); float rW = u_sizeWhite*0.5;
      float baseSdfW = (u_sizeWhite < 0.001) ? 10.0 : distW - rW;
      float maskD = calcGradientMask(p, centerWhite, rW, u_gradD);
      float fOpD = u_opacityD * maskD;

      // Rendering — sharp edges, no lens blur
      float edgeSharp = 0.005;
      float alpha1 = 1.0 - smoothstep(-edgeSharp, edgeSharp, sdf1);
      float fa1 = alpha1 * wA;

      float alpha2 = 1.0 - smoothstep(-edgeSharp, edgeSharp, sdf2);
      float fa2 = alpha2 * wB;

      float alpha3 = 1.0 - smoothstep(-edgeSharp, edgeSharp, sdf3);
      float fa3 = alpha3 * wC;

      float finalAlphaFore = max(fa1, max(fa2, fa3));

      float aW = 1.0 - smoothstep(-edgeSharp, edgeSharp, baseSdfW);
      float finalAlphaWhite = aW;

      // Solid color circles — no gradient
      float gradAlpha = 0.0;

      // Final mix — solid foreColor inside circles, pure white outside
      vec3 outColor = u_backColor;
      vec3 foreColor = u_foreColor;
      outColor = mix(outColor, foreColor, clamp(finalAlphaFore, 0.0, 1.0));
      outColor = mix(outColor, vec3(1.0), clamp(finalAlphaWhite * u_whiteOpacity * fOpD, 0.0, 1.0));

      // Noise
      float safeNoise = max(u_noiseSize, 0.001);
      float nv = hash12(floor(gl_FragCoord.xy/safeNoise) + mod(u_time*10.0, 1000.0));
      nv = nv*2.0 - 1.0;
      float totalInf = max(finalAlphaFore, finalAlphaWhite);
      float noiseInf = smoothstep(0.0, 0.1, clamp(totalInf, 0.0, 1.0));
      outColor += nv * u_noiseIntensity * noiseInf;

      gl_FragColor = vec4(outColor, 1.0);
    }
  `;

  // ── Setup ──
  const container = document.querySelector('.bg-fixed');
  if (!container) return;

  // Remove old 2D canvas if present
  const old2d = container.querySelector('.hero-canvas');
  if (old2d) old2d.style.display = 'none';
  // Remove old blur circle
  const oldBlur = container.querySelector('.hero-blur');
  if (oldBlur) oldBlur.style.display = 'none';

  const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.domElement.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;';
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const geometry = new THREE.PlaneGeometry(2, 2);

  // ── Uniforms ──
  const uniforms = {
    u_mouse:               { value: new THREE.Vector2(0.5, 0.5) },
    u_resolution:          { value: new THREE.Vector2(1, 1) },
    u_pixelRatio:          { value: renderer.getPixelRatio() },
    u_backColor:           { value: new THREE.Vector3(...BG_COLOR) },
    u_foreColor:           { value: new THREE.Vector3(...FORE_COLOR) },
    u_blurSize:            { value: 0.0 },
    u_time:                { value: 0 },
    u_circleSize:          { value: 0.35 },
    u_circleEdge:          { value: 0.01 },
    u_scrollOffset:        { value: 0 },
    u_scrollOffsetWhite:   { value: 0 },
    u_whiteOpacity:        { value: 0.5 },
    u_whiteBlurMultiplier: { value: 0.1 },
    u_noiseIntensity:      { value: 0.04 },
    u_noiseSize:           { value: 1.35 },
    u_aspectRatio:         { value: 1 },
    // Circle A
    u_sizeA:        { value: ITEMS[0].size },
    u_opacityA:     { value: ITEMS[0].opacity },
    u_lensWeightA:  { value: ITEMS[0].lensWeight },
    u_gradA:        { value: ITEMS[0].grad },
    u_circleCenter: { value: new THREE.Vector2(ITEMS[0].x + ITEMS[0].size*0.5, ITEMS[0].y + ITEMS[0].size*0.5) },
    // Circle B
    u_sizeB:         { value: ITEMS[1].size },
    u_opacityB:      { value: ITEMS[1].opacity },
    u_lensWeightB:   { value: ITEMS[1].lensWeight },
    u_gradB:         { value: ITEMS[1].grad },
    u_circleCenter2: { value: new THREE.Vector2(ITEMS[1].x + ITEMS[1].size*0.5, ITEMS[1].y + ITEMS[1].size*0.5) },
    // Circle C
    u_sizeC:         { value: ITEMS[2].size },
    u_opacityC:      { value: ITEMS[2].opacity },
    u_lensWeightC:   { value: ITEMS[2].lensWeight },
    u_gradC:         { value: ITEMS[2].grad },
    u_circleCenter3: { value: new THREE.Vector2(ITEMS[2].x + ITEMS[2].size*0.5, ITEMS[2].y + ITEMS[2].size*0.5) },
    // White circle
    u_sizeWhite:   { value: ITEMS[3].size },
    u_opacityD:    { value: ITEMS[3].opacity },
    u_gradD:       { value: ITEMS[3].grad },
    u_centerWhite: { value: new THREE.Vector2(0.5, 0.5) },
  };

  const material = new THREE.ShaderMaterial({ vertexShader, fragmentShader, uniforms });
  const mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);

  // ── Resize ──
  function onResize() {
    const w = container.clientWidth;
    const h = container.clientHeight;
    renderer.setSize(w, h);
    uniforms.u_resolution.value.set(w * renderer.getPixelRatio(), h * renderer.getPixelRatio());
    const ar = w / h;
    uniforms.u_aspectRatio.value = ar;

    // Scale sizes by aspect ratio
    uniforms.u_sizeA.value     = ITEMS[0].size * ar;
    uniforms.u_sizeB.value     = ITEMS[1].size * ar;
    uniforms.u_sizeC.value     = ITEMS[2].size * ar;
    uniforms.u_sizeWhite.value = ITEMS[3].size * ar;

    // Centers with camera offset applied
    uniforms.u_circleCenter.value.set(
      ITEMS[0].x + ITEMS[0].size * 0.5 - cameraOffset.x,
      1.0 - (ITEMS[0].y + ITEMS[0].size * 0.5) * ar + cameraOffset.y
    );
    uniforms.u_circleCenter2.value.set(
      ITEMS[1].x + ITEMS[1].size * 0.5 - cameraOffset.x,
      1.0 - (ITEMS[1].y + ITEMS[1].size * 0.5) * ar + cameraOffset.y
    );
    uniforms.u_circleCenter3.value.set(
      ITEMS[2].x + ITEMS[2].size * 0.5 - cameraOffset.x,
      1.0 - (ITEMS[2].y + ITEMS[2].size * 0.5) * ar + cameraOffset.y
    );
  }
  onResize();
  window.addEventListener('resize', onResize);

  // ── Mouse tracking disabled (static center) ──
  const mouseCurrent = { x: 0.5, y: 0.5 };

  // ── Scroll parallax ──
  const parallaxFactor = 0.5;
  const whiteParallaxScale = 2.5;
  window.addEventListener('scroll', () => {
    const scrollNorm = window.scrollY / (document.body.scrollHeight - window.innerHeight || 1);
    uniforms.u_scrollOffset.value = scrollNorm * parallaxFactor;
    uniforms.u_scrollOffsetWhite.value = scrollNorm * parallaxFactor * whiteParallaxScale;
  }, { passive: true });

  // ── Animate ──
  let lastTime = performance.now();
  function animate(now) {
    const dt = Math.min((now - lastTime) / 1000, 0.1);
    lastTime = now;

    // Static mouse position (cursor tracking disabled)
    uniforms.u_mouse.value.set(mouseCurrent.x, mouseCurrent.y);

    uniforms.u_time.value = now * 0.001;

    // Smooth page-transition camera animation
    lerpCamera(dt);

    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }
  requestAnimationFrame(animate);

  console.log('[bg3d] Three.js background initialized', isSubpage ? '(subpage mode)' : '(top mode)');

  // Set initial camera offset based on current page
  const initOffset = detectPageOffset();
  cameraOffset.x = initOffset.x;
  cameraOffset.y = initOffset.y;
  cameraOffsetTarget.x = initOffset.x;
  cameraOffsetTarget.y = initOffset.y;

  // Debug: expose internals
  window._bg3dDebug = { cameraOffset, cameraOffsetTarget, uniforms, ITEMS, detectPageOffset };

  // ── Expose API for Swup page transitions ──
  window._bg3dSetSubpage = function(isSub) {
    const off = detectPageOffset();
    cameraOffsetTarget.x = off.x;
    cameraOffsetTarget.y = off.y;
  };

  // Smooth camera offset lerp
  function lerpCamera(dt) {
    const speed = 2.0;
    const lf = 1 - Math.exp(-speed * dt);
    cameraOffset.x += (cameraOffsetTarget.x - cameraOffset.x) * lf;
    cameraOffset.y += (cameraOffsetTarget.y - cameraOffset.y) * lf;

    // Apply offset to all circle centers
    const ar = uniforms.u_aspectRatio.value;
    uniforms.u_circleCenter.value.set(
      ITEMS[0].x + ITEMS[0].size * 0.5 - cameraOffset.x,
      1.0 - (ITEMS[0].y + ITEMS[0].size * 0.5) * ar + cameraOffset.y
    );
    uniforms.u_circleCenter3.value.set(
      ITEMS[2].x + ITEMS[2].size * 0.5 - cameraOffset.x,
      1.0 - (ITEMS[2].y + ITEMS[2].size * 0.5) * ar + cameraOffset.y
    );
  }
})();
