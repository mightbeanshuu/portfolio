import * as THREE from 'three';

const canvas = document.getElementById('fluidCanvas');
if (canvas && !matchMedia('(prefers-reduced-motion: reduce)').matches) initFluid(canvas);

function initFluid(canvas) {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: false,
    powerPreference: 'low-power',
  });
  renderer.setPixelRatio(1); // we apply our own scale below

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

  const uniforms = {
    uTime: { value: 0 },
    uMouse: { value: new THREE.Vector2(0.5, 0.5) },
    uMouseFlow: { value: new THREE.Vector2(0, 0) },
    uResolution: { value: new THREE.Vector2(1, 1) },
  };

  const mat = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: `
      void main() { gl_Position = vec4(position, 1.0); }
    `,
    fragmentShader: `
      precision mediump float;
      uniform float uTime;
      uniform vec2 uMouse;
      uniform vec2 uMouseFlow;
      uniform vec2 uResolution;

      // Simplex 2D noise (Ashima Arts) — public domain
      vec3 mod289(vec3 x){return x-floor(x*(1./289.))*289.;}
      vec2 mod289(vec2 x){return x-floor(x*(1./289.))*289.;}
      vec3 permute(vec3 x){return mod289(((x*34.)+1.)*x);}

      float snoise(vec2 v) {
        const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                            -0.577350269189626, 0.024390243902439);
        vec2 i  = floor(v + dot(v, C.yy));
        vec2 x0 = v - i + dot(i, C.xx);
        vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
        vec4 x12 = x0.xyxy + C.xxzz;
        x12.xy -= i1;
        i = mod289(i);
        vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0))
                                + i.x + vec3(0.0, i1.x, 1.0));
        vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy),
                                            dot(x12.zw,x12.zw)), 0.0);
        m = m*m; m = m*m;
        vec3 x = 2.0 * fract(p * C.www) - 1.0;
        vec3 h = abs(x) - 0.5;
        vec3 ox = floor(x + 0.5);
        vec3 a0 = x - ox;
        m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
        vec3 g;
        g.x  = a0.x  * x0.x  + h.x  * x0.y;
        g.yz = a0.yz * x12.xz + h.yz * x12.yw;
        return 130.0 * dot(m, g);
      }

      // Cheap 2-octave FBM
      float fbm(vec2 p) {
        float f = 0.0;
        f += 0.55 * snoise(p);
        f += 0.27 * snoise(p * 2.07 + vec2(3.1, 1.7));
        return f;
      }

      void main() {
        vec2 uv = gl_FragCoord.xy / uResolution.xy;
        vec2 p = uv * 2.0 - 1.0;
        float ar = uResolution.x / uResolution.y;
        p.x *= ar;

        float t = uTime * 0.06;
        vec2 flow = uMouseFlow * 0.5;

        vec2 q = vec2(fbm(p + t + flow),
                      fbm(p + vec2(2.3, -1.1) + t));
        vec2 r = vec2(fbm(p + 1.5*q + vec2(1.7, 9.2) - t*0.12),
                      fbm(p + 1.5*q + vec2(8.3, 2.8) + t*0.10));
        float n = fbm(p + 1.7*r);

        // Mouse highlight
        vec2 m = (uMouse * 2.0 - 1.0);
        m.x *= ar;
        float md = length(p - m);
        n += smoothstep(0.7, 0.0, md) * 0.45;

        // Color palette
        vec3 c1 = vec3(0.545, 0.486, 1.000); // #8b7cff
        vec3 c2 = vec3(0.494, 0.906, 0.769); // #7ee7c4
        vec3 c3 = vec3(1.000, 0.702, 0.486); // #ffb37c
        vec3 c4 = vec3(0.043, 0.043, 0.059); // bg

        vec3 col = mix(c4, c1, smoothstep(-0.3, 0.45, n));
        col = mix(col, c2, smoothstep(0.15, 0.7, n + 0.25 * length(r)));
        col = mix(col, c3, smoothstep(0.55, 1.0, n + 0.35 * length(q)));

        // Vignette so edges blend into bg
        float vig = smoothstep(1.4, 0.4, length(p));
        col *= vig;

        gl_FragColor = vec4(col, 1.0);
      }
    `,
  });

  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat);
  scene.add(mesh);

  const SCALE = 0.55; // render at 55% — smooth and cheap
  function resize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const rw = Math.max(1, Math.floor(w * SCALE));
    const rh = Math.max(1, Math.floor(h * SCALE));
    renderer.setSize(rw, rh, false);
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    uniforms.uResolution.value.set(rw, rh);
  }
  window.addEventListener('resize', resize, { passive: true });
  resize();

  // Mouse, eased
  const targetM = new THREE.Vector2(0.5, 0.5);
  const flow = new THREE.Vector2(0, 0);
  let lastM = { x: 0.5, y: 0.5 };
  window.addEventListener('pointermove', (e) => {
    const x = e.clientX / window.innerWidth;
    const y = 1.0 - e.clientY / window.innerHeight;
    flow.x += (x - lastM.x) * 4;
    flow.y += (y - lastM.y) * 4;
    targetM.set(x, y);
    lastM = { x, y };
  }, { passive: true });

  // Frame-rate cap to ~30fps to reserve perf
  let running = true;
  let lastFrame = 0;
  const FRAME_MS = 1000 / 30;
  const clock = new THREE.Clock();

  function animate(now) {
    if (!running) return;
    requestAnimationFrame(animate);
    if (now - lastFrame < FRAME_MS) return;
    lastFrame = now;

    uniforms.uTime.value = clock.getElapsedTime();
    uniforms.uMouse.value.lerp(targetM, 0.06);
    flow.multiplyScalar(0.9);
    uniforms.uMouseFlow.value.copy(flow);

    renderer.render(scene, camera);
  }
  requestAnimationFrame(animate);

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      running = false;
    } else {
      running = true;
      requestAnimationFrame(animate);
    }
  });
}
