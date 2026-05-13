import * as THREE from 'three';

const canvas = document.getElementById('robot-canvas');
if (canvas) initRobot(canvas);

function initRobot(canvas) {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
    powerPreference: 'high-performance',
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
  camera.position.set(0, 0.4, 5.6);

  // Lights
  scene.add(new THREE.AmbientLight(0xffffff, 0.35));

  const key = new THREE.DirectionalLight(0xffffff, 1.6);
  key.position.set(3, 5, 4);
  scene.add(key);

  const rim = new THREE.PointLight(0x8b7cff, 5, 14);
  rim.position.set(-3.5, 1.5, -2);
  scene.add(rim);

  const fill = new THREE.PointLight(0x7ee7c4, 2.6, 12);
  fill.position.set(3.2, -1.2, 2.5);
  scene.add(fill);

  const warm = new THREE.PointLight(0xffb37c, 1.8, 10);
  warm.position.set(0, -3, 3);
  scene.add(warm);

  // Materials
  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0xe9ebf4,
    metalness: 0.78,
    roughness: 0.22,
  });
  const accentBodyMat = new THREE.MeshStandardMaterial({
    color: 0xb8bcd3,
    metalness: 0.85,
    roughness: 0.28,
  });
  const darkMat = new THREE.MeshStandardMaterial({
    color: 0x191b27,
    metalness: 0.6,
    roughness: 0.45,
  });
  const glowPurple = new THREE.MeshStandardMaterial({
    color: 0x8b7cff,
    emissive: 0x8b7cff,
    emissiveIntensity: 2.6,
    metalness: 0.3,
    roughness: 0.4,
  });
  const glowTeal = new THREE.MeshStandardMaterial({
    color: 0x7ee7c4,
    emissive: 0x7ee7c4,
    emissiveIntensity: 2.2,
    metalness: 0.3,
    roughness: 0.4,
  });

  // Root group
  const robot = new THREE.Group();
  scene.add(robot);

  // ── Head ──
  const headGroup = new THREE.Group();
  headGroup.position.y = 1.15;
  robot.add(headGroup);

  const headGeo = new THREE.BoxGeometry(1.25, 1.05, 1.05, 1, 1, 1);
  const head = new THREE.Mesh(headGeo, bodyMat);
  headGroup.add(head);

  // Head edges
  const headEdges = new THREE.LineSegments(
    new THREE.EdgesGeometry(headGeo),
    new THREE.LineBasicMaterial({ color: 0x393d52, transparent: true, opacity: 0.7 })
  );
  headGroup.add(headEdges);

  // Face screen (recessed darker plate)
  const faceGeo = new THREE.BoxGeometry(0.96, 0.62, 0.06);
  const face = new THREE.Mesh(faceGeo, darkMat);
  face.position.set(0, 0.05, 0.535);
  headGroup.add(face);

  // Eyes
  const eyeGeo = new THREE.SphereGeometry(0.095, 24, 24);
  const leftEye = new THREE.Mesh(eyeGeo, glowPurple);
  leftEye.position.set(-0.22, 0.1, 0.6);
  headGroup.add(leftEye);
  const rightEye = new THREE.Mesh(eyeGeo, glowPurple);
  rightEye.position.set(0.22, 0.1, 0.6);
  headGroup.add(rightEye);

  // Mouth (visor strip)
  const mouth = new THREE.Mesh(
    new THREE.BoxGeometry(0.5, 0.06, 0.04),
    glowTeal.clone()
  );
  mouth.position.set(0, -0.18, 0.575);
  headGroup.add(mouth);

  // Side panels (ear/comms)
  const sideGeo = new THREE.CylinderGeometry(0.13, 0.13, 0.1, 16);
  const earL = new THREE.Mesh(sideGeo, accentBodyMat);
  earL.rotation.z = Math.PI / 2;
  earL.position.set(-0.66, 0, 0);
  headGroup.add(earL);
  const earR = earL.clone();
  earR.position.x = 0.66;
  headGroup.add(earR);

  // Antenna
  const antGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.45);
  const ant = new THREE.Mesh(antGeo, darkMat);
  ant.position.y = 0.78;
  headGroup.add(ant);
  const antBall = new THREE.Mesh(
    new THREE.SphereGeometry(0.085, 24, 24),
    glowTeal.clone()
  );
  antBall.position.y = 1.05;
  headGroup.add(antBall);

  // Neck
  const neck = new THREE.Mesh(
    new THREE.CylinderGeometry(0.16, 0.2, 0.22, 16),
    accentBodyMat
  );
  neck.position.y = 0.5;
  robot.add(neck);

  // ── Body ──
  const bodyGroup = new THREE.Group();
  robot.add(bodyGroup);

  const torsoGeo = new THREE.BoxGeometry(1.5, 1.4, 0.95);
  const torso = new THREE.Mesh(torsoGeo, bodyMat);
  torso.position.y = -0.3;
  bodyGroup.add(torso);

  const torsoEdges = new THREE.LineSegments(
    new THREE.EdgesGeometry(torsoGeo),
    new THREE.LineBasicMaterial({ color: 0x393d52, transparent: true, opacity: 0.7 })
  );
  torsoEdges.position.y = -0.3;
  bodyGroup.add(torsoEdges);

  // Chest core (the heart)
  const core = new THREE.Mesh(
    new THREE.CylinderGeometry(0.15, 0.15, 0.05, 24),
    glowPurple.clone()
  );
  core.rotation.x = Math.PI / 2;
  core.position.set(0, -0.15, 0.5);
  bodyGroup.add(core);
  const coreRing = new THREE.Mesh(
    new THREE.RingGeometry(0.18, 0.21, 32),
    new THREE.MeshBasicMaterial({ color: 0x8b7cff, transparent: true, opacity: 0.6, side: THREE.DoubleSide })
  );
  coreRing.position.set(0, -0.15, 0.51);
  bodyGroup.add(coreRing);

  // Chest detail vents
  for (let i = 0; i < 3; i++) {
    const vent = new THREE.Mesh(
      new THREE.BoxGeometry(0.6, 0.025, 0.02),
      darkMat
    );
    vent.position.set(0, -0.6 + i * 0.06, 0.5);
    bodyGroup.add(vent);
  }

  // Shoulder caps
  function makeShoulder(x) {
    const s = new THREE.Mesh(
      new THREE.SphereGeometry(0.26, 24, 24),
      accentBodyMat
    );
    s.position.set(x, 0.15, 0);
    return s;
  }
  bodyGroup.add(makeShoulder(-0.86));
  bodyGroup.add(makeShoulder(0.86));

  // Arms
  function makeArm(x) {
    const arm = new THREE.Group();
    arm.position.set(x, 0.05, 0);

    const upper = new THREE.Mesh(
      new THREE.CylinderGeometry(0.13, 0.11, 0.55, 16),
      bodyMat
    );
    upper.position.y = -0.3;
    arm.add(upper);

    const elbow = new THREE.Mesh(
      new THREE.SphereGeometry(0.15, 20, 20),
      darkMat
    );
    elbow.position.y = -0.6;
    arm.add(elbow);

    const lower = new THREE.Mesh(
      new THREE.CylinderGeometry(0.1, 0.1, 0.42, 16),
      bodyMat
    );
    lower.position.y = -0.85;
    arm.add(lower);

    const hand = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.16, 0),
      accentBodyMat
    );
    hand.position.y = -1.12;
    arm.add(hand);

    return arm;
  }
  const armL = makeArm(-0.86);
  const armR = makeArm(0.86);
  bodyGroup.add(armL);
  bodyGroup.add(armR);

  // Hip base
  const hip = new THREE.Mesh(
    new THREE.BoxGeometry(1.1, 0.22, 0.85),
    accentBodyMat
  );
  hip.position.y = -1.12;
  bodyGroup.add(hip);

  // Scale + position whole robot
  robot.position.y = -0.35;
  robot.scale.setScalar(0.92);

  // Floating particles
  const particleCount = 40;
  const particleGeo = new THREE.BufferGeometry();
  const positions = new Float32Array(particleCount * 3);
  for (let i = 0; i < particleCount; i++) {
    positions[i * 3]     = (Math.random() - 0.5) * 6;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 4;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 3 - 1;
  }
  particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const particleMat = new THREE.PointsMaterial({
    color: 0x8b7cff,
    size: 0.035,
    transparent: true,
    opacity: 0.55,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const particles = new THREE.Points(particleGeo, particleMat);
  scene.add(particles);

  // Mouse tracking (global, but normalized to the canvas region)
  let targetX = 0, targetY = 0;
  let curX = 0, curY = 0;

  function setTargetFromMouse(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = (clientX - cx) / (window.innerWidth / 2);
    const dy = (clientY - cy) / (window.innerHeight / 2);
    targetX = Math.max(-1.4, Math.min(1.4, dx));
    targetY = Math.max(-1.0, Math.min(1.0, dy));
  }

  window.addEventListener('pointermove', (e) => {
    setTargetFromMouse(e.clientX, e.clientY);
  }, { passive: true });

  // Device orientation fallback for touch devices
  window.addEventListener('deviceorientation', (e) => {
    if (e.gamma == null || e.beta == null) return;
    targetX = Math.max(-1, Math.min(1, e.gamma / 30));
    targetY = Math.max(-1, Math.min(1, (e.beta - 30) / 40));
  }, { passive: true });

  // Animation loop
  let running = true;
  const clock = new THREE.Clock();

  function animate() {
    if (!running) return;
    const t = clock.getElapsedTime();

    curX += (targetX - curX) * 0.07;
    curY += (targetY - curY) * 0.07;

    // Whole robot rotates with cursor
    robot.rotation.y = curX * 0.65;
    robot.rotation.x = curY * 0.28;

    // Head tracks a bit further
    headGroup.rotation.y = curX * 0.25;
    headGroup.rotation.x = curY * 0.15;

    // Idle float
    robot.position.y = -0.35 + Math.sin(t * 0.9) * 0.06;

    // Antenna ball pulse
    antBall.material.emissiveIntensity = 2.2 + Math.sin(t * 3.2) * 0.6;
    // Core breathe
    core.material.emissiveIntensity = 2.4 + Math.sin(t * 1.4) * 0.4;
    coreRing.material.opacity = 0.5 + Math.sin(t * 1.4) * 0.2;
    // Eye blink occasionally
    const blink = Math.sin(t * 0.35) > 0.985 ? 0.05 : 1;
    leftEye.scale.y = blink;
    rightEye.scale.y = blink;

    // Mouth flicker (very subtle)
    mouth.material.emissiveIntensity = 2 + Math.sin(t * 4) * 0.5;

    // Arms sway
    armL.rotation.x = Math.sin(t * 1.1) * 0.08;
    armR.rotation.x = -Math.sin(t * 1.1) * 0.08;

    // Particles drift
    const pos = particles.geometry.attributes.position;
    for (let i = 0; i < particleCount; i++) {
      pos.array[i * 3 + 1] += 0.003;
      if (pos.array[i * 3 + 1] > 2) pos.array[i * 3 + 1] = -2;
    }
    pos.needsUpdate = true;
    particles.rotation.y = curX * 0.2;

    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }
  animate();

  // Resize
  function resize() {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (w === 0 || h === 0) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);
  resize();

  // Pause when offscreen / tab hidden
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) running = false;
    else { running = true; animate(); }
  });
}
