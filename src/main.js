import * as THREE from 'three';
import { createScene } from './game/scene.js';
import { Player } from './game/player.js';
import { HUD } from './ui/hud.js';
import { InteractionManager } from './game/interaction.js';
import { PhoneUI } from './ui/phone.js';

const { scene, camera, renderer, colliders, deskMain, photoGroup } = createScene();
const player = new Player(camera, colliders);
const hud = new HUD();
const interaction = new InteractionManager(camera);
const phone = new PhoneUI();

// Register the photograph as the primary interactable clue
interaction.register(photoGroup, '[ E ] Examine Photograph', () => {
  hud.showMessage("An old photograph. Alex is smiling at the camera. Someone has been scratched out beside him.");

  // Trigger phone sequence after a short delay
  setTimeout(() => {
    phone.show();
  }, 2000);
});

document.addEventListener('keydown', (e) => {
  if (e.code === 'KeyE') {
    interaction.interact();
  }
});

function animate() {
  requestAnimationFrame(animate);
  player.update();

  const target = interaction.update();
  hud.update(target);

  renderer.render(scene, camera);
}
animate();
