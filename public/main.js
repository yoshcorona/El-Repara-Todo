    // ============================================
    // THREE.JS UNIVERSE EFFECT WITH SHOOTING STARS
    // ============================================
    (function () {
      const canvas = document.getElementById('particle-canvas');
      if (!canvas) return;

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 3000);
      const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });

      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

      camera.position.z = 600;

      const isMobile = window.innerWidth < 640;
      const particleCount = isMobile ? 1600 : 3500;
      const positions = new Float32Array(particleCount * 3);
      const colors = new Float32Array(particleCount * 3);
      const particleData = [];

      // Color palette - universe colors
      const colorPalette = [
        { r: 0.204, g: 0.827, b: 0.6 },   // mint
        { r: 0.376, g: 0.647, b: 0.98 },  // blue
        { r: 0.655, g: 0.545, b: 0.98 },  // violet
        { r: 0.984, g: 0.749, b: 0.141 }, // amber
        { r: 1, g: 1, b: 1 },             // white stars
        { r: 0.6, g: 0.9, b: 1 },         // light cyan
      ];

      // Create particles spread across entire screen
      for (let i = 0; i < particleCount; i++) {
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        const radius = Math.random() * 700 + 150;

        const x = radius * Math.sin(phi) * Math.cos(theta);
        const y = radius * Math.sin(phi) * Math.sin(theta);
        const z = Math.min(radius * Math.cos(phi) - 100, 300);

        positions[i * 3] = x;
        positions[i * 3 + 1] = y;
        positions[i * 3 + 2] = z;

        const color = colorPalette[Math.floor(Math.random() * colorPalette.length)];
        colors[i * 3] = color.r;
        colors[i * 3 + 1] = color.g;
        colors[i * 3 + 2] = color.b;

        particleData.push({
          originalX: x,
          originalY: y,
          originalZ: z,
          velocityX: 0,
          velocityY: 0,
          velocityZ: 0,
          phase: Math.random() * Math.PI * 2,
          orbitSpeed: (Math.random() - 0.5) * 0.002,
          floatSpeed: Math.random() * 0.015 + 0.005,
          floatAmplitude: Math.random() * 12 + 5
        });
      }

      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

      // Circle texture so particles render as circles, not squares
      const circleCanvas = document.createElement('canvas');
      circleCanvas.width = 32;
      circleCanvas.height = 32;
      const circleCtx = circleCanvas.getContext('2d');
      const grad = circleCtx.createRadialGradient(16, 16, 0, 16, 16, 14);
      grad.addColorStop(0, 'rgba(255,255,255,1)');
      grad.addColorStop(0.6, 'rgba(255,255,255,0.8)');
      grad.addColorStop(1, 'rgba(255,255,255,0)');
      circleCtx.fillStyle = grad;
      circleCtx.beginPath();
      circleCtx.arc(16, 16, 14, 0, Math.PI * 2);
      circleCtx.fill();
      const circleTexture = new THREE.CanvasTexture(circleCanvas);

      const material = new THREE.PointsMaterial({
        size: isMobile ? 2.5 : 3,
        vertexColors: true,
        transparent: true,
        opacity: 0.85,
        blending: THREE.AdditiveBlending,
        sizeAttenuation: true,
        map: circleTexture,
        alphaTest: 0.05
      });

      const points = new THREE.Points(geometry, material);
      scene.add(points);

      // ========== SHOOTING STARS ==========
      const shootingStarCount = 8;
      const shootingStars = [];

      for (let i = 0; i < shootingStarCount; i++) {
        const starGeometry = new THREE.BufferGeometry();
        const trailLength = 20;
        const starPositions = new Float32Array(trailLength * 3);
        const starColors = new Float32Array(trailLength * 3);

        for (let j = 0; j < trailLength; j++) {
          starPositions[j * 3] = 0;
          starPositions[j * 3 + 1] = 0;
          starPositions[j * 3 + 2] = 0;
          const alpha = 1 - (j / trailLength);
          starColors[j * 3] = alpha;
          starColors[j * 3 + 1] = alpha;
          starColors[j * 3 + 2] = alpha;
        }

        starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
        starGeometry.setAttribute('color', new THREE.BufferAttribute(starColors, 3));

        const starMaterial = new THREE.PointsMaterial({
          size: 3,
          vertexColors: true,
          transparent: true,
          opacity: 0.9,
          blending: THREE.AdditiveBlending,
          sizeAttenuation: true
        });

        const star = new THREE.Points(starGeometry, starMaterial);
        star.visible = false;
        scene.add(star);

        shootingStars.push({
          mesh: star,
          geometry: starGeometry,
          active: false,
          x: 0, y: 0, z: 0,
          vx: 0, vy: 0, vz: 0,
          trail: [],
          life: 0,
          delay: Math.random() * 300 + i * 50
        });
      }

      function spawnShootingStar(star) {
        star.active = true;
        star.life = 0;
        star.mesh.visible = true;

        // Start from edges of screen
        const side = Math.floor(Math.random() * 4);
        const speed = Math.random() * 15 + 10;

        if (side === 0) { // top
          star.x = (Math.random() - 0.5) * 1200;
          star.y = 500;
          star.vx = (Math.random() - 0.5) * speed;
          star.vy = -speed;
        } else if (side === 1) { // right
          star.x = 700;
          star.y = (Math.random() - 0.5) * 800;
          star.vx = -speed;
          star.vy = (Math.random() - 0.5) * speed * 0.5;
        } else if (side === 2) { // left
          star.x = -700;
          star.y = (Math.random() - 0.5) * 800;
          star.vx = speed;
          star.vy = (Math.random() - 0.5) * speed * 0.5;
        } else { // diagonal from corner
          star.x = (Math.random() > 0.5 ? 700 : -700);
          star.y = 500;
          star.vx = star.x > 0 ? -speed : speed;
          star.vy = -speed * 0.8;
        }

        star.z = Math.random() * 200 - 100;
        star.vz = 0;
        star.trail = [];
      }

      // Mouse state
      const mouse = { x: 0, y: 0, prevX: 0, prevY: 0 };
      let mouseSpeed = 0;
      let isMouseInHero = false;

      document.addEventListener('mousemove', (e) => {
        const rect = canvas.getBoundingClientRect();
        isMouseInHero = e.clientY < rect.bottom && e.clientY > rect.top;

        mouse.prevX = mouse.x;
        mouse.prevY = mouse.y;
        mouse.x = ((e.clientX / window.innerWidth) * 2 - 1);
        mouse.y = -((e.clientY / window.innerHeight) * 2 - 1);

        const dx = mouse.x - mouse.prevX;
        const dy = mouse.y - mouse.prevY;
        mouseSpeed = Math.min(Math.sqrt(dx * dx + dy * dy) * 40, 3);
      });

      let time = 0;
      let frameCount = 0;

      // ========== INITIAL BIG BANG EXPLOSION ON LOAD ==========
      let initialExplosionPhase = 0; // 0 = exploding, 1 = returning, 2 = done
      let initialExplosionTime = 0;
      const explosionDuration = 80;
      const returnDuration = 150;

      // Start all particles from center
      for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3;
        positions[i3] = 0;
        positions[i3 + 1] = 0;
        positions[i3 + 2] = 0;

        // Give each particle an initial explosive velocity
        const angle = Math.random() * Math.PI * 2;
        const vertAngle = (Math.random() - 0.5) * Math.PI;
        const speed = Math.random() * 20 + 15;
        particleData[i].velocityX = Math.cos(angle) * Math.cos(vertAngle) * speed;
        particleData[i].velocityY = Math.sin(angle) * Math.cos(vertAngle) * speed;
        particleData[i].velocityZ = Math.sin(vertAngle) * speed * 0.5;
      }
      geometry.attributes.position.needsUpdate = true;

      function animate() {
        requestAnimationFrame(animate);

        time += 0.01;
        frameCount++;
        initialExplosionTime++;
        const positionsArray = geometry.attributes.position.array;

        // Handle initial explosion phases
        if (initialExplosionPhase === 0 && initialExplosionTime > explosionDuration) {
          initialExplosionPhase = 1;
        } else if (initialExplosionPhase === 1 && initialExplosionTime > explosionDuration + returnDuration) {
          initialExplosionPhase = 2;
        }

        // Mouse influence - limited so particles never fully disappear
        const mouseX3D = mouse.x * 450;
        const mouseY3D = mouse.y * 350;
        const explosionRadius = 180 + mouseSpeed * 60;
        const explosionForce = 80 + mouseSpeed * 150;
        const maxVelocity = initialExplosionPhase === 0 ? 50 : 25;

        for (let i = 0; i < particleCount; i++) {
          const i3 = i * 3;
          const pData = particleData[i];

          let currentX = positionsArray[i3];
          let currentY = positionsArray[i3 + 1];
          let currentZ = positionsArray[i3 + 2];

          // During initial explosion, just apply velocity
          if (initialExplosionPhase === 0) {
            currentX += pData.velocityX;
            currentY += pData.velocityY;
            currentZ += pData.velocityZ;

            // Slow damping during explosion
            pData.velocityX *= 0.98;
            pData.velocityY *= 0.98;
            pData.velocityZ *= 0.98;

            positionsArray[i3] = currentX;
            positionsArray[i3 + 1] = currentY;
            positionsArray[i3 + 2] = currentZ;
            continue;
          }

          // During return phase and after, stronger pull to original
          const returnProgress = initialExplosionPhase === 1
            ? (initialExplosionTime - explosionDuration) / returnDuration
            : 1;
          const dynamicReturnForce = initialExplosionPhase === 1
            ? 0.008 + returnProgress * 0.02
            : 0.012;

          const dx = currentX - mouseX3D;
          const dy = currentY - mouseY3D;
          const dz = currentZ + 100;
          const dist = Math.sqrt(dx * dx + dy * dy + dz * dz * 0.2);

          // Fun explosion effect - particles scatter but not too far
          if (isMouseInHero && dist < explosionRadius && initialExplosionPhase === 2) {
            const force = (explosionRadius - dist) / explosionRadius;
            const explosionPower = force * force * explosionForce;

            const angle = Math.atan2(dy, dx) + (Math.random() - 0.5) * 1.5;
            const vertAngle = (Math.random() - 0.5) * Math.PI * 0.5;

            pData.velocityX += Math.cos(angle) * explosionPower * 0.08;
            pData.velocityY += Math.sin(angle) * explosionPower * 0.08;
            pData.velocityZ += Math.sin(vertAngle) * explosionPower * 0.05;
          }

          // Clamp velocity so particles don't fly too far
          pData.velocityX = Math.max(-maxVelocity, Math.min(maxVelocity, pData.velocityX));
          pData.velocityY = Math.max(-maxVelocity, Math.min(maxVelocity, pData.velocityY));
          pData.velocityZ = Math.max(-maxVelocity, Math.min(maxVelocity, pData.velocityZ));

          currentX += pData.velocityX;
          currentY += pData.velocityY;
          currentZ += pData.velocityZ;

          // Faster damping for quicker return
          pData.velocityX *= 0.94;
          pData.velocityY *= 0.94;
          pData.velocityZ *= 0.94;

          // Gentle floating motion
          const floatX = Math.sin(time * pData.floatSpeed + pData.phase) * pData.floatAmplitude;
          const floatY = Math.cos(time * pData.floatSpeed * 0.7 + pData.phase) * pData.floatAmplitude;

          // Pull back to original position
          const targetX = pData.originalX + floatX;
          const targetY = pData.originalY + floatY;
          const targetZ = pData.originalZ;

          currentX += (targetX - currentX) * dynamicReturnForce;
          currentY += (targetY - currentY) * dynamicReturnForce;
          currentZ += (targetZ - currentZ) * dynamicReturnForce;

          // Never let particles get too close to camera (camera at z=600)
          if (currentZ > 320) {
            currentZ = 320;
            pData.velocityZ = Math.min(pData.velocityZ, 0);
          }

          // Subtle orbit
          const orbitAngle = time * pData.orbitSpeed;
          const cos = Math.cos(orbitAngle);
          const sin = Math.sin(orbitAngle);
          const rotatedX = currentX * cos - currentZ * sin * 0.05;
          const rotatedZ = currentX * sin * 0.05 + currentZ * cos;

          positionsArray[i3] = rotatedX;
          positionsArray[i3 + 1] = currentY;
          positionsArray[i3 + 2] = rotatedZ;
        }

        // ========== UPDATE SHOOTING STARS ==========
        shootingStars.forEach((star, idx) => {
          if (!star.active) {
            star.delay--;
            if (star.delay <= 0) {
              spawnShootingStar(star);
            }
            return;
          }

          star.life++;
          star.x += star.vx;
          star.y += star.vy;
          star.z += star.vz;

          // Add to trail
          star.trail.unshift({ x: star.x, y: star.y, z: star.z });
          if (star.trail.length > 20) star.trail.pop();

          // Update geometry
          const starPositions = star.geometry.attributes.position.array;
          for (let j = 0; j < star.trail.length; j++) {
            starPositions[j * 3] = star.trail[j].x;
            starPositions[j * 3 + 1] = star.trail[j].y;
            starPositions[j * 3 + 2] = star.trail[j].z;
          }
          star.geometry.attributes.position.needsUpdate = true;

          // Check if out of bounds
          if (Math.abs(star.x) > 900 || Math.abs(star.y) > 600 || star.life > 150) {
            star.active = false;
            star.mesh.visible = false;
            star.delay = Math.random() * 200 + 100;
          }
        });

        mouseSpeed *= 0.92;

        geometry.attributes.position.needsUpdate = true;
        renderer.render(scene, camera);
      }

      animate();

      window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
      });

      // Expose particle burst for external click shockwave
      window._pBurst = function (clientX, clientY) {
        const x3D =  ((clientX / window.innerWidth)  * 2 - 1) * 450;
        const y3D = -((clientY / window.innerHeight) * 2 - 1) * 350;
        const RADIUS = 260, FORCE = 18;
        const posArr = geometry.attributes.position.array;
        for (let i = 0; i < particleCount; i++) {
          const i3  = i * 3;
          const dx  = posArr[i3]     - x3D;
          const dy  = posArr[i3 + 1] - y3D;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < RADIUS) {
            const f = (1 - dist / RADIUS) * FORCE;
            const angle = Math.atan2(dy, dx);
            particleData[i].velocityX += Math.cos(angle) * f;
            particleData[i].velocityY += Math.sin(angle) * f;
            particleData[i].velocityZ += (Math.random() - 0.5) * f * 0.4;
          }
        }
      };
    })();

    // ============================================
    // GSAP SCROLL ANIMATIONS - ENHANCED
    // ============================================
    gsap.registerPlugin(ScrollTrigger);

    // ============================================
    // LENIS SMOOTH SCROLL
    // ============================================
    let lenis = null;
    try {
      lenis = new Lenis({
        duration: 1.25,
        easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smoothWheel: true,
        wheelMultiplier: 0.85,
        touchMultiplier: 1.8,
      });

      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add(time => lenis.raf(time * 1000));
      gsap.ticker.lagSmoothing(0);
    } catch (e) {
      console.warn('Lenis no disponible, usando scroll nativo.', e);
    }

    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // ========== GLOBAL ORB ANIMATIONS WITH GSAP ==========
    if (!prefersReducedMotion) {
      // Animate background orbs with scroll
      gsap.to('.bg-orb-1', {
        scrollTrigger: {
          trigger: 'body',
          start: 'top top',
          end: 'bottom bottom',
          scrub: 2
        },
        x: '30%',
        y: '100%',
        scale: 1.5,
        rotation: 45
      });

      gsap.to('.bg-orb-2', {
        scrollTrigger: {
          trigger: 'body',
          start: 'top top',
          end: 'bottom bottom',
          scrub: 3
        },
        x: '-40%',
        y: '-80%',
        scale: 0.8,
        rotation: -30
      });

      gsap.to('.bg-orb-3', {
        scrollTrigger: {
          trigger: 'body',
          start: 'top top',
          end: 'bottom bottom',
          scrub: 2.5
        },
        x: '-20%',
        y: '60%',
        scale: 1.3,
        rotation: 60
      });

      gsap.to('.bg-orb-4', {
        scrollTrigger: {
          trigger: 'body',
          start: 'top top',
          end: 'bottom bottom',
          scrub: 1.5
        },
        x: '50%',
        y: '-50%',
        scale: 1.6,
        rotation: -45
      });
    }

    if (!prefersReducedMotion) {
      // Hero content - dramatic entrance
      const heroTl = gsap.timeline({ delay: 3.6 });
      heroTl
        .from('.hero-chip', {
          y: -50,
          opacity: 0,
          scale: 0.8,
          duration: 0.8,
          ease: 'back.out(1.7)'
        })
        .from('.hero-title', {
          y: 80,
          opacity: 0,
          scale: 0.9,
          duration: 1,
          ease: 'power4.out'
        }, '-=0.4')
        .from('.hero-subtitle', {
          y: 60,
          opacity: 0,
          filter: 'blur(10px)',
          duration: 0.9,
          ease: 'power3.out'
        }, '-=0.6')
        .from('.hero-stats', {
          y: 40,
          opacity: 0,
          duration: 0.8,
          ease: 'power3.out'
        }, '-=0.4');

      // Parallax effect on hero content while scrolling
      gsap.to('.hero-content', {
        scrollTrigger: {
          trigger: '#hero',
          start: 'top top',
          end: 'bottom top',
          scrub: 1
        },
        y: -150,
        opacity: 0.3,
        scale: 0.95,
        filter: 'blur(5px)'
      });

      // Fade particle canvas on scroll - but keep slightly visible
      gsap.to('#particle-canvas', {
        scrollTrigger: {
          trigger: '#hero',
          start: 'top top',
          end: '150% top',
          scrub: 1
        },
        opacity: 0.15,
        filter: 'blur(3px)'
      });

      // Fade out hero orbs on scroll
      gsap.to('.hero-orb-3', {
        scrollTrigger: {
          trigger: '#hero',
          start: 'top top',
          end: '70% top',
          scrub: 1
        },
        opacity: 0
      });

      // Section titles - staggered reveal with blur
      gsap.utils.toArray('.section-label').forEach(el => {
        gsap.fromTo(el,
          { x: -110, opacity: 0, filter: 'blur(20px)', scale: 0.9 },
          {
            scrollTrigger: {
              trigger: el,
              start: 'top 92%',
              end: 'top 52%',
              scrub: 1.4,
            },
            x: 0,
            opacity: 1,
            filter: 'blur(0px)',
            scale: 1,
            ease: 'power2.out',
          }
        );
      });

      // SplitType — char-by-char reveal on section titles
      document.querySelectorAll('.section-title').forEach(el => {
        const split = new SplitType(el, { types: 'chars,words' });

        gsap.from(split.chars, {
          scrollTrigger: {
            trigger: el,
            start: 'top 88%',
            toggleActions: 'play none none reverse',
          },
          y: 55,
          opacity: 0,
          filter: 'blur(12px)',
          rotateX: -70,
          transformOrigin: '50% 0% -30px',
          duration: 0.65,
          stagger: { amount: 0.55, from: 'start' },
          ease: 'power3.out',
        });
      });

      gsap.utils.toArray('.section-desc').forEach(el => {
        gsap.from(el, {
          scrollTrigger: {
            trigger: el,
            start: 'top 85%',
            toggleActions: 'play none none none'
          },
          y: 40,
          opacity: 0,
          duration: 0.8,
          delay: 0.2,
          ease: 'power3.out'
        });
      });

      // Problem cards
      gsap.from('.problem-card', {
        scrollTrigger: {
          trigger: '.problem-grid',
          start: 'top 80%'
        },
        y: 40,
        opacity: 0,
        duration: 0.8,
        stagger: 0.1,
        ease: 'power3.out'
      });

      // Solution steps
      gsap.from('.solution-step', {
        scrollTrigger: {
          trigger: '.solution-steps',
          start: 'top 80%'
        },
        y: 40,
        opacity: 0,
        duration: 0.8,
        stagger: 0.1,
        ease: 'power3.out'
      });

      // Feature blocks
      gsap.utils.toArray('.feature-block').forEach(block => {
        const isReverse = block.classList.contains('reverse');

        gsap.fromTo(block.querySelector('.feature-content'),
          { x: isReverse ? 110 : -110, opacity: 0, filter: 'blur(22px)', scale: 0.93 },
          {
            scrollTrigger: {
              trigger: block,
              start: 'top 82%',
              end: 'top 28%',
              scrub: 1.6,
            },
            x: 0,
            opacity: 1,
            filter: 'blur(0px)',
            scale: 1,
            ease: 'power2.out',
          }
        );

        gsap.fromTo(block.querySelector('.feature-visual'),
          { x: isReverse ? -110 : 110, opacity: 0, filter: 'blur(22px)', scale: 0.93 },
          {
            scrollTrigger: {
              trigger: block,
              start: 'top 82%',
              end: 'top 28%',
              scrub: 1.6,
            },
            x: 0,
            opacity: 1,
            filter: 'blur(0px)',
            scale: 1,
            ease: 'power2.out',
          }
        );
      });

      // Donut charts animation
      gsap.utils.toArray('.donut-chart .progress').forEach(circle => {
        const value = parseInt(circle.dataset.value);
        const circumference = 408;
        const offset = circumference - (value / 100) * circumference;

        gsap.to(circle, {
          scrollTrigger: {
            trigger: circle,
            start: 'top 80%'
          },
          strokeDashoffset: offset,
          duration: 1.5,
          ease: 'power3.out'
        });
      });

      // Flow screens
      gsap.from('.flow-screen', {
        scrollTrigger: {
          trigger: '.flow-screens',
          start: 'top 80%'
        },
        scale: 0,
        opacity: 0,
        duration: 0.5,
        stagger: 0.03,
        ease: 'back.out(1.7)'
      });

      // Extra cards
      gsap.from('.extra-card', {
        scrollTrigger: {
          trigger: '.extras-grid',
          start: 'top 80%'
        },
        y: 40,
        opacity: 0,
        duration: 0.8,
        stagger: 0.1,
        ease: 'power3.out'
      });

      // Impact table rows
      document.querySelectorAll('.impact-table tbody tr').forEach((row) => {
        gsap.fromTo(row,
          { x: -80, opacity: 0, filter: 'blur(18px)' },
          {
            scrollTrigger: {
              trigger: row,
              start: 'top 92%',
              end: 'top 62%',
              scrub: 1.2,
            },
            x: 0,
            opacity: 1,
            filter: 'blur(0px)',
            ease: 'power2.out',
          }
        );
      });

      // Comparison boxes
      gsap.from('.comparison-box', {
        scrollTrigger: {
          trigger: '.impact-comparison',
          start: 'top 80%'
        },
        y: 40,
        opacity: 0,
        duration: 0.8,
        stagger: 0.15,
        ease: 'power3.out'
      });

      // Quote
      gsap.from('.quote-text', {
        scrollTrigger: {
          trigger: '#quote',
          start: 'top 75%'
        },
        y: 30,
        opacity: 0,
        scale: 0.96,
        duration: 1,
        ease: 'power3.out'
      });

      // Tools pipeline
      gsap.from('.tool-item', {
        scrollTrigger: {
          trigger: '.tools-pipeline',
          start: 'top 80%'
        },
        y: 30,
        opacity: 0,
        duration: 0.6,
        stagger: 0.1,
        ease: 'power3.out'
      });

      gsap.from('.tool-arrow', {
        scrollTrigger: {
          trigger: '.tools-pipeline',
          start: 'top 80%'
        },
        scale: 0,
        opacity: 0,
        duration: 0.4,
        stagger: 0.1,
        delay: 0.3,
        ease: 'back.out(1.7)'
      });

      // Git bar
      gsap.from('.git-bar', {
        scrollTrigger: {
          trigger: '.git-bar',
          start: 'top 85%'
        },
        scaleX: 0,
        opacity: 0,
        duration: 0.8,
        ease: 'power3.out'
      });

      // Stat counters (85%, 72%)
      document.querySelectorAll('[data-count]').forEach(el => {
        const target = parseInt(el.dataset.count);
        const obj = { val: 0 };
        gsap.to(obj, {
          scrollTrigger: {
            trigger: el,
            start: 'top 85%',
            once: true
          },
          val: target,
          duration: 1.6,
          ease: 'power2.out',
          onUpdate() {
            el.textContent = Math.round(obj.val) + '%';
          }
        });
      });

      // Roadmap cards
      gsap.from('.roadmap-card', {
        scrollTrigger: {
          trigger: '.roadmap-grid',
          start: 'top 80%'
        },
        y: 40,
        opacity: 0,
        duration: 0.8,
        stagger: 0.15,
        ease: 'power3.out'
      });

      // CTA
      gsap.from('#cta > .container > *', {
        scrollTrigger: {
          trigger: '#cta',
          start: 'top 75%'
        },
        y: 30,
        opacity: 0,
        duration: 0.8,
        stagger: 0.1,
        ease: 'power3.out'
      });

      // BEM visual animation
      document.querySelectorAll('.bem-box').forEach((box, i) => {
        gsap.fromTo(box,
          { x: i === 0 ? -95 : 95, opacity: 0, filter: 'blur(20px)', scale: 0.92 },
          {
            scrollTrigger: {
              trigger: box,
              start: 'top 88%',
              end: 'top 48%',
              scrub: 1.4,
            },
            x: 0,
            opacity: 1,
            filter: 'blur(0px)',
            scale: 1,
            ease: 'power2.out',
          }
        );
      });
    }

    // ============================================
    // 0. LOADER ANIMATION
    // ============================================
    document.body.style.overflow = 'hidden';
    const loaderTl = gsap.timeline({
      onComplete() {
        document.getElementById('loader').style.display = 'none';
        document.body.style.overflow = '';
      }
    });
    loaderTl
      .to('.loader-chip', { opacity: 1, y: 0, duration: 0.55, ease: 'power3.out' })
      .to('.loader-title', { opacity: 1, y: 0, duration: 0.75, ease: 'power3.out' }, '-=0.2')
      .to('.loader-bar-fill', { width: '100%', duration: 1.1, ease: 'power2.inOut' }, '-=0.1')
      .to('.loader-pct', {
        innerText: 100, snap: { innerText: 1 }, duration: 1.1, ease: 'power2.inOut',
        onUpdate() { document.querySelector('.loader-pct').textContent = Math.round(this.targets()[0].innerText) + '%'; }
      }, '<')
      .to('#loader', { opacity: 0, duration: 0.55, ease: 'power2.in', delay: 0.35 });

    // ============================================
    // 1. MAGNETIC CURSOR (quickTo powered)
    // ============================================
    const cursorDot  = document.getElementById('cursor-dot');
    const cursorRing = document.getElementById('cursor-ring');

    // quickTo: ultra-smooth sub-frame interpolation
    const dotX  = gsap.quickTo(cursorDot,  'x', { duration: 0.08, ease: 'power3' });
    const dotY  = gsap.quickTo(cursorDot,  'y', { duration: 0.08, ease: 'power3' });
    const ringX = gsap.quickTo(cursorRing, 'x', { duration: 0.42, ease: 'power3' });
    const ringY = gsap.quickTo(cursorRing, 'y', { duration: 0.42, ease: 'power3' });

    // Use transform instead of left/top for GPU compositing
    cursorDot.style.left  = '0px';
    cursorDot.style.top   = '0px';
    cursorRing.style.left = '0px';
    cursorRing.style.top  = '0px';

    let mx = window.innerWidth / 2, my = window.innerHeight / 2;

    document.addEventListener('mousemove', e => {
      mx = e.clientX; my = e.clientY;
      dotX(mx); dotY(my);
      ringX(mx); ringY(my);
    });

    // Magnetic targets — elements that attract cursor + move toward it
    const magneticTargets = document.querySelectorAll(
      'a, button, .cta-btn, .nav-links a, .glass-card, .stat-box'
    );

    magneticTargets.forEach(el => {
      const isBig = el.matches('.glass-card, .stat-box');
      const pullStrength  = isBig ? 0.12 : 0.35;
      const ringScale     = isBig ? 1.4  : 2.2;
      const RADIUS        = isBig ? 180  : 110;

      function onMove(e) {
        const r  = el.getBoundingClientRect();
        const cx = r.left + r.width  / 2;
        const cy = r.top  + r.height / 2;
        const dx = e.clientX - cx;
        const dy = e.clientY - cy;
        const dist = Math.hypot(dx, dy);

        if (dist < RADIUS) {
          const pull = (RADIUS - dist) / RADIUS;
          gsap.to(el, {
            x: dx * pull * pullStrength,
            y: dy * pull * pullStrength,
            duration: 0.35,
            ease: 'power2.out',
            overwrite: 'auto',
          });
          // Ring snaps to follow the element center
          ringX(cx + dx * pull * pullStrength);
          ringY(cy + dy * pull * pullStrength);
          gsap.to(cursorRing, {
            scale: ringScale,
            opacity: 0.6,
            duration: 0.25,
            ease: 'power2.out',
            overwrite: 'auto',
          });
          gsap.to(cursorDot, {
            scale: 0.4,
            duration: 0.2,
            overwrite: 'auto',
          });
        }
      }

      function onLeave() {
        gsap.to(el, {
          x: 0, y: 0,
          duration: 0.75,
          ease: 'elastic.out(1, 0.45)',
          overwrite: 'auto',
        });
        gsap.to(cursorRing, {
          scale: 1,
          opacity: 1,
          duration: 0.35,
          ease: 'power2.out',
          overwrite: 'auto',
        });
        gsap.to(cursorDot, {
          scale: 1,
          duration: 0.25,
          overwrite: 'auto',
        });
      }

      el.addEventListener('mousemove',  onMove);
      el.addEventListener('mouseleave', onLeave);
    });

    // ============================================
    // 2. SCROLL PROGRESS BAR
    // ============================================
    const progressBar = document.getElementById('scroll-progress');
    if (lenis) {
      lenis.on('scroll', ({ scroll, limit }) => {
        progressBar.style.width = (scroll / limit * 100) + '%';
      });
    } else {
      window.addEventListener('scroll', () => {
        const pct = window.scrollY / (document.documentElement.scrollHeight - window.innerHeight) * 100;
        progressBar.style.width = pct + '%';
      }, { passive: true });
    }

    // ============================================
    // 3. WORD REVEAL — Hero title (futuristic GSAP)
    // ============================================
    (function () {
      const el = document.querySelector('.hero-title');
      if (!el) return;
      // Wrap text nodes into word spans while preserving gradient-text child
      function wrapWords(node) {
        if (node.nodeType === 3) {
          const parts = node.textContent.split(/(\s+)/);
          const frag = document.createDocumentFragment();
          parts.forEach(p => {
            if (!p.trim()) { frag.appendChild(document.createTextNode(p)); return; }
            const outer = document.createElement('span');
            outer.className = 'hero-word';
            const inner = document.createElement('span');
            inner.className = 'hero-word-inner';
            inner.textContent = p;
            outer.appendChild(inner);
            frag.appendChild(outer);
          });
          node.parentNode.replaceChild(frag, node);
        } else if (node.nodeType === 1 && !node.classList.contains('gradient-text')) {
          [...node.childNodes].forEach(wrapWords);
        }
      }
      [...el.childNodes].forEach(wrapWords);

      const words = el.querySelectorAll('.hero-word-inner');
      gsap.set(words, { yPercent: 115 });

      gsap.to(words, {
        yPercent: 0,
        duration: 0.9,
        stagger: 0.07,
        ease: 'power4.out',
        delay: 3.7,
        onComplete() {
          gsap.fromTo(el,
            { filter: 'drop-shadow(0 0 0px rgba(52,211,153,0))' },
            {
              filter: 'drop-shadow(0 0 18px rgba(52,211,153,0.35))', duration: 0.5, yoyo: true, repeat: 1, ease: 'power2.inOut',
              onComplete() { el.style.filter = ''; }
            }
          );
        }
      });

      // Gradient-text span fades in separately
      const grad = el.querySelector('.gradient-text');
      if (grad) gsap.from(grad, { opacity: 0, scale: 0.88, duration: 0.7, delay: 4.3, ease: 'power3.out' });
    })();

    // ============================================
    // TRAIL PARTICLES
    // ============================================
    (function () {
      const tc = document.getElementById('trail-canvas');
      const ctx = tc.getContext('2d');
      tc.width = window.innerWidth; tc.height = window.innerHeight;
      window.addEventListener('resize', () => { tc.width = window.innerWidth; tc.height = window.innerHeight; });
      const COLORS = ['#34d399', '#60a5fa', '#a78bfa', '#fbbf24', '#f87171'];
      const parts = [];
      document.addEventListener('mousemove', e => {
        for (let i = 0; i < 3; i++) {
          parts.push({
            x: e.clientX + (Math.random() - .5) * 8, y: e.clientY + (Math.random() - .5) * 8,
            vx: (Math.random() - .5) * 1.2, vy: (Math.random() - .5) * 1.2 - 0.4,
            life: 1, decay: Math.random() * .025 + .022,
            size: Math.random() * 2.5 + .8,
            color: COLORS[Math.floor(Math.random() * COLORS.length)]
          });
        }
      });
      // Shockwave rings
      const rings   = [];
      const flashes = [];

      document.addEventListener('click', e => {
        // Trigger 3D particle burst
        if (window._pBurst) window._pBurst(e.clientX, e.clientY);

        // Flash at click point
        flashes.push({ x: e.clientX, y: e.clientY, r: 0, life: 1 });

        // 3 concentric rings — mint, blue, violet — staggered
        const ringColors = [
          'rgba(52,211,153,',
          'rgba(96,165,250,',
          'rgba(167,139,250,',
        ];
        ringColors.forEach((color, i) => {
          setTimeout(() => {
            rings.push({
              x: e.clientX, y: e.clientY,
              r: 0, life: 1,
              color,
              speed: 3.2 + i * 1.1,
              width: 1.6 - i * 0.3,
            });
          }, i * 55);
        });
      });

      (function loop() {
        ctx.clearRect(0, 0, tc.width, tc.height);

        // Draw flashes
        for (let i = flashes.length - 1; i >= 0; i--) {
          const f = flashes[i];
          f.r    += 14;
          f.life -= 0.07;
          if (f.life <= 0) { flashes.splice(i, 1); continue; }
          const grad = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, f.r);
          grad.addColorStop(0,   `rgba(255,255,255,${f.life * 0.9})`);
          grad.addColorStop(0.3, `rgba(52,211,153,${f.life * 0.6})`);
          grad.addColorStop(1,   'rgba(52,211,153,0)');
          ctx.beginPath();
          ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
          ctx.fillStyle = grad;
          ctx.fill();
        }

        // Draw shockwave rings
        for (let i = rings.length - 1; i >= 0; i--) {
          const rg = rings[i];
          rg.r    += rg.speed;
          rg.life -= 0.022;
          if (rg.life <= 0) { rings.splice(i, 1); continue; }

          // Outer glow pass
          ctx.beginPath();
          ctx.arc(rg.x, rg.y, rg.r, 0, Math.PI * 2);
          ctx.strokeStyle = rg.color + rg.life * 0.08 + ')';
          ctx.lineWidth   = rg.width * 4 * rg.life;
          ctx.stroke();

          // Sharp ring
          ctx.beginPath();
          ctx.arc(rg.x, rg.y, rg.r, 0, Math.PI * 2);
          ctx.strokeStyle = rg.color + rg.life * 0.38 + ')';
          ctx.lineWidth   = rg.width * rg.life;
          ctx.stroke();
        }

        // Draw cursor trail particles
        for (let i = parts.length - 1; i >= 0; i--) {
          const p = parts[i];
          p.x += p.vx; p.y += p.vy; p.life -= p.decay;
          if (p.life <= 0) { parts.splice(i, 1); continue; }
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
          ctx.fillStyle   = p.color;
          ctx.globalAlpha = p.life * 0.55;
          ctx.fill();
        }

        ctx.globalAlpha = 1;
        requestAnimationFrame(loop);
      })();
    })();

    // ============================================
    // SPRING CURSOR TRAIL (chain physics)
    // ============================================
    (function () {
      const COUNT   = 9;
      const SPRINGS = [0.28, 0.22, 0.18, 0.15, 0.13, 0.11, 0.09, 0.075, 0.062];
      const COLORS  = [
        'rgba(52,211,153,',   // mint
        'rgba(96,165,250,',   // blue
        'rgba(167,139,250,',  // violet
        'rgba(251,191,36,',   // amber
        'rgba(52,211,153,',
        'rgba(96,165,250,',
        'rgba(167,139,250,',
        'rgba(52,211,153,',
        'rgba(96,165,250,',
      ];

      const cx = window.innerWidth / 2, cy = window.innerHeight / 2;
      const pos  = Array.from({ length: COUNT }, () => ({ x: cx, y: cy }));
      const dots = [];

      for (let i = 0; i < COUNT; i++) {
        const size  = Math.max(1.8, 5.5 - i * 0.42);
        const alpha = Math.max(0.08, 0.52 - i * 0.05);
        const d = document.createElement('div');
        d.style.cssText = [
          'position:fixed', 'top:0', 'left:0', 'border-radius:50%',
          'pointer-events:none', `z-index:${99985 - i}`,
          `width:${size}px`, `height:${size}px`,
          `margin:${-size / 2}px 0 0 ${-size / 2}px`,
          `background:${COLORS[i]}${alpha})`,
          `box-shadow:0 0 ${size * 3}px ${COLORS[i]}${alpha * 0.6})`,
          'will-change:transform',
        ].join(';');
        document.body.appendChild(d);
        dots.push(d);
      }

      let mouse = { x: cx, y: cy };
      document.addEventListener('mousemove', e => { mouse.x = e.clientX; mouse.y = e.clientY; });

      (function loop() {
        // Dot 0 chases cursor
        pos[0].x += (mouse.x - pos[0].x) * SPRINGS[0];
        pos[0].y += (mouse.y - pos[0].y) * SPRINGS[0];
        // Each dot chases the previous one
        for (let i = 1; i < COUNT; i++) {
          pos[i].x += (pos[i - 1].x - pos[i].x) * SPRINGS[i];
          pos[i].y += (pos[i - 1].y - pos[i].y) * SPRINGS[i];
        }
        dots.forEach((d, i) => {
          d.style.transform = `translateX(${pos[i].x}px) translateY(${pos[i].y}px)`;
        });
        requestAnimationFrame(loop);
      })();
    })();

    // ============================================
    // AMBIENT GLOW
    // ============================================
    (function () {
      const glow = document.getElementById('ambient-glow');
      let gx = window.innerWidth / 2, gy = window.innerHeight / 2, tx = gx, ty = gy;
      document.addEventListener('mousemove', e => { tx = e.clientX; ty = e.clientY; });
      (function loop() {
        gx += (tx - gx) * 0.055; gy += (ty - gy) * 0.055;
        glow.style.left = gx + 'px'; glow.style.top = gy + 'px';
        requestAnimationFrame(loop);
      })();
    })();


    // ============================================
    // KINETIC TYPOGRAPHY
    // ============================================
    gsap.utils.toArray('.kinetic-row').forEach((row, i) => {
      gsap.fromTo(row,
        { x: i % 2 === 0 ? '-8%' : '8%' },
        {
          x: i % 2 === 0 ? '8%' : '-8%',
          ease: 'none',
          scrollTrigger: { trigger: '.kinetic-section', start: 'top bottom', end: 'bottom top', scrub: 1.2 }
        }
      );
    });

    // ============================================
    // 4. 3D TILT ON CARDS
    // ============================================
    document.querySelectorAll('.glass-card').forEach(card => {
      card.addEventListener('mousemove', e => {
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        card.style.transform = `perspective(900px) rotateX(${-y * 10}deg) rotateY(${x * 10}deg) translateY(-4px)`;
        card.style.transition = 'transform 0.08s ease';
        card.style.backgroundImage = `radial-gradient(circle at ${(x + 0.5) * 100}% ${(y + 0.5) * 100}%, rgba(255,255,255,0.09), transparent 60%), linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.01) 100%)`;
      });
      card.addEventListener('mouseleave', () => {
        card.style.transform = '';
        card.style.backgroundImage = '';
        card.style.transition = 'transform 0.5s ease, background 0.5s ease';
      });
    });


    // ============================================
    // 6. IMPACT TABLE COUNTERS (columna Mejora)
    // ============================================
    document.querySelectorAll('.impact-table tbody tr').forEach(row => {
      const cell = row.querySelector('td:last-child');
      if (!cell) return;
      const original = cell.textContent.trim();
      const match = original.match(/\d+\.?\d*/);
      if (!match) return;
      const target = parseFloat(match[0]);
      ScrollTrigger.create({
        trigger: cell, start: 'top 88%', once: true,
        onEnter() {
          const obj = { v: 0 };
          gsap.to(obj, {
            v: target, duration: 1.4, ease: 'power2.out',
            onUpdate() { cell.textContent = original.replace(match[0], obj.v.toFixed(match[0].includes('.') ? 1 : 0)); },
            onComplete() { cell.textContent = original; }
          });
        }
      });
    });

    // ============================================
    // 7. MULTI-LAYER DEPTH PARALLAX
    // ============================================

    // Layer 0 — deepest: section background drift
    gsap.utils.toArray('section:not(#hero)').forEach(sec => {
      gsap.fromTo(sec, { backgroundPositionY: '0%' }, {
        backgroundPositionY: '30%',
        ease: 'none',
        scrollTrigger: { trigger: sec, start: 'top bottom', end: 'bottom top', scrub: 2 }
      });
    });

    // Layer 1 — section labels drift up slower than scroll
    gsap.utils.toArray('.section-label').forEach(el => {
      gsap.to(el, {
        y: -24,
        ease: 'none',
        scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: 1.8 }
      });
    });

    // Layer 2 — section titles drift up at medium speed
    gsap.utils.toArray('.section-title').forEach(el => {
      gsap.to(el, {
        y: -40,
        ease: 'none',
        scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: 1.5 }
      });
    });

    // Layer 3 — glass cards: alternating depth rates create a staggered 3D grid
    gsap.utils.toArray('.problem-card, .extra-card').forEach((card, i) => {
      gsap.to(card, {
        y: i % 2 === 0 ? -30 : -55,
        ease: 'none',
        scrollTrigger: { trigger: card, start: 'top bottom', end: 'bottom top', scrub: 1.3 }
      });
    });

    gsap.utils.toArray('.solution-step').forEach((step, i) => {
      gsap.to(step, {
        y: i % 2 === 0 ? -20 : -45,
        ease: 'none',
        scrollTrigger: { trigger: step, start: 'top bottom', end: 'bottom top', scrub: 1.2 }
      });
    });

    // Layer 4 — feature visuals: foreground images move faster (closest to viewer)
    gsap.utils.toArray('.feature-visual').forEach(el => {
      gsap.to(el, {
        y: -65,
        ease: 'none',
        scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: 1.1 }
      });
    });

    // ============================================
    // 8. CHROMATIC ABERRATION — scroll velocity
    // ============================================
    (function () {
      const canvas   = document.getElementById('particle-canvas');
      const chromaR  = document.getElementById('chroma-r');
      const chromaB  = document.getElementById('chroma-b');
      if (!canvas || !chromaR || !chromaB) return;

      canvas.style.filter = 'url(#chroma)';

      let lastY   = window.scrollY;
      let velAcc  = 0;       // accumulated velocity
      let current = 0;       // smoothed value driving the filter

      gsap.ticker.add(() => {
        const delta = Math.abs(window.scrollY - lastY);
        lastY  = window.scrollY;
        velAcc = velAcc * 0.75 + delta * 0.25;      // EMA smoothing
        current += (velAcc - current) * 0.12;        // follow with lag

        const offset = Math.min(current * 0.28, 9);  // cap at 9px

        chromaR.setAttribute('dx',  offset);
        chromaR.setAttribute('dy',  offset * 0.3);
        chromaB.setAttribute('dx', -offset);
        chromaB.setAttribute('dy', -offset * 0.3);
      });
    })();

    // ============================================
    // 9. CLIP-PATH REVEALS
    // ============================================
    (function () {
      // Feature images — wipe from the same side as their x-entrance
      document.querySelectorAll('.feature-block').forEach(block => {
        const img = block.querySelector('.feature-img');
        if (!img) return;
        const isReverse = block.classList.contains('reverse');
        gsap.fromTo(img,
          { clipPath: isReverse ? 'inset(0 0 0 100%)' : 'inset(0 100% 0 0)' },
          {
            clipPath: 'inset(0 0% 0 0%)',
            scrollTrigger: {
              trigger: img,
              start: 'top 88%',
              end: 'top 42%',
              scrub: 1.3,
            },
            ease: 'power2.inOut',
          }
        );
      });

    })();

    // ============================================
    // 10. AMBIENT COLOR SHIFT BY SECTION
    // ============================================
    (function () {
      const palette = {
        'hero':         { color: '#34d399', hue:   0 },
        'problema':     { color: '#f87171', hue: 155 },
        'solucion':     { color: '#34d399', hue:   0 },
        'demo-section': { color: '#60a5fa', hue:  55 },
        'features':     { color: '#a78bfa', hue:  85 },
        'flujos':       { color: '#60a5fa', hue:  55 },
        'ademas':       { color: '#fbbf24', hue: 205 },
        'impacto':      { color: '#60a5fa', hue:  55 },
        'quote':        { color: '#34d399', hue:   0 },
        'herramientas': { color: '#a78bfa', hue:  85 },
        'roadmap':      { color: '#fbbf24', hue: 205 },
        'cta':          { color: '#34d399', hue:   0 },
      };

      const pCanvas   = document.getElementById('particle-canvas');
      const ring      = document.getElementById('cursor-ring');
      const progBar   = document.getElementById('scroll-progress');
      const ambGlow   = document.getElementById('ambient-glow');
      let   activeHue = 0;

      function applyAccent(id) {
        const p = palette[id];
        if (!p) return;

        // Cursor ring color
        if (ring) {
          gsap.to(ring, {
            borderColor: p.color,
            boxShadow: `0 0 18px ${p.color}44`,
            duration: 0.9,
            ease: 'power2.inOut',
            overwrite: 'auto',
          });
        }

        // Particle canvas hue-rotate (blends over existing filter)
        if (pCanvas) {
          gsap.to({ hue: activeHue }, {
            hue: p.hue,
            duration: 1.4,
            ease: 'power2.inOut',
            overwrite: 'auto',
            onUpdate() {
              pCanvas.style.filter = `url(#chroma) hue-rotate(${this.targets()[0].hue}deg)`;
            },
            onComplete() { activeHue = p.hue; },
          });
        }

        // Progress bar accent
        if (progBar) {
          progBar.style.background = `linear-gradient(90deg, ${p.color}, #60a5fa, #a78bfa)`;
        }

        // Ambient glow tint
        if (ambGlow) {
          gsap.to(ambGlow, {
            opacity: 1,
            duration: 0.6,
            overwrite: 'auto',
          });
          ambGlow.style.background = `radial-gradient(circle, ${p.color}28 0%, transparent 70%)`;
        }
      }

      document.querySelectorAll('section[id]').forEach(sec => {
        ScrollTrigger.create({
          trigger: sec,
          start: 'top 52%',
          end: 'bottom 52%',
          onEnter:     () => applyAccent(sec.id),
          onEnterBack: () => applyAccent(sec.id),
        });
      });
    })();

    // ============================================
    // LIVE PLUGIN DEMO  (faithful to real screenshots)
    // ============================================
    (function () {
      const win = document.getElementById('figma-window');
      if (!win) return;

      // SVG donut circumference: r=38, circ = 2π×38 ≈ 238.76
      const CIRC = 238.76;

      // Canvas frame error/fix overlays (5 elements)
      const frameMap = [
        { err: 'fe-navbar', fix: 'ff-fix-navbar', layer: 2 },
        { err: 'fe-hero', fix: 'ff-fix-hero', layer: 6 },
        { err: 'fe-card-a', fix: 'ff-fix-card-a', layer: 7 },
        { err: 'fe-card-b', fix: 'ff-fix-card-b', layer: 8 },
        { err: 'fe-item1', fix: 'ff-fix-item1', layer: 9 },
      ];

      // BEM renames: layers 0–9
      const bemLayers = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

      let demoPlayed = false;

      // ── helpers ──
      function animCount(elId, from, to, dur, suffix) {
        suffix = suffix || '';
        const el = document.getElementById(elId);
        if (!el) return;
        const obj = { v: from };
        gsap.to(obj, {
          v: to, duration: dur, ease: 'power2.out',
          onUpdate() { el.textContent = Math.round(obj.v) + suffix; }
        });
      }
      function setDonut(id, pct) {
        const el = document.getElementById(id);
        if (!el) return;
        el.style.strokeDashoffset = (CIRC * (1 - pct / 100)).toFixed(2);
      }
      function setFrameErr(id, on) {
        const el = document.getElementById(id);
        if (el) el.style.opacity = on ? '1' : '0';
      }
      function setPulse(color) {
        const p = document.getElementById('status-pulse');
        if (p) { p.style.background = color; p.style.color = color; }
      }
      function setStatus(html) {
        const el = document.getElementById('status-text');
        if (el) el.innerHTML = html;
      }

      // ── futuristic system-repaired effect ──
      function launchConfetti() {
        const winEl = document.getElementById('figma-window');
        const btnEl = document.getElementById('fix-all-btn');
        if (!winEl) return;

        // canvas fixed sobre toda la pantalla, dibuja solo dentro del figma-window
        const canvas = document.createElement('canvas');
        canvas.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:9989;';
        document.body.appendChild(canvas);
        const DPR = Math.min(window.devicePixelRatio || 1, 2);
        const W = window.innerWidth, H = window.innerHeight;
        canvas.width  = W * DPR;
        canvas.height = H * DPR;
        canvas.style.width  = W + 'px';
        canvas.style.height = H + 'px';
        const ctx = canvas.getContext('2d');
        ctx.scale(DPR, DPR);

        // rectángulo del figma-window en viewport coords
        const wRect   = winEl.getBoundingClientRect();
        const btnRect = btnEl ? btnEl.getBoundingClientRect() : wRect;
        // origen = centro del botón en viewport coords
        const ox = btnRect.left + btnRect.width  * 0.5;
        const oy = btnRect.top  + btnRect.height * 0.5;

        // ── palette ──
        const COLORS = ['#37f5b4','#9747ff','#60a5fa','#a78bfa','#34d399','#fff'];

        // ── glowing orb particles — más cantidad, spawn escalonado ──
        const particles = [];
        for (let i = 0; i < 120; i++) {
          const spread = (Math.random() - 0.5) * wRect.width * 0.85;
          const spd    = 0.8 + Math.random() * 3.8;
          particles.push({
            x: ox + spread * 0.18,
            y: oy,
            vx: spread * 0.011,
            vy: -spd,
            color: COLORS[Math.floor(Math.random() * COLORS.length)],
            size: 1.6 + Math.random() * 3.8,
            op: 0,                          // arranca transparente
            fadeIn: 0.06 + Math.random() * 0.04,
            fadeOut: 0.004 + Math.random() * 0.004,
            glow: 8 + Math.random() * 16,
            delay: Math.floor(Math.random() * 35), // spawn escalonado
            trail: [],
            alive: true,
          });
        }

        // ── energy rings — 4 ondas con velocidad decreciente ──
        const rings = [
          { r: 2, spd: 5.5, op: 1.0, color: '#37f5b4', lw: 3,   decay: 0.016 },
          { r: 2, spd: 3.8, op: 0.9, color: '#9747ff',  lw: 2.2, decay: 0.014 },
          { r: 2, spd: 2.6, op: 0.7, color: '#60a5fa',  lw: 1.6, decay: 0.012 },
          { r: 2, spd: 1.6, op: 0.5, color: '#fff',     lw: 1.0, decay: 0.010 },
        ];

        // ── scan sweep ──
        let scanY    = oy;
        let scanDone = false;
        const scanTop = wRect.top;

        // ── radial flash ──
        let flashOp = 1.0;

        // ── holographic grid ──
        let gridOp = 0.18;

        let frame = 0;

        // helper: clip canvas to figma-window shape (rounded rect, viewport coords)
        function clipToWindow() {
          const R = 16;
          const { left: x, top: y, width: w, height: h } = wRect;
          ctx.beginPath();
          ctx.moveTo(x + R, y);
          ctx.lineTo(x + w - R, y);     ctx.arcTo(x+w, y,   x+w, y+R,   R);
          ctx.lineTo(x + w, y + h - R); ctx.arcTo(x+w, y+h, x+w-R, y+h, R);
          ctx.lineTo(x + R, y + h);     ctx.arcTo(x,   y+h, x,   y+h-R, R);
          ctx.lineTo(x, y + R);         ctx.arcTo(x,   y,   x+R, y,     R);
          ctx.closePath();
          ctx.clip();
        }

        (function tick() {
          frame++;
          ctx.clearRect(0, 0, W, H);
          ctx.save();
          clipToWindow();

          // ── 1. radial flash (fade suave con easing) ──
          if (flashOp > 0) {
            const ease = flashOp * flashOp; // quad ease-out
            const g = ctx.createRadialGradient(ox, oy, 0, ox, oy, wRect.width * 0.6);
            g.addColorStop(0,   `rgba(55,245,180,${(ease * 0.55).toFixed(2)})`);
            g.addColorStop(0.35,`rgba(151,71,255,${(ease * 0.22).toFixed(2)})`);
            g.addColorStop(1,   'transparent');
            ctx.fillStyle = g;
            ctx.fillRect(wRect.left, wRect.top, wRect.width, wRect.height);
            flashOp -= 0.038; // más lento = más suave
          }

          // ── 2. holographic grid (fade in y out) ──
          if (gridOp > 0) {
            ctx.save();
            ctx.globalAlpha = gridOp;
            ctx.strokeStyle = '#37f5b4';
            ctx.lineWidth   = 0.35;
            const step = 30;
            for (let gx = wRect.left; gx < wRect.right; gx += step) {
              ctx.beginPath(); ctx.moveTo(gx, wRect.top); ctx.lineTo(gx, wRect.bottom); ctx.stroke();
            }
            for (let gy = wRect.top; gy < wRect.bottom; gy += step) {
              ctx.beginPath(); ctx.moveTo(wRect.left, gy); ctx.lineTo(wRect.right, gy); ctx.stroke();
            }
            ctx.restore();
            // sube hasta 0.22, luego baja
            gridOp -= 0.005;
          }

          // ── 3. scan sweep suave (easing basado en progreso) ──
          if (!scanDone) {
            const totalDist = oy - scanTop;
            const progress  = 1 - Math.max(0, (scanY - scanTop) / totalDist);
            // ease-in-out del sweep
            const speed = 3.5 + Math.sin(progress * Math.PI) * 3;
            scanY -= speed;
            if (scanY <= scanTop) { scanY = scanTop; scanDone = true; }

            // tinte verde suave en la zona barrida
            const sweptH = oy - Math.max(scanTop, scanY);
            if (sweptH > 0) {
              ctx.save();
              ctx.globalAlpha = 0.05;
              ctx.fillStyle   = '#37f5b4';
              ctx.fillRect(wRect.left, scanTop, wRect.width, sweptH);
              ctx.restore();
            }

            // línea de scan con glow
            if (!scanDone) {
              const lineOp = Math.max(0, 0.9 - progress * 0.6);
              const beam = ctx.createLinearGradient(0, scanY - 12, 0, scanY + 12);
              beam.addColorStop(0,   'transparent');
              beam.addColorStop(0.5, `rgba(55,245,180,${lineOp.toFixed(2)})`);
              beam.addColorStop(1,   'transparent');
              ctx.save();
              ctx.fillStyle = beam;
              ctx.shadowBlur = 16; ctx.shadowColor = '#37f5b4';
              ctx.fillRect(wRect.left, scanY - 12, wRect.width, 24);
              ctx.restore();
            }
          }

          // ── 4. energy rings con decay individual ──
          rings.forEach(ring => {
            if (ring.op <= 0) return;
            ring.r  += ring.spd;
            ring.spd *= 0.97;          // desaceleran gradualmente
            ring.op -= ring.decay;
            ctx.save();
            ctx.globalAlpha = Math.max(0, ring.op * ring.op); // quad ease-out
            ctx.strokeStyle = ring.color;
            ctx.lineWidth   = ring.lw;
            ctx.shadowBlur  = 20; ctx.shadowColor = ring.color;
            ctx.beginPath(); ctx.arc(ox, oy, ring.r, 0, Math.PI * 2); ctx.stroke();
            ctx.restore();
          });

          // ── 5. orbs con trail — fade in → fade out ──
          let alive = flashOp > 0 || gridOp > 0 || !scanDone || rings.some(r => r.op > 0);

          particles.forEach(p => {
            if (!p.alive) return;
            if (frame < p.delay) { alive = true; return; }

            // física
            p.x  += p.vx;
            p.y  += p.vy;
            p.vy -= 0.018; // aceleración upward gradual

            // fade in durante los primeros frames
            if (p.op < 1) { p.op = Math.min(1, p.op + p.fadeIn); }
            else          { p.op -= p.fadeOut; }

            if (p.op <= 0) { p.alive = false; return; }
            alive = true;

            // trail
            p.trail.push({ x: p.x, y: p.y, op: p.op });
            if (p.trail.length > 14) p.trail.shift();

            p.trail.forEach((pt, i) => {
              const t = i / p.trail.length;
              ctx.save();
              ctx.globalAlpha = pt.op * t * 0.38;
              ctx.fillStyle   = p.color;
              ctx.shadowBlur  = p.glow * 0.3; ctx.shadowColor = p.color;
              ctx.beginPath(); ctx.arc(pt.x, pt.y, Math.max(0.3, p.size * t * 0.65), 0, Math.PI*2); ctx.fill();
              ctx.restore();
            });

            // orb principal con glow + core blanco
            ctx.save();
            ctx.globalAlpha = Math.max(0, p.op);
            ctx.shadowBlur  = p.glow; ctx.shadowColor = p.color;
            ctx.fillStyle   = p.color;
            ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI*2); ctx.fill();
            ctx.globalAlpha = Math.max(0, p.op) * 0.6;
            ctx.fillStyle   = '#fff'; ctx.shadowBlur = 0;
            ctx.beginPath(); ctx.arc(p.x, p.y, p.size * 0.34, 0, Math.PI*2); ctx.fill();
            ctx.restore();
          });

          ctx.restore(); // end clip

          if (alive) requestAnimationFrame(tick);
          else canvas.remove();
        })();
      }

      // ── reset everything ──
      function resetDemo() {
        gsap.set(win, { opacity: 0, y: 60, scale: 0.97, rotateX: 0, rotateY: 0 });
        const sl = document.getElementById('scan-line');
        gsap.set(sl, { opacity: 0, top: 0 });
        document.querySelectorAll('[data-layer]').forEach(el => {
          el.classList.remove('scanning-state', 'renamed', 'rename-flash');
          el.style.color = '';
        });
        frameMap.forEach(m => { setFrameErr(m.err, false); setFrameErr(m.fix, false); });
        ['donut-adopt', 'donut-salud'].forEach(id => {
          const el = document.getElementById(id);
          if (el) el.style.strokeDashoffset = CIRC;
        });
        ['adopt-pct', 'salud-pct'].forEach(id => { const el = document.getElementById(id); if (el) el.textContent = '0%'; });
        ['stat-nodos', 'stat-props', 'stat-issues', 'stat-resolved'].forEach(id => {
          const el = document.getElementById(id); if (el) el.textContent = '0';
        });
        for (let i = 0; i < 4; i++) {
          const tok = document.getElementById(`tok-${i}`);
          if (tok) tok.classList.remove('visible', 'active', 'assigned');
          const btn = document.getElementById(`asignar-${i}`);
          if (btn) { btn.classList.remove('assigned'); btn.textContent = 'Asignar'; }
        }
        const rh = document.getElementById('resolver-header');
        if (rh) rh.classList.remove('visible');
        // reset internal fix-all
        const fw = document.getElementById('fix-all-wrap');
        if (fw) { fw.style.display = 'none'; gsap.set(fw, { opacity: 0, y: 10 }); }
        const fb = document.getElementById('fix-all-btn');
        if (fb) fb.classList.remove('done');
        // clear toasts & cursor
        const toasts = document.getElementById('demo-toasts');
        if (toasts) toasts.innerHTML = '';
        hideAnimatedCursor();
        setStatus('Listo para escanear');
        setPulse('#37b87a');
        demoPlayed = false;
        fixPlayed = false;
      }

      let fixPlayed = false;

      // ── toast helper ──
      function showToast(text, color) {
        const container = document.getElementById('demo-toasts');
        if (!container) return;
        const toast = document.createElement('div');
        toast.className = 'demo-toast';
        toast.innerHTML = `<span style="color:${color}">${text}</span>`;
        container.appendChild(toast);
        gsap.fromTo(toast,
          { opacity: 0, x: 30, scale: 0.88 },
          { opacity: 1, x: 0, scale: 1, duration: 0.45, ease: 'back.out(1.7)' }
        );
        setTimeout(() => {
          gsap.to(toast, {
            opacity: 0, x: 20, duration: 0.3, ease: 'power2.in',
            onComplete: () => toast.remove()
          });
        }, 4500);
      }

      // ── animated cursor ──
      // El cursor es hijo directo de <body> → position:fixed = viewport real
      function showAnimatedCursor() {
        const cursor = document.getElementById('demo-cursor');
        const btn    = document.getElementById('fix-all-btn');
        const winEl  = document.getElementById('figma-window');
        if (!cursor || !btn || !winEl) return;

        // Scroll el panel al fondo para exponer el botón
        const plugin = btn.closest('.figma-plugin');
        if (plugin) plugin.scrollTop = plugin.scrollHeight;

        // Pequeño timeout para que el scroll se aplique antes de leer las coords
        setTimeout(() => {
          const winRect = winEl.getBoundingClientRect();
          const r       = btn.getBoundingClientRect();

          // Destino: centro-izq del botón, clampeado dentro del figma-window
          const endX = Math.min(winRect.right - 18, Math.max(winRect.left + 18, r.left + r.width * 0.35));
          const endY = Math.min(winRect.bottom - 18, Math.max(winRect.top + 18, r.top + r.height * 0.45));

          // Arranque: arriba-izquierda del botón, dentro del plugin panel
          const startX = Math.max(winRect.left + 10, endX - 85);
          const startY = Math.max(winRect.top  + 10, endY - 55);

          cursor.style.display = 'block';
          gsap.set(cursor, { x: startX, y: startY, opacity: 0, scale: 0.9 });
          gsap.to(cursor, { opacity: 1, scale: 1, duration: 0.2, ease: 'power2.out' });
          gsap.to(cursor, {
            x: endX, y: endY,
            duration: 1.0,
            delay: 0.2,
            ease: 'power3.inOut',
            onComplete() {
              gsap.to(cursor, {
                scale: 0.65, duration: 0.07, yoyo: true, repeat: 1, ease: 'power2.in',
                onComplete() {
                  if (!fixPlayed) runFixPhase();
                }
              });
            }
          });
        }, 60);
      }

      function hideAnimatedCursor() {
        const cursor = document.getElementById('demo-cursor');
        if (!cursor) return;
        gsap.killTweensOf(cursor);
        gsap.to(cursor, {
          opacity: 0, scale: 0.8, duration: 0.22, ease: 'power2.in',
          onComplete: () => { cursor.style.display = 'none'; gsap.set(cursor, { x: 0, y: 0, scale: 1 }); }
        });
      }

      // ── fix phase (triggered by button click) ──
      function runFixPhase() {
        if (fixPlayed) return;
        fixPlayed = true;

        hideAnimatedCursor();

        const fb = document.getElementById('fix-all-btn');
        if (fb) { fb.classList.add('done'); fb.textContent = 'Reparando…'; }

        setStatus('<strong>Reparando…</strong> aplicando cambios');
        setPulse('#9747ff');

        const ftl = gsap.timeline();

        // Rename layers BEM
        bemLayers.forEach((idx, i) => {
          ftl.call(() => {
            const el = document.querySelector(`[data-layer="${idx}"]`);
            if (!el) return;
            el.classList.add('renamed', 'rename-flash');
            setTimeout(() => el.classList.remove('rename-flash'), 450);
          }, null, i === 0 ? '+=0' : '+=0.09');
        });

        // Toast 1: BEM
        ftl.call(() => showToast('📐 Estructura BEM renombrada', '#9747ff'), null, '+=0.2');

        // Assign tokens + fix frames
        let resolved = 0;
        for (let i = 0; i < 4; i++) {
          ftl.call((idx => () => {
            const btn = document.getElementById(`asignar-${idx}`);
            const tok = document.getElementById(`tok-${idx}`);
            if (btn) { btn.classList.add('assigned'); btn.textContent = '✓ Asignado'; }
            if (tok)  { tok.classList.remove('active'); tok.classList.add('assigned'); }
            if (frameMap[idx]) {
              setFrameErr(frameMap[idx].err, false);
              setFrameErr(frameMap[idx].fix, true);
              const li = document.querySelector(`[data-layer="${frameMap[idx].layer}"]`);
              if (li) li.style.color = 'rgba(55,245,180,0.8)';
            }
            resolved++;
            const issuesLeft = Math.max(0, 26 - Math.round(resolved * 6.5));
            animCount('stat-issues', 26 - Math.round((resolved - 1) * 6.5), issuesLeft, 0.4);
            animCount('stat-resolved', Math.round((resolved - 1) * 6.5), Math.min(26, Math.round(resolved * 6.5)), 0.4);
            const newAdopt = 77 + resolved * 4.75;
            const newSalud = 95 + resolved * 1.25;
            setDonut('donut-adopt', Math.min(96, newAdopt));
            setDonut('donut-salud', Math.min(99, newSalud));
            animCount('adopt-pct', Math.round(77 + (resolved - 1) * 4.75), Math.min(96, Math.round(newAdopt)), 0.6, '%');
            animCount('salud-pct', Math.round(95 + (resolved - 1) * 1.25), Math.min(99, Math.round(newSalud)), 0.6, '%');
          })(i), null, '+=0.3');
        }

        // Toast 2: tokens
        ftl.call(() => showToast('🎨 Tokens agregados al sistema', '#37b87a'), null, '+=0.2');

        // Done
        ftl.call(() => {
          setStatus('<strong>96%</strong> adopción alcanzada ✓');
          setPulse('#37b87a');
          animCount('stat-issues', 0, 0, 0.3);
          animCount('stat-resolved', 20, 26, 0.5);
          setDonut('donut-adopt', 96);
          setDonut('donut-salud', 99);
          animCount('adopt-pct', 93, 96, 0.6, '%');
          animCount('salud-pct', 98, 99, 0.4, '%');
          if (fb) fb.textContent = '✓ Todo reparado';
          setTimeout(launchConfetti, 300);
        }, null, '+=0.5');
      }

      // ── scan phase (auto on scroll) ──
      function playDemo() {
        if (demoPlayed) return;
        demoPlayed = true;

        const tl = gsap.timeline();

        // Entrance
        tl.to(win, { opacity: 1, y: 0, scale: 1, duration: 0.85, ease: 'power3.out' });

        // Scan start
        tl.call(() => {
          setStatus('<strong>Escaneando…</strong> 61 nodos');
          setPulse('#9747ff');
        }, null, '+=0.3');

        const scanLine = document.getElementById('scan-line');
        const frameH   = document.getElementById('design-frame').offsetHeight || 420;
        tl.to(scanLine, { opacity: 1, duration: 0.2 });
        tl.to(scanLine, {
          top: frameH, duration: 2.4, ease: 'power1.inOut',
          onUpdate() {
            const pct = this.progress();
            [0, 0.08, 0.15, 0.22, 0.32, 0.42, 0.55, 0.65, 0.77, 0.88].forEach((t, i) => {
              const li = document.querySelector(`[data-layer="${i}"]`);
              if (li && pct >= t && !li.classList.contains('scanning-state'))
                li.classList.add('scanning-state');
            });
          }
        });
        tl.to(scanLine, { opacity: 0, duration: 0.3 });

        // Results
        tl.call(() => {
          setStatus('<strong>Análisis completo</strong> — 26 issues encontrados');
          setPulse('#e53935');
          setTimeout(() => setDonut('donut-adopt', 77), 80);
          setTimeout(() => setDonut('donut-salud', 95), 200);
          animCount('adopt-pct', 0, 77, 1.4, '%');
          animCount('salud-pct', 0, 95, 1.4, '%');
          animCount('stat-nodos', 0, 61, 1.2);
          animCount('stat-props', 0, 108, 1.2);
          animCount('stat-issues', 0, 26, 1.0);
          frameMap.forEach((m, fi) => setTimeout(() => setFrameErr(m.err, true), fi * 220));
        }, null, '+=0.2');

        // Resolver header
        tl.call(() => {
          setStatus('<strong>26 issues</strong> — tokens listos para asignar');
          setPulse('#f5a623');
          const rh = document.getElementById('resolver-header');
          if (rh) rh.classList.add('visible');
        }, null, '+=1.8');

        // Token cards appear (but NOT auto-assigned)
        for (let i = 0; i < 4; i++) {
          tl.call((idx => () => {
            const tok = document.getElementById(`tok-${idx}`);
            if (tok) tok.classList.add('visible');
          })(i), null, `+=${i === 0 ? 0.15 : 0.22}`);
        }

        // Show fix-all button + scroll panel to expose it
        tl.call(() => {
          setStatus('<strong>Listo</strong> — presiona Arreglar Todo');
          setPulse('#37b87a');
          const fw     = document.getElementById('fix-all-wrap');
          const plugin = document.querySelector('.figma-plugin');
          if (fw) {
            fw.style.display = 'block';
            // solo opacidad — sin y-transform que rompe el layout del panel
            gsap.fromTo(fw, { opacity: 0 }, { opacity: 1, duration: 0.5, ease: 'power2.out' });
          }
          // scroll suave al fondo del panel para mostrar el botón
          if (plugin) gsap.to(plugin, { scrollTop: plugin.scrollHeight, duration: 0.6, ease: 'power2.inOut' });
        }, null, '+=0.3');

        // Animated cursor drops in after 2.4s
        tl.call(() => showAnimatedCursor(), null, '+=2.4');
      }

      // ── button clicks ──
      const fixAllBtn = document.getElementById('fix-all-btn');
      if (fixAllBtn) fixAllBtn.addEventListener('click', runFixPhase);


      // ── 3D tilt on mouse move ──
      win.addEventListener('mousemove', (e) => {
        const r = win.getBoundingClientRect();
        const dx = (e.clientX - (r.left + r.width / 2)) / (r.width / 2);
        const dy = (e.clientY - (r.top + r.height / 2)) / (r.height / 2);
        gsap.to(win, {
          rotateY: dx * 5, rotateX: -dy * 3.5, duration: 0.35, ease: 'power2.out',
          transformPerspective: 1300, transformOrigin: 'center center'
        });
      });
      win.addEventListener('mouseleave', () => {
        gsap.to(win, { rotateX: 0, rotateY: 0, duration: 0.7, ease: 'power2.out' });
      });

      // ── replay button ──
      const replayBtn = document.getElementById('demo-replay-btn');
      if (replayBtn) {
        replayBtn.addEventListener('click', () => {
          resetDemo();
          setTimeout(playDemo, 350);
        });
      }

      // ── ScrollTrigger launch ──
      ScrollTrigger.create({
        trigger: win, start: 'top 82%',
        onEnter: playDemo,
        onLeaveBack: resetDemo,
      });
    })();

    // ============================================
    // LIVE STATS TICKER — count up numbers on enter
    // ============================================
    (function () {
      const ticker = document.querySelector('.live-ticker');
      if (!ticker) return;
      ScrollTrigger.create({
        trigger: ticker, start: 'top 90%', once: true,
        onEnter() {
          ticker.querySelectorAll('.ticker-num[data-to]').forEach(el => {
            const target = parseInt(el.dataset.to);
            const obj = { v: 0 };
            gsap.to(obj, {
              v: target, duration: 1.6, ease: 'power2.out',
              onUpdate() { el.textContent = Math.round(obj.v).toLocaleString('es'); }
            });
          });
        }
      });
    })();

    // ============================================
    // SMOOTH SCROLL FOR NAV LINKS
    // ============================================
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
          target.scrollIntoView({
            behavior: prefersReducedMotion ? 'auto' : 'smooth'
          });
        }
      });
    });
