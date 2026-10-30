import * as THREE from 'three';

export function createScene() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x05070c);
  scene.fog = new THREE.Fog(0x060912, 6, 15);

  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.set(0, 1.6, 1.1);

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
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
  const wallColor = 0x2a2825;
  box([0, H / 2, -hd], [W, H, 0.1], wallColor);
  box([-hw, H / 2, 0], [0.1, H, D], wallColor);
  box([hw, H / 2, 0], [0.1, H, D], wallColor);

  // Front Wall with open doorway at doorX = 0.9, width = 0.82
  const doorW = 0.82;
  const doorX = 0.9;
  const doorZ = hd - 0.05;
  box([-0.705, H / 2, hd], [2.39, H, 0.1], wallColor);
  box([1.605, H / 2, hd], [0.59, H, 0.1], wallColor);
  box([doorX, 2.3, hd], [doorW, 0.4, 0.1], wallColor);

  // Skirting (subtle)
  const skirt = 0x15151b;
  box([0, 0.05, -hd + 0.02], [W, 0.1, 0.06], skirt, false);
  box([-0.705, 0.05, hd - 0.02], [2.39, 0.1, 0.06], skirt, false);
  box([1.605, 0.05, hd - 0.02], [0.59, 0.1, 0.06], skirt, false);

  // Window on left wall
  const winX = -hw + 0.06;
  const winZ = -0.7;
  const winW = 1.0, winH = 0.75;

  // Window Frame
  box([winX + 0.02, 1.35, winZ], [0.06, winH + 0.12, winW + 0.12], 0x1a1a20, false);

  const glass = new THREE.Mesh(
    new THREE.PlaneGeometry(winW, winH),
    new THREE.MeshStandardMaterial({
      color: 0x1a2a40,
      emissive: 0x102030,
      emissiveIntensity: 0.3,
      transparent: true,
      opacity: 0.6,
      roughness: 0.1,
      metalness: 0.4
    })
  );
  glass.position.set(winX, 1.35, winZ);
  glass.rotation.y = Math.PI / 2;
  scene.add(glass);

  // Sill
  box([winX + 0.08, 0.95, winZ], [0.16, 0.06, winW + 0.2], 0x1a1a20, false);

  // Door on front wall
  // Door panel - pivot on hinge (left side: doorX - doorW / 2)
  const doorGeo = new THREE.BoxGeometry(doorW, 2.05, 0.08);
  doorGeo.translate(doorW / 2, 0, 0);
  const doorMat = new THREE.MeshStandardMaterial({ color: 0x352b22, roughness: 0.8 });
  const doorPanel = new THREE.Mesh(doorGeo, doorMat);
  doorPanel.position.set(doorX - doorW / 2, 1.05, doorZ);
  doorPanel.castShadow = true;
  doorPanel.receiveShadow = true;
  scene.add(doorPanel);

  function childBox(pos, size, color, opts = {}) {
    const geo = new THREE.BoxGeometry(size[0], size[1], size[2]);
    const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.75, metalness: 0.05, ...opts });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(pos[0], pos[1], pos[2]);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    doorPanel.add(mesh);
    return mesh;
  }

  // Door frame (left, right, top)
  box([doorX - 0.45, 1.1, doorZ + 0.01], [0.07, 2.2, 0.1], 0x2a231b, false);
  box([doorX + 0.45, 1.1, doorZ + 0.01], [0.07, 2.2, 0.1], 0x2a231b, false);
  box([doorX, 2.2, doorZ + 0.01], [0.97, 0.07, 0.1], 0x2a231b, false);
  // Recessed door panels (children of doorPanel)
  childBox([0.41, 0.38, -0.045], [0.58, 0.62, 0.015], 0x2a211a, { roughness: 0.8 });
  childBox([0.41, -0.50, -0.045], [0.58, 0.52, 0.015], 0x2a211a, { roughness: 0.8 });
  // Door handle (children of doorPanel)
  childBox([0.73, -0.05, -0.05], [0.04, 0.18, 0.06], 0x8a7a5a, { metalness: 0.6, roughness: 0.3 });
  childBox([0.66, -0.05, -0.09], [0.14, 0.03, 0.03], 0xa08a64, { metalness: 0.7, roughness: 0.25 });
  // Hinge plates
  box([doorX - 0.37, 1.8, doorZ - 0.05], [0.03, 0.15, 0.04], 0x555555, false, { metalness: 0.7 });
  box([doorX - 0.37, 0.4, doorZ - 0.05], [0.03, 0.15, 0.04], 0x555555, false, { metalness: 0.7 });

  // Bed (right/back)
  const bedX = 0.85, bedZ = -1.45;
  // Frame and legs
  box([bedX, 0.15, bedZ], [1.52, 0.2, 1.12], 0x1e1e24);
  box([bedX - 0.66, 0.075, bedZ - 0.48], [0.06, 0.15, 0.06], 0x14141a, false);
  box([bedX + 0.66, 0.075, bedZ - 0.48], [0.06, 0.15, 0.06], 0x14141a, false);
  box([bedX - 0.66, 0.075, bedZ + 0.48], [0.06, 0.15, 0.06], 0x14141a, false);
  box([bedX + 0.66, 0.075, bedZ + 0.48], [0.06, 0.15, 0.06], 0x14141a, false);
  // Headboard
  box([bedX, 0.5, bedZ - 0.58], [1.52, 0.7, 0.1], 0x1a1a20, false);
  // Mattress
  box([bedX, 0.3, bedZ], [1.4, 0.2, 1.0], 0x444450, false, { roughness: 0.95 });
  // Pillow
  box([bedX, 0.45, bedZ - 0.33], [0.82, 0.1, 0.32], 0x777782, false, { roughness: 1 });
  // Uneven blanket
  box([bedX, 0.41, bedZ + 0.24], [1.36, 0.06, 0.56], 0x353a46, false, { rotation: [0, 0.02, 0.015], roughness: 1 });
  box([bedX + 0.03, 0.46, bedZ + 0.02], [1.18, 0.04, 0.18], 0x3d4352, false, { rotation: [0, -0.025, 0.02], roughness: 1 });
  box([bedX - 0.04, 0.37, bedZ + 0.52], [1.28, 0.1, 0.08], 0x2e343c, false, { rotation: [0, 0.01, -0.02], roughness: 1 });
  // Folded sheet edge
  box([bedX + 0.02, 0.44, bedZ - 0.18], [1.25, 0.02, 0.12], 0x5b606c, false, { rotation: [0, 0.01, 0.01], roughness: 1 });

  // Desk (left/back, under window side)
  const deskX = -1.45, deskZ = -0.7;
  const deskMain = box([deskX, 0.375, deskZ], [0.5, 0.75, 1.0], 0x3b2f24);
  box([deskX + 0.18, 0.78, deskZ], [0.55, 0.05, 1.05], 0x4a3a2c, false);

  // Desk legs accent
  box([deskX - 0.18, 0.2, deskZ - 0.42], [0.06, 0.4, 0.06], 0x2a221a, false);
  box([deskX - 0.18, 0.2, deskZ + 0.42], [0.06, 0.4, 0.06], 0x2a221a, false);

  // Photograph on desk
  const photoGroup = new THREE.Group();

  // Photo base (white border)
  const photoBase = new THREE.Mesh(
    new THREE.BoxGeometry(0.12, 0.002, 0.15),
    new THREE.MeshStandardMaterial({ color: 0xddddcc, roughness: 0.8 })
  );
  photoGroup.add(photoBase);

  // Photo content (darker area)
  const photoContent = new THREE.Mesh(
    new THREE.BoxGeometry(0.1, 0.003, 0.13),
    new THREE.MeshStandardMaterial({ color: 0x444455, roughness: 0.6 })
  );
  photoContent.position.y = 0.001;
  photoGroup.add(photoContent);

  // Back text representation (dark shapes to suggest writing)
  const photoBackText = new THREE.Mesh(
    new THREE.BoxGeometry(0.08, 0.003, 0.1),
    new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 1 })
  );
  photoBackText.position.y = -0.002;
  photoGroup.add(photoBackText);

  // "Scratched out" detail (small dark streaks)
  for (let i = 0; i < 5; i++) {
    const scratch = new THREE.Mesh(
      new THREE.BoxGeometry(0.01, 0.004, 0.03),
      new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 1 })
    );
    scratch.position.set(
      0.02 + Math.random() * 0.02,
      0.002,
      (Math.random() - 0.5) * 0.05
    );
    scratch.rotation.z = (Math.random() - 0.5) * 0.5;
    photoGroup.add(scratch);
  }

  photoGroup.position.set(deskX + 0.2, 0.83, deskZ + 0.1);
  photoGroup.rotation.set(0, 0.2, -0.1);
  scene.add(photoGroup);

  // Chair
  const chairX = -0.95, chairZ = -0.95;
  box([chairX, 0.25, chairZ], [0.4, 0.5, 0.4], 0x25252b);
  box([chairX, 0.62, chairZ - 0.16], [0.4, 0.45, 0.08], 0x25252b, false);

  // Digital clock on desk
  box([-1.32, 0.86, -1.05], [0.2, 0.1, 0.08], 0x111111, false);
  const clockFace = new THREE.Mesh(
    new THREE.PlaneGeometry(0.16, 0.06),
    new THREE.MeshStandardMaterial({ color: 0x111111, emissive: 0x77ddaa, emissiveIntensity: 0.6, roughness: 0.4 })
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
    new THREE.MeshStandardMaterial({ color: 0xfff0c0, emissive: 0xffc080, emissiveIntensity: 1.35 })
  );
  bulb.position.set(lampX, 1.06, lampZ);
  scene.add(bulb);

  // Lights
  const ambient = new THREE.AmbientLight(0x0a101a, 0.15);
  scene.add(ambient);

  const hemi = new THREE.HemisphereLight(0x1e2a40, 0x05050a, 0.1);
  scene.add(hemi);

  const deskLight = new THREE.PointLight(0xffc080, 2.2, 8, 2);
  deskLight.position.set(lampX, 1.06, lampZ);
  deskLight.castShadow = true;
  deskLight.shadow.mapSize.set(512, 512);
  deskLight.shadow.bias = -0.0005;
  scene.add(deskLight);


  // Entrance / Door Light
  box([doorX, 2.45, doorZ - 0.25], [0.14, 0.03, 0.14], 0x222228, false);
  const doorBulb = new THREE.Mesh(
    new THREE.SphereGeometry(0.035, 12, 12),
    new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xecdab9, emissiveIntensity: 1.2 })
  );
  doorBulb.position.set(doorX, 2.41, doorZ - 0.25);
  scene.add(doorBulb);

  const doorLight = new THREE.PointLight(0xecdab9, 1.8, 4.5, 2);
  doorLight.position.set(doorX, 2.36, doorZ - 0.25);
  doorLight.castShadow = true;
  doorLight.shadow.mapSize.set(512, 512);
  doorLight.shadow.bias = -0.0005;
  scene.add(doorLight);

  const moon = new THREE.DirectionalLight(0x6688cc, 0.4);
  const moonPoint = new THREE.PointLight(0x6688cc, 1.2, 6.0, 2);
  moonPoint.position.set(-1.75, 1.35, -0.7);
  moonPoint.castShadow = false;
  scene.add(moonPoint);
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

  // Door Collider (blocks doorway while door is closed)
  const doorCollider = new THREE.Box3().setFromCenterAndSize(
    new THREE.Vector3(doorX, 1.05, doorZ),
    new THREE.Vector3(doorW, 2.05, 0.2)
  );
  colliders.push(doorCollider);

  // --- EXTENDED HALLWAY & ACCIDENT RECONSTRUCTION ---
  const hallLen = 6.0;
  const hallW = 1.3;
  const hallZStart = hd;
  const hallZEnd = hallZStart + hallLen;
  const hallZMid = hallZStart + hallLen / 2;

  // Hallway Floor & Ceiling
  box([doorX, -0.02, hallZMid], [hallW, 0.04, hallLen], 0x141416, false, { roughness: 0.9 });
  box([doorX, H, hallZMid], [hallW, 0.04, hallLen], 0x0a0a0f, false);

  // Hallway Left Wall & Right Wall & End Wall
  box([doorX - hallW / 2 - 0.05, H / 2, hallZMid], [0.1, H, hallLen], 0x1c1b19, true);
  box([doorX + hallW / 2 + 0.05, H / 2, hallZMid], [0.1, H, hallLen], 0x1c1b19, true);
  box([doorX, H / 2, hallZEnd + 0.05], [hallW + 0.2, H, 0.1], 0x151518, true);

  // Tyre Skid Marks on Hallway Floor
  box([doorX - 0.28, 0.002, hallZMid + 0.3], [0.1, 0.001, hallLen * 0.75], 0x050505, false, { roughness: 1 });
  box([doorX + 0.28, 0.002, hallZMid + 0.3], [0.1, 0.001, hallLen * 0.75], 0x050505, false, { roughness: 1 });

  // Blood Pools & Trail
  box([doorX + 0.12, 0.004, hallZEnd - 1.2], [0.75, 0.001, 1.2], 0x3b0000, false, { roughness: 0.15, metalness: 0.3 });
  box([doorX - 0.05, 0.005, hallZEnd - 1.6], [0.45, 0.001, 0.6], 0x480000, false, { roughness: 0.1, metalness: 0.4 });
  box([doorX + 0.05, 0.003, hallZMid - 0.2], [0.18, 0.001, 1.8], 0x330000, false, { roughness: 0.2, metalness: 0.2 });
  box([doorX - 0.1, 0.003, hallZStart + 1.2], [0.12, 0.001, 1.4], 0x2b0000, false, { roughness: 0.2 });

  // Shattered Glass Shards along the Hallway
  for (let i = 0; i < 16; i++) {
    const gx = doorX + (Math.sin(i * 1.7) * 0.45);
    const gz = hallZStart + 1.5 + (i * 0.25);
    box([gx, 0.005, gz], [0.035, 0.004, 0.035], 0x99ccff, false, {
      roughness: 0.1,
      metalness: 0.9,
      emissive: 0x112233,
      emissiveIntensity: 0.2
    });
  }

  // Wreckage Debris at End of Hallway
  box([doorX - 0.15, 0.35, hallZEnd - 0.4], [0.85, 0.5, 0.4], 0x1a2228, true, { roughness: 0.5, metalness: 0.7, rotation: [0.1, -0.2, 0.15] });
  box([doorX + 0.25, 0.2, hallZEnd - 0.3], [0.4, 0.35, 0.3], 0x111111, false, { metalness: 0.8, roughness: 0.4, rotation: [-0.15, 0.3, 0] });

  // Hallway Dim Overhead Light
  const hallLight = new THREE.PointLight(0x7a8fa8, 0.8, 6.0, 2);
  hallLight.position.set(doorX, 2.3, hallZMid);
  scene.add(hallLight);

  // Blinding Accident Headlights
  const headlightL = new THREE.SpotLight(0xfffaed, 0, 12, Math.PI / 5, 0.4);
  headlightL.position.set(doorX - 0.3, 0.45, hallZEnd - 0.2);
  headlightL.target.position.set(doorX - 0.2, 0.45, hallZStart);
  scene.add(headlightL);
  scene.add(headlightL.target);

  const headlightR = new THREE.SpotLight(0xfffaed, 0, 12, Math.PI / 5, 0.4);
  headlightR.position.set(doorX + 0.3, 0.4, hallZEnd - 0.3);
  headlightR.target.position.set(doorX + 0.2, 0.4, hallZStart);
  scene.add(headlightR);
  scene.add(headlightR.target);

  // Shadow Ghost Apparition
  const ghostGroup = new THREE.Group();
  const ghostMat = new THREE.MeshBasicMaterial({ color: 0x030305 });

  // Torso
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.75, 0.2), ghostMat);
  torso.position.y = 1.0;
  ghostGroup.add(torso);

  // Head
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 12), ghostMat);
  head.position.y = 1.5;
  ghostGroup.add(head);

  // Glowing Eye Pinpricks
  const eyeMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.012, 8, 8), eyeMat);
  eyeL.position.set(-0.04, 1.52, 0.12);
  ghostGroup.add(eyeL);
  const eyeR = new THREE.Mesh(new THREE.SphereGeometry(0.012, 8, 8), eyeMat);
  eyeR.position.set(0.04, 1.52, 0.12);
  ghostGroup.add(eyeR);

  // Arms
  const armL = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.75, 0.08), ghostMat);
  armL.position.set(-0.24, 0.9, 0);
  ghostGroup.add(armL);
  const armR = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.75, 0.08), ghostMat);
  armR.position.set(0.24, 0.9, 0);
  ghostGroup.add(armR);

  // Legs
  const legL = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.7, 0.12), ghostMat);
  legL.position.set(-0.1, 0.35, 0);
  ghostGroup.add(legL);
  const legR = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.7, 0.12), ghostMat);
  legR.position.set(0.1, 0.35, 0);
  ghostGroup.add(legR);

  ghostGroup.position.set(doorX, 0, hd - 0.3);
  ghostGroup.rotation.y = 0;
  ghostGroup.visible = false;
  scene.add(ghostGroup);

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  return {
    scene, camera, renderer, colliders, deskMain, photoGroup, doorPanel,
    ambient, deskLight, doorLight, doorCollider, headlightL, headlightR, hallLight,
    ghostGroup
  };
}











