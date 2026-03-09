/* ============================================================
   PRELOADER
============================================================ */
const pbar = document.getElementById('pbar');
const pcount = document.getElementById('pcount');
const preloader = document.getElementById('preloader');

let progress = 0;
const interval = setInterval(() => {
  progress += Math.random() * 12 + 3;
  if (progress >= 100) {
    progress = 100;
    clearInterval(interval);
    setTimeout(() => {
      preloader.classList.add('hidden');
      document.body.style.overflow = '';
      triggerAnimations();
    }, 400);
  }
  pbar.style.width = progress + '%';
  pcount.textContent = Math.floor(progress) + '%';
}, 80);

document.body.style.overflow = 'hidden';

/* ============================================================
   CUSTOM CURSOR
============================================================ */

const cursor = document.getElementById('cursor');
const ring = document.getElementById('cursor-ring');
let cx = 0, cy = 0; // Cursor center
let rx = 0, ry = 0; // Ring trailing position

// Use GSAP ticker for smooth spring physics calculation
document.addEventListener('mousemove', (e) => {
  cx = e.clientX;
  cy = e.clientY;
});

// Hide cursor when leaving window
document.addEventListener('mouseleave', () => {
  gsap.to([cursor, ring], { opacity: 0, duration: 0.3 });
});
document.addEventListener('mouseenter', () => {
  gsap.to([cursor, ring], { opacity: 1, duration: 0.3 });
});

gsap.ticker.add(() => {
  // Hard set inner dot
  gsap.set(cursor, { x: cx, y: cy });
  
  // Spring physics for ring
  // delta = target - current
  const dx = cx - rx;
  const dy = cy - ry;
  
  rx += dx * 0.15; // spring tension
  ry += dy * 0.15;
  
  gsap.set(ring, { x: rx, y: ry });
});

// Hover states
const hoverElements = document.querySelectorAll('a, button, .skill-card, .project-slot');
hoverElements.forEach(el => {
  el.addEventListener('mouseenter', () => document.body.classList.add('hovering'));
  el.addEventListener('mouseleave', () => document.body.classList.remove('hovering'));
});

/* ============================================================
   THREE.JS HERO 3D SCENE
============================================================ */
function initThree() {
  const canvas = document.getElementById('three-canvas');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x000000, 0);

  // Store materials globally so they can be modified by theme toggle
  window.threeMaterials = {};

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.set(0, 0, 6);

  /* Lights */
  const ambient = new THREE.AmbientLight(0xffffff, 0.08);
  scene.add(ambient);

  const light1 = new THREE.DirectionalLight(0xffffff, 1.2);
  light1.position.set(4, 6, 4);
  scene.add(light1);

  const light2 = new THREE.DirectionalLight(0xffffff, 0.4);
  light2.position.set(-4, -4, 2);
  scene.add(light2);

  const rimLight = new THREE.PointLight(0xffffff, 0.6, 20);
  rimLight.position.set(0, 4, -3);
  scene.add(rimLight);

  /* Main sculptural object — wireframe icosahedron cage + solid inner */
  const geoInner = new THREE.IcosahedronGeometry(1.35, 2);
  const matInner = new THREE.MeshStandardMaterial({
    color: 0x101010,
    metalness: 0.9,
    roughness: 0.15,
    envMapIntensity: 1,
  });
  window.threeMaterials.inner = matInner;
  const meshInner = new THREE.Mesh(geoInner, matInner);
  scene.add(meshInner);

  const geoWire = new THREE.IcosahedronGeometry(1.6, 1);
  const matWire = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    wireframe: true,
    transparent: true,
    opacity: 0.06,
  });
  window.threeMaterials.wire = matWire;
  const meshWire = new THREE.Mesh(geoWire, matWire);
  scene.add(meshWire);

  /* Outer rings */
  const ringGroup = new THREE.Group();
  scene.add(ringGroup);

  window.threeMaterials.rings = [];

  function makeRing(radius, tube, tilt, color = 0xffffff, opacity = 0.12) {
    const geo = new THREE.TorusGeometry(radius, tube, 2, 120);
    const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity });
    window.threeMaterials.rings.push(mat);
    const m = new THREE.Mesh(geo, mat);
    m.rotation.x = tilt;
    return m;
  }

  const r1 = makeRing(2.1, 0.004, Math.PI / 3);
  const r2 = makeRing(2.4, 0.003, -Math.PI / 5, 0xffffff, 0.07);
  const r3 = makeRing(2.7, 0.002, Math.PI / 8, 0xffffff, 0.05);
  ringGroup.add(r1, r2, r3);

  /* Particle field */
  const particleCount = 280;
  const positions = new Float32Array(particleCount * 3);
  for (let i = 0; i < particleCount; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const r = 3.2 + Math.random() * 2.5;
    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = r * Math.cos(phi);
  }
  const particleGeo = new THREE.BufferGeometry();
  particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const particleMat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.018, transparent: true, opacity: 0.45 });
  window.threeMaterials.particles = particleMat;
  const particles = new THREE.Points(particleGeo, particleMat);
  scene.add(particles);

  /* Mouse parallax & Scroll Physics */
  let targetRX = 0, targetRY = 0;
  let currentRX = 0, currentRY = 0;

  document.addEventListener('mousemove', (e) => {
    targetRX = (e.clientY / window.innerHeight - 0.5) * 0.5;
    targetRY = (e.clientX / window.innerWidth - 0.5) * 0.7;
  });

  /* Animate */
  let t = 0;
  function animate() {
    requestAnimationFrame(animate);
    t += 0.004;
    
    // Add scroll velocity impact from Lenis (if available)
    let scrollVelocity = window.lenis ? window.lenis.velocity : 0;
    let scrollImpact = scrollVelocity * 0.001;

    currentRX += (targetRX - currentRX) * 0.04;
    currentRY += (targetRY - currentRY) * 0.04;

    meshInner.rotation.x = currentRX + t * 0.3 + scrollImpact;
    meshInner.rotation.y = currentRY + t * 0.5;
    meshInner.rotation.z = t * 0.15;

    meshWire.rotation.x = -t * 0.2 + scrollImpact * 1.5;
    meshWire.rotation.y = t * 0.4;

    ringGroup.rotation.y = t * 0.2 + currentRY;
    ringGroup.rotation.x = t * 0.1 + currentRX + scrollImpact * 0.5;

    particles.rotation.y = t * 0.05;
    particles.rotation.x = t * 0.03 + scrollImpact * 0.2;

    renderer.render(scene, camera);
  }
  animate();

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
}

