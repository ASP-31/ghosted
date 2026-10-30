import * as THREE from 'three';

export function createScene() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x05070c);
  scene.fog = new THREE.Fog(0x05070c, 5, 14);

  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.set(0, 1.6, 1.1);

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.9;
  document.getElementById('app').appendChild(renderer.domElement);

  const colliders = [];

  const W = 3.8, D = 4.5, H = 2.5;
  const hw = W / 2, hd = D / 2;

  function box(pos, size, color, collider = true, opts = {}) {
    const geo = new THREE.BoxGeometry(size[0], size[1], size[2]);
    const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.75, metalness: 0.05, ...opts });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(pos[0], pos[1], pos[2]);
    if (opts.rotation) mesh.rotation.set(opts.rotation[0], opts.rotation[1], opts.rotation[2]);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);
    if (collider) colliders.push(new THREE.Box3().setFromObject(mesh));
    return mesh;
  }

  // Floor
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(W, D),
    new THREE.MeshStandardMaterial({ color: 0x1b1a18, roughness: 0.85, metalness: 0.0 })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  // Ceiling
  const ceiling = new THREE.Mesh(
    new THREE.PlaneGeometry(W, D),
    new THREE.MeshStandardMaterial({ color: 0x0e0e13, roughness: 1 })
  );
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.y = H;
  ceiling.receiveShadow = true;
  scene.add(ceiling);

  // Walls
  const wallColor = 0x202028;
  box([0, H / 2, -hd], [W, H, 0.1], wallColor);
  box([0, H / 2, hd], [W, H, 0.1], wallColor);
  box([-hw, H / 2, 0], [0.1, H, D], wallColor);
  box([hw, H / 2, 0], [0.1, H, D], wallColor);

  // Skirting (subtle)
  const skirt = 0x15151b;
  box([0, 0.05, -hd + 0.02], [W, 0.1, 0.06], skirt, false);
  box([0, 0.05, hd - 0.02], [W, 0.1, 0.06], skirt, false);

  // Window on left wall
  const winX = -hw + 0.06;
  const winZ = -0.7;
  const winW = 1.0, winH = 0.75;
  const glass = new THREE.Mesh(
    new THREE.PlaneGeometry(winW, winH),
    new THREE.MeshStandardMaterial({ color: 0x6f89a8, emissive: 0x1a2a40, emissiveIntensity: 0.35, transparent: true, opacity: 0.55, roughness: 0.1, metalness: 0.2 })
  );
  glass.position.set(winX, 1.35, winZ);
  glass.rotation.y = Math.PI / 2;
  scene.add(glass);
  // Window frame
  box([winX + 0.02, 1.35, winZ], [0.06, winH + 0.12, winW + 0.12], 0x16161c, false);
  // Sill
  box([winX + 0.08, 0.95, winZ], [0.16, 0.06, winW + 0.2], 0x1a1a20, false);

  // Door on front wall
  const doorX = 0.9;
  const doorZ = hd - 0.05;
  box([doorX, 1.05, doorZ], [0.82, 2.05, 0.08], 0x3a2e23, false);
  // Door frame
  box([doorX, 1.1, doorZ + 0.02], [0.92, 2.2, 0.04], 0x1a1612, false);
  // Door handle
  box([doorX + 0.34, 1.0, doorZ - 0.06], [0.05, 0.12, 0.08], 0x8a7a5a, false, { metalness: 0.6, roughness: 0.3 });
  // Hinge plates
  box([doorX - 0.34, 1.8, doorZ - 0.06], [0.03, 0.15, 0.04], 0x555555, false, { metalness: 0.7 });

  // Bed (right/back)
  const bedX = 0.85, bedZ = -1.45;
  box([bedX, 0.25, bedZ], [1.5, 0.5, 1.1], 0x2f2f36);
  box([bedX, 0.55, bedZ], [1.4, 0.12, 1.0], 0x4a4a52, false, { roughness: 0.9 });
  // Headboard
  box([bedX, 0.7, bedZ - 0.58], [1.5, 0.9, 0.12], 0x26262e, false);
  // Pillow
  box([bedX, 0.66, bedZ - 0.32], [0.85, 0.12, 0.3], 0x7a7a82, false);

  // Desk (left/back, under window side)
  const deskX = -1.45, deskZ = -0.7;
  box([deskX, 0.375, deskZ], [0.5, 0.75, 1.0], 0x3b2f24);
  box([deskX + 0.18, 0.78, deskZ], [0.55, 0.05, 1.05], 0x4a3a2c, false);
  // Desk legs accent
  box([deskX - 0.18, 0.2, deskZ - 0.42], [0.06, 0.4, 0.06], 0x2a221a, false);
  box([deskX - 0.18, 0.2, deskZ + 0.42], [0.06, 0.4, 0.06], 0x2a221a, false);

  // Chair
  const chairX = -0.95, chairZ = -0.95;
  box([chairX, 0.25, chairZ], [0.4, 0.5, 0.4], 0x25252b);
  box([chairX, 0.62, chairZ - 0.16], [0.4, 0.45, 0.08], 0x25252b, false);

  // Digital clock on desk
  box([-1.32, 0.86, -1.05], [0.2, 0.1, 0.08], 0x111111, false);
  const clockFace = new THREE.Mesh(
    new THREE.PlaneGeometry(0.16, 0.06),
    new THREE.MeshStandardMaterial({ color: 0x111111, emissive: 0x77ddaa, emissiveIntensity: 0.55, roughness: 0.4 })
  );
  clockFace.position.set(-1.24, 0.86, -1.05);
  clockFace.rotation.y = Math.PI / 2;
  scene.add(clockFace);

  // Desk lamp
  const lampX = -1.3, lampZ = -0.35;
  box([lampX, 0.86, lampZ], [0.1, 0.04, 0.1], 0x3a3a40, false);
  box([lampX, 0.98, lampZ], [0.03, 0.22, 0.03], 0x3a3a40, false, { rotation: [0.15, 0, 0] });
  const shade = new THREE.Mesh(
    new THREE.ConeGeometry(0.12, 0.12, 16, 1, true),
    new THREE.MeshStandardMaterial({ color: 0x5a4a3a, roughness: 0.7, side: THREE.DoubleSide })
  );
  shade.position.set(lampX, 1.12, lampZ);
  shade.rotation.x = Math.PI;
  shade.castShadow = true;
  scene.add(shade);
  const bulb = new THREE.Mesh(
    new THREE.SphereGeometry(0.035, 12, 12),
    new THREE.MeshStandardMaterial({ color: 0xfff0c0, emissive: 0xffc080, emissiveIntensity: 1.2 })
  );
  bulb.position.set(lampX, 1.06, lampZ);
  scene.add(bulb);

  // Lights
  const ambient = new THREE.AmbientLight(0x1a2233, 0.18);
  scene.add(ambient);

  const hemi = new THREE.HemisphereLight(0x1a2233, 0x08080c, 0.08);
  scene.add(hemi);

  const deskLight = new THREE.PointLight(0xffc080, 1.2, 6, 2);
  deskLight.position.set(lampX, 1.06, lampZ);
  deskLight.castShadow = true;
  deskLight.shadow.mapSize.set(512, 512);
  deskLight.shadow.bias = -0.0005;
  scene.add(deskLight);

  const moon = new THREE.DirectionalLight(0x6688cc, 0.35);
  moon.position.set(-9, 11, -1);
  moon.target.position.set(0, 1, 0);
  moon.castShadow = true;
  moon.shadow.mapSize.set(1024, 1024);
  moon.shadow.camera.left = -6;
  moon.shadow.camera.right = 6;
  moon.shadow.camera.top = 6;
  moon.shadow.camera.bottom = -6;
  moon.shadow.camera.near = 1;
  moon.shadow.camera.far = 25;
  moon.shadow.bias = -0.0008;
  scene.add(moon);
  scene.add(moon.target);

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  return { scene, camera, renderer, colliders };
}

