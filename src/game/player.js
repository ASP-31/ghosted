import * as THREE from 'three';

export class Player {
  constructor(camera, colliders) {
    this.camera = camera;
    this.colliders = colliders;
    this.height = 1.6;
    this.radius = 0.28;
    this.speed = 3.6;
    this.yaw = 0;
    this.pitch = 0;
    this.keys = {};
    this.last = performance.now();
    this.disabled = false;

    document.addEventListener('keydown', (e) => {
      if (this.disabled) return;
      this.keys[e.code] = true;
    });
    document.addEventListener('keyup', (e) => {
      if (this.disabled) return;
      this.keys[e.code] = false;
    });
    document.addEventListener('mousemove', (e) => {
      if (this.disabled) return;
      if (document.pointerLockElement) {
        this.yaw -= e.movementX * 0.0022;
        this.pitch -= e.movementY * 0.0022;
        this.pitch = Math.max(-1.35, Math.min(1.35, this.pitch));
      }
    });
    document.addEventListener('click', (e) => {
      if (this.disabled) return;
      const phone = document.getElementById('phone-container');
      if (phone && phone.style.display !== 'none') return;
      if (!document.pointerLockElement) {
        try {
          document.body.requestPointerLock();
        } catch (_) {}
      }
    });
    document.addEventListener('pointerlockchange', () => {
      const hint = document.getElementById('hint');
      if (this.disabled) {
        if (hint) hint.style.display = 'none';
        return;
      }
      const phone = document.getElementById('phone-container');
      const isPhoneOpen = phone && phone.style.display !== 'none';
      if (hint) hint.style.display = (document.pointerLockElement || isPhoneOpen) ? 'none' : 'block';
    });
  }

  collides(x, z) {
    for (const box of this.colliders) {
      const min = box.min;
      const max = box.max;
      if (x + this.radius > min.x && x - this.radius < max.x &&
          z + this.radius > min.z && z - this.radius < max.z) {
        if (this.height > min.y && 0 < max.y) return true;
      }
    }
    return false;
  }

  disable() {
    this.disabled = true;
    this.keys = {};
    if (document.pointerLockElement) {
      try {
        document.exitPointerLock();
      } catch (_) {}
    }
  }

  update() {
    if (this.disabled) {
      this.keys = {};
      return;
    }

    const now = performance.now();
    const dt = Math.min((now - this.last) / 1000, 0.05);
    this.last = now;

    const phone = document.getElementById('phone-container');
    if (phone && phone.style.display !== 'none') {
      return;
    }

    const forward = (this.keys['KeyW'] ? 1 : 0) - (this.keys['KeyS'] ? 1 : 0);
    const strafe = (this.keys['KeyD'] ? 1 : 0) - (this.keys['KeyA'] ? 1 : 0);

    const fx = -Math.sin(this.yaw);
    const fz = -Math.cos(this.yaw);
    const rx = Math.cos(this.yaw);
    const rz = -Math.sin(this.yaw);

    let mx = fx * forward + rx * strafe;
    let mz = fz * forward + rz * strafe;
    const len = Math.hypot(mx, mz);
    if (len > 0) { mx /= len; mz /= len; }

    const step = this.speed * dt;
    const dx = mx * step;
    const dz = mz * step;

    const pos = this.camera.position;
    if (!this.collides(pos.x + dx, pos.z)) pos.x += dx;
    if (!this.collides(pos.x, pos.z + dz)) pos.z += dz;
    pos.y = this.height;

    this.camera.rotation.order = 'YXZ';
    this.camera.rotation.y = this.yaw;
    this.camera.rotation.x = this.pitch;
  }
}