initThree();

/* ============================================================
   THEME TOGGLE
============================================================ */
const themeToggle = document.getElementById('theme-toggle');

themeToggle.addEventListener('click', () => {
  const isLightMode = document.body.classList.toggle('light-mode');
  themeToggle.textContent = isLightMode ? 'Dark Mode' : 'Light Mode';

  // Update Three.js Colors
  if (window.threeMaterials) {
    const { inner, wire, rings, particles } = window.threeMaterials;
    
    // Light mode visuals: strong aesthetic contrast using the teal palette
    // Palette: #b2d8d8, #66b2b2, #008080, #006666, #004c4c
    const innerColor = isLightMode ? 0x008080 : 0x101010; // Mid-teal for the core
    const accentColor = isLightMode ? 0x004c4c : 0xffffff; // Darkest teal for wireframes/particles

    if (inner) {
      inner.color.setHex(innerColor);
      inner.roughness = isLightMode ? 0.1 : 0.15; // smoother core in light mode
      inner.metalness = isLightMode ? 0.5 : 0.9;
    }
    
    if (wire) {
      wire.color.setHex(accentColor);
      wire.opacity = isLightMode ? 0.3 : 0.06;
    }
    
    if (particles) {
      particles.color.setHex(accentColor);
      particles.opacity = isLightMode ? 0.6 : 0.45;
    }
    
    if (rings) {
      const darkOpacities = [0.12, 0.07, 0.05];
      const lightOpacities = [0.4, 0.25, 0.15];
      rings.forEach((mat, i) => {
        mat.color.setHex(accentColor);
        mat.opacity = isLightMode ? lightOpacities[i] : darkOpacities[i];
      });
    }
  }
});


/* ============================================================
   HERO TEXT ANIMATIONS
============================================================ */
function startHeroAnimations() {
  const heroName = document.querySelector('.hero-name');
  const heroMeta = document.querySelector('.hero-meta');
  if (heroName) {
    heroName.style.opacity = '0';
    heroName.style.transform = 'translateY(60px)';
    heroName.style.transition = 'opacity 1.2s cubic-bezier(0.16,1,0.3,1), transform 1.2s cubic-bezier(0.16,1,0.3,1)';
    setTimeout(() => {
      heroName.style.opacity = '1';
      heroName.style.transform = 'translateY(0)';
    }, 100);
  }
  if (heroMeta) {
    heroMeta.style.opacity = '0';
    heroMeta.style.transform = 'translateY(40px)';
    heroMeta.style.transition = 'opacity 1.2s cubic-bezier(0.16,1,0.3,1) 0.3s, transform 1.2s cubic-bezier(0.16,1,0.3,1) 0.3s';
    setTimeout(() => {
      heroMeta.style.opacity = '1';
      heroMeta.style.transform = 'translateY(0)';
    }, 100);
  }
}


