import * as THREE from "three";

/**
 * One procedural 3D object per service, carousel-style.
 * `setPos(pos)` takes a continuous service index (0..n-1) — fractional values
 * cross-fade/slide between neighbours. `setReveal(0..1)` scales the stage in.
 */
export type ServicesScene = {
  setPos: (pos: number) => void;
  setReveal: (v: number) => void;
  setAccent: (hex: string) => void;
  start: () => void;
  stop: () => void;
  resize: () => void;
  dispose: () => void;
};

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const easeOutExpo = (t: number) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t));
const easeOutBack = (t: number) => {
  const c1 = 1.70158, c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
};

export function createServicesScene(
  canvas: HTMLCanvasElement,
  opts: { accent?: string; reducedMotion?: boolean } = {},
): ServicesScene {
  const accent = new THREE.Color(opts.accent ?? "#d4610e");
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
  camera.position.set(0, 0.5, 8);
  camera.lookAt(0, 0, 0);

  scene.add(new THREE.HemisphereLight(0xffffff, 0x1a1818, 1.1));
  const key = new THREE.DirectionalLight(0xffffff, 2.6);
  key.position.set(3, 4, 5);
  scene.add(key);
  const fill = new THREE.DirectionalLight(0xffffff, 0.6);
  fill.position.set(-4, 1, 2);
  scene.add(fill);
  const rim = new THREE.PointLight(accent, 40, 20);
  rim.position.set(-2.5, -1.2, -2);
  scene.add(rim);

  const M = {
    graphite: new THREE.MeshStandardMaterial({ color: 0x3a3838, metalness: 0.55, roughness: 0.32 }),
    light: new THREE.MeshStandardMaterial({ color: 0xe4e1dc, metalness: 0.1, roughness: 0.35 }),
    accent: new THREE.MeshStandardMaterial({ color: accent, roughness: 0.35, emissive: accent, emissiveIntensity: 0.25 }),
    dark: new THREE.MeshStandardMaterial({ color: 0x0c0b0b, metalness: 0.5, roughness: 0.08 }),
    wire: new THREE.LineBasicMaterial({ color: accent }),
  };
  const mesh = (g: THREE.BufferGeometry, m: THREE.Material, x = 0, y = 0, z = 0) => {
    const o = new THREE.Mesh(g, m);
    o.position.set(x, y, z);
    return o;
  };

  const objs: THREE.Group[] = [];

  // 0 · Website Design — fanned stack of browser panels
  const panels: THREE.Group[] = [];
  {
    const g = new THREE.Group();
    for (let i = 0; i < 3; i++) {
      const p = new THREE.Group();
      p.add(mesh(new THREE.BoxGeometry(2.4, 1.6, 0.06), i === 2 ? M.light : M.graphite));
      if (i === 2) {
        [0, 1, 2].forEach((k) =>
          p.add(mesh(new THREE.SphereGeometry(0.05, 16, 16), k === 0 ? M.accent : M.graphite, -1.0 + k * 0.16, 0.62, 0.05)),
        );
        p.add(mesh(new THREE.BoxGeometry(1.2, 0.5, 0.04), M.accent, -0.45, 0.12, 0.05));
        p.add(mesh(new THREE.BoxGeometry(0.7, 0.5, 0.04), M.graphite, 0.65, 0.12, 0.05));
        [0, 1].forEach((k) =>
          p.add(mesh(new THREE.BoxGeometry(1.9 - k * 0.6, 0.07, 0.03), M.graphite, -0.15 - k * 0.3, -0.38 - k * 0.18, 0.05)),
        );
      }
      g.add(p);
      panels.push(p);
    }
    objs.push(g);
  }

  // 1 · Website Development — 3×3×3 blocks assembling
  const cubes: { m: THREE.Mesh; home: THREE.Vector3; seed: number }[] = [];
  {
    const g = new THREE.Group();
    const geo = new THREE.BoxGeometry(0.46, 0.46, 0.46);
    for (let x = -1; x <= 1; x++)
      for (let y = -1; y <= 1; y++)
        for (let z = -1; z <= 1; z++) {
          const mat = x === 1 && y === 1 && z === 1 ? M.accent : (x + y + z) % 2 ? M.light : M.graphite;
          const m = mesh(geo, mat, x * 0.52, y * 0.52, z * 0.52);
          cubes.push({ m, home: m.position.clone(), seed: (x + 2) * 9 + (y + 2) * 3 + z });
          g.add(m);
        }
    objs.push(g);
  }

  // 2 · Website Strategy — gyroscope rings around a core
  const rings: THREE.Mesh[] = [];
  {
    const g = new THREE.Group();
    [1.45, 1.1, 0.78].forEach((r, i) => {
      const t = mesh(new THREE.TorusGeometry(r, 0.035, 16, 120), i === 0 ? M.light : M.graphite);
      g.add(t);
      rings.push(t);
    });
    g.add(mesh(new THREE.SphereGeometry(0.34, 48, 48), M.accent));
    const sat = mesh(new THREE.SphereGeometry(0.09, 24, 24), M.light, 1.45, 0, 0);
    rings[0].add(sat);
    objs.push(g);
  }

  // 3 · Photo & Video — camera lens
  const lens = new THREE.Group();
  {
    const g = new THREE.Group();
    const cyl = (r: number, l: number, m: THREE.Material, z: number) => {
      const c = mesh(new THREE.CylinderGeometry(r, r, l, 64), m, 0, 0, z);
      c.rotation.x = Math.PI / 2;
      lens.add(c);
    };
    cyl(0.95, 1.1, M.graphite, -0.2);
    cyl(1.02, 0.18, M.light, 0.18);
    cyl(1.0, 0.08, M.graphite, 0.36);
    cyl(0.82, 0.05, M.dark, 0.42);
    lens.add(mesh(new THREE.TorusGeometry(0.88, 0.025, 16, 100), M.accent, 0, 0, 0.42));
    lens.add(mesh(new THREE.CircleGeometry(0.42, 48), M.graphite, 0, 0, 0.45));
    const knurl = new THREE.BoxGeometry(0.04, 0.04, 0.16);
    for (let k = 0; k < 24; k++) {
      const a = (k / 24) * Math.PI * 2;
      lens.add(mesh(knurl, M.graphite, Math.cos(a) * 1.04, Math.sin(a) * 1.04, 0.18));
    }
    g.add(lens);
    objs.push(g);
  }

  // 4 · 3D Development — faceted solid inside an accent wireframe shell
  const solid = mesh(new THREE.IcosahedronGeometry(1.0, 0), M.graphite);
  const shell = new THREE.IcosahedronGeometry(1.32, 1);
  const wire = new THREE.LineSegments(new THREE.EdgesGeometry(shell), M.wire);
  shell.dispose();
  {
    const g = new THREE.Group();
    g.add(solid, wire);
    objs.push(g);
  }

  objs.forEach((o) => scene.add(o));

  let pos = 0;
  let reveal = 0;
  let raf = 0;
  let running = false;
  const t0 = performance.now();

  const draw = () => {
    const T = opts.reducedMotion ? 1.2 : (performance.now() - t0) / 1000;
    objs.forEach((o, i) => {
      const d = pos - i;
      const act = clamp(1 - Math.abs(d), 0, 1);
      o.visible = act > 0.001 && reveal > 0.001;
      if (!o.visible) return;
      const e = easeOutExpo(act);
      o.scale.setScalar(Math.max((0.35 + 0.65 * e) * easeOutBack(reveal), 0.001));
      o.position.set(-d * 2.6, Math.sin(T * 1.4 + i) * 0.07, -(1 - e) * 1.5);
      o.rotation.set(0.18, T * 0.5 - d * 1.4, 0);
    });
    // per-object detail motion
    {
      const d = pos - 0, e = easeOutExpo(clamp(1 - Math.abs(d), 0, 1));
      objs[0].rotation.set(0.12, Math.sin(T * 0.7) * 0.35 + 0.25 - d * 1.4, 0);
      panels.forEach((p, k) => {
        p.position.set((k - 1) * 0.28 * e, (k - 1) * -0.18 * e, (k - 2) * 0.45 * e);
        p.rotation.y = -0.35;
      });
    }
    {
      const asm = easeOutExpo(clamp(1 - Math.abs(pos - 1) * 1.4, 0, 1));
      cubes.forEach(({ m, home, seed }) => {
        const f = 1 + (1 - asm) * (1.6 + (seed % 5) * 0.25);
        m.position.set(home.x * f, home.y * f, home.z * f);
        m.rotation.set((1 - asm) * seed, (1 - asm) * seed * 0.7, 0);
      });
    }
    rings[0].rotation.set(T * 0.9, T * 0.4, 0);
    rings[1].rotation.set(-T * 0.6, 0, T * 0.8);
    rings[2].rotation.set(Math.PI / 2, T * 1.2, 0);
    lens.rotation.set(-0.25, -0.5 + Math.sin(T * 0.8) * 0.25, T * 0.3);
    objs[3].rotation.y = -(pos - 3) * 1.4;
    wire.rotation.set(T * 0.3, -T * 0.45, 0);
    solid.rotation.set(-T * 0.2, T * 0.6, 0);
    renderer.render(scene, camera);
  };

  const loop = () => {
    draw();
    raf = requestAnimationFrame(loop);
  };

  const resize = () => {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    camera.aspect = w / h;
    // keep objects framed in narrow (mobile) cards
    camera.position.z = w / h < 0.85 ? 8 / Math.max(w / h, 0.55) * 0.85 : 8;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
    draw();
  };
  resize();

  return {
    setPos: (p) => { pos = p; if (!running) draw(); },
    setReveal: (v) => { reveal = v; if (!running) draw(); },
    setAccent: (hex) => {
      accent.set(hex);
      M.accent.color.copy(accent);
      M.accent.emissive.copy(accent);
      M.wire.color.copy(accent);
      rim.color.copy(accent);
    },
    start: () => { if (running || opts.reducedMotion) return; running = true; loop(); },
    stop: () => { running = false; cancelAnimationFrame(raf); },
    resize,
    dispose: () => {
      running = false;
      cancelAnimationFrame(raf);
      const geometries = new Set<THREE.BufferGeometry>();
      scene.traverse((child) => {
        if (child instanceof THREE.Mesh || child instanceof THREE.LineSegments) geometries.add(child.geometry);
      });
      geometries.forEach((geometry) => geometry.dispose());
      Object.values(M).forEach((m) => m.dispose());
      renderer.dispose();
    },
  };
}
