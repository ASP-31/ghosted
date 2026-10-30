import * as THREE from 'three';
import { createScene } from './game/scene.js';
import { Player } from './game/player.js';
import { HUD } from './ui/hud.js';
import { InteractionManager } from './game/interaction.js';
import { PhoneUI } from './ui/phone.js';

const { scene, camera, renderer, colliders, deskMain, photoGroup, doorPanel, ambient, deskLight, doorLight } = createScene();
const player = new Player(camera, colliders);
const hud = new HUD();
const interaction = new InteractionManager(camera);
const phone = new PhoneUI();

let gameState = 'START'; // START -> PHOTO_EXAMINED -> UNKNOWN_CONTACTED -> PHOTO_REVEALED -> FINAL_WARNING

const flickerLights = async () => {
  const originalAmbient = ambient.intensity;
  const originalDesk = deskLight.intensity;
  const originalDoor = doorLight ? doorLight.intensity : 0;

  ambient.intensity = 0.05;
  deskLight.intensity = 0.5;
  if (doorLight) doorLight.intensity = 0.2;

  setTimeout(() => {
    ambient.intensity = originalAmbient;
    deskLight.intensity = originalDesk;
    if (doorLight) doorLight.intensity = originalDoor;
  }, 100);

  setTimeout(() => {
    ambient.intensity = 0.02;
    deskLight.intensity = 0.2;
    if (doorLight) doorLight.intensity = 0.05;
  }, 200);

  setTimeout(() => {
    ambient.intensity = originalAmbient;
    deskLight.intensity = originalDesk;
    if (doorLight) doorLight.intensity = originalDoor;
  }, 300);
};

const highlightDoor = () => {
  const originalColor = doorPanel.material.color.getHex();
  doorPanel.material.emissive = new THREE.Color(0x331111);
  doorPanel.material.emissiveIntensity = 0.5;

  setTimeout(() => {
    doorPanel.material.emissiveIntensity = 0;
  }, 1000);
};

// Register the photograph as the primary interactable clue
interaction.register(photoGroup, '[ E ] Examine Photograph', async () => {
  if (gameState === 'START') {
    hud.showMessage("An old photograph. Alex is smiling at the camera. Someone has been scratched out beside him.");
    gameState = 'PHOTO_EXAMINED';

    setTimeout(async () => {
      await phone.startFirstConversation();

      // After first conversation concludes and phone closes, wait before UNKNOWN contact
      setTimeout(async () => {
        await phone.startUnknownConversation();
        gameState = 'UNKNOWN_CONTACTED';
        interaction.setPrompt(photoGroup, '[ E ] Turn Over Photograph');
      }, 4000);
    }, 2000);
  } else if (gameState === 'PHOTO_EXAMINED') {
    hud.showMessage("It's the photograph of Alex. You feel an uneasy chill.");
  } else if (gameState === 'UNKNOWN_CONTACTED') {
    // VISUAL FEEDBACK: Rotate photo group to turn it over
    photoGroup.rotation.x = Math.PI;

    // Sequential reveal of the hidden text
    hud.showMessage("There is something written behind it.");
    await new Promise(r => setTimeout(r, 1500));
    hud.showMessage("3:13 AM");
    await new Promise(r => setTimeout(r, 1500));
    hud.showPermanentMessage("3:13 AM\nYOU WERE NEVER ALONE.");

    gameState = 'PHOTO_REVEALED';
    interaction.setPrompt(photoGroup, '[ E ] Examine Writing');

    // Silence gap: Let the player look around
    setTimeout(async () => {
      // Trigger atmospheric effects
      flickerLights();
      highlightDoor();

      // Trigger final warning from Alex
      await phone.startWarningConversation();

      // Once phone closes, crack the door open into the room
      doorPanel.rotation.y = -0.15;

      // Now the door becomes the final interactable
      let doorOpening = false;
      interaction.register(doorPanel, '[ E ] Open Door', () => {
        if (doorOpening) return;
        doorOpening = true;
        hud.hideMessage();

        const start = performance.now();
        const duration = 1200;
        const initialRot = doorPanel.rotation.y;
        const targetRot = -1.4;

        function swingDoor(time) {
          const t = Math.min((time - start) / duration, 1);
          const ease = 1 - Math.pow(1 - t, 3);
          doorPanel.rotation.y = initialRot + (targetRot - initialRot) * ease;
          if (t < 1) {
            requestAnimationFrame(swingDoor);
          } else {
            hud.showPermanentMessage("THE END");
          }
        }
        requestAnimationFrame(swingDoor);
      });
    }, 3000);
  } else if (gameState === 'PHOTO_REVEALED') {
    hud.showMessage("The message is etched deep into the back: 3:13 AM. YOU WERE NEVER ALONE.");
  }
});

document.addEventListener('keydown', async (e) => {
  if (e.code === 'KeyE') {
    const phoneEl = document.getElementById('phone-container');
    if (phoneEl && phoneEl.style.display !== 'none') return;
    await interaction.interact();
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