/* ============================================================
   LENIS SMOOTH SCROLL
============================================================ */
const lenis = new Lenis({
  duration: 1.2,
  easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
  direction: 'vertical',
  gestureDirection: 'vertical',
  smooth: true,
  mouseMultiplier: 1,
  smoothTouch: false,
  touchMultiplier: 2,
});

window.lenis = lenis;

function raf(time) {
  lenis.raf(time);
  requestAnimationFrame(raf);
}
requestAnimationFrame(raf);

// Integrate Lenis with ScrollTrigger
if (typeof ScrollTrigger !== 'undefined') {
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => {
    lenis.raf(time * 1000);
  });
  gsap.ticker.lagSmoothing(0);
}

/* ============================================================
   GSAP ANIMATIONS & PARALLAX
============================================================ */
function initGSAP() {
  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;

  // Enhance Hero Reveal (Replacing simple transition)
  const heroName = document.querySelector('.hero-name');
  const heroMeta = document.querySelector('.hero-meta');
  
  if (heroName) {
    heroName.style.opacity = '1';
    heroName.style.transform = 'none';
    heroName.style.transition = 'none';
    
    // Split text by lines manually for simple effect
    const html = heroName.innerHTML;
    heroName.innerHTML = '';
    const parts = html.split('<br>');
    parts.forEach((p, i) => {
      heroName.innerHTML += `<div style='overflow:hidden; display:inline-block;'><div class='hero-line'>${p}</div></div>${i < parts.length - 1 ? '<br>' : ''}`;
    });

    gsap.fromTo('.hero-line', 
      { y: 100, opacity: 0, rotateZ: 3 },
      { y: 0, opacity: 1, rotateZ: 0, duration: 1.4, stagger: 0.15, ease: 'power4.out', delay: 0.2 }
    );
  }

  if (heroMeta) {
    heroMeta.style.opacity = '1';
    heroMeta.style.transform = 'none';
    heroMeta.style.transition = 'none';
    gsap.fromTo(heroMeta, 
      { y: 40, opacity: 0 },
      { y: 0, opacity: 1, duration: 1.2, ease: 'power3.out', delay: 0.8 }
    );
  }

  // Staggered reveals for typical sections
  const sections = document.querySelectorAll('section:not(#hero)');
  sections.forEach(sec => {
    gsap.fromTo(sec.querySelectorAll('.about-headline, .about-body, .stat-num, .stat-label, .skill-card, .projects-title, .project-slot, .content-left, .content-body, .platform-tag, .contact-big, .contact-link'),
      { y: 60, opacity: 0 },
      {
        y: 0, opacity: 1,
        duration: 1,
        stagger: 0.1,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: sec,
          start: 'top 80%',
        }
      }
    );
  });

  // Project Parallax Effect
  // Removed Y-axis parallax that was breaking the CSS grid alignment boundaries.
}

// Call init after preloader
const oldPreloaderInterval = window.pInterval || undefined;
function triggerAnimations() {
  initGSAP();
}

/* ============================================================
   MAGNETIC BUTTONS
============================================================ */
const magneticElements = document.querySelectorAll('.nav-links a, .theme-toggle, .platform-tag, .contact-link');

magneticElements.forEach(el => {
  // Wrap inner content to isolate transform from box model
  const html = el.innerHTML;
  el.innerHTML = '';
  const inner = document.createElement('span');
  inner.className = 'magnetic-inner';
  inner.innerHTML = html;
  el.appendChild(inner);
  el.classList.add('magnetic-wrap');

  el.addEventListener('mousemove', (e) => {
    const rect = el.getBoundingClientRect();
    const h = rect.width / 2;
    const w = rect.height / 2;
    const x = e.clientX - rect.left - h;
    const y = e.clientY - rect.top - w;
    
    // Smooth, snappy pull
    inner.style.transform = `translate(${x * 0.3}px, ${y * 0.3}px)`;
  });

  el.addEventListener('mouseleave', () => {
    inner.style.transform = 'translate(0px, 0px)';
  });
});
