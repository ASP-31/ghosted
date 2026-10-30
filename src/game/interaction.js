import * as THREE from 'three';

export class InteractionManager {
  constructor(camera) {
    this.camera = camera;
    this.raycaster = new THREE.Raycaster();
    this.interactables = new Map();
    this.currentTarget = null;
    this.maxDistance = 2.0;
  }

  register(object, prompt, onInteract) {
    this.interactables.set(object.uuid, {
      object,
      prompt,
      onInteract
    });
  }

  update() {
    // Raycast from center of screen
    this.raycaster.setFromCamera({ x: 0, y: 0 }, this.camera);

    // Only check objects that are registered as interactable
    const checkObjects = Array.from(this.interactables.values()).map(i => i.object);
    const intersects = this.raycaster.intersectObjects(checkObjects, true);

    if (intersects.length > 0) {
      const closest = intersects[0];
      if (closest.distance <= this.maxDistance) {
        // Find which registered object this mesh belongs to
        let target = null;
        for (const [uuid, data] of this.interactables) {
          if (closest.object === data.object || closest.object.parent === data.object) {
            target = data;
            break;
          }
        }
        this.currentTarget = target;
      } else {
        this.currentTarget = null;
      }
    } else {
      this.currentTarget = null;
    }

    return this.currentTarget;
  }

  async interact() {
    if (this.currentTarget && this.currentTarget.onInteract) {
      await this.currentTarget.onInteract();
      return true;
    }
    return false;
  }
}
