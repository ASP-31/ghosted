import * as THREE from 'three';
import { createScene } from './game/scene.js';
import { Player } from './game/player.js';
import { HUD } from './ui/hud.js';

const { scene, camera, renderer, colliders } = createScene();
const player = new Player(camera, colliders);
const hud = new HUD();

function animate() {
  requestAnimationFrame(animate);
  player.update();
  hud.update();
  renderer.render(scene, camera);
}
animate();
