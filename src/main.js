import * as THREE from 'three';
import { createScene } from './game/scene.js';
import { Player } from './game/player.js';
import { HUD } from './ui/hud.js';
import { InteractionManager } from './game/interaction.js';
import { PhoneUI } from './ui/phone.js';

const { scene, camera, renderer, colliders, deskMain, photoGroup, doorPanel, ambient, deskLight } = createScene();
const player = new Player(camera, colliders);
const hud = new HUD();
const interaction = new InteractionManager(camera);
const phone = new PhoneUI();

let gameState = 'START'; // START -> PHOTO_EXAMINED -> UNKNOWN_CONTACTED -> PHOTO_REVEALED -> FINAL_WARNING

const flickerLights = async () => {
  const originalAmbient = ambient.intensity;
  const originalDesk = deskLight.intensity;

  ambient.intensity = 0.05;
  deskLight.intensity = 0.5;

  setTimeout(() => {
    ambient.intensity = originalAmbient;
    deskLight.intensity = originalDesk;
  }, 100);

  setTimeout(() => {
    ambient.intensity = 0.02;
    deskLight.intensity = 0.2;
  }, 200);

  setTimeout(() => {
    ambient.intensity = originalAmbient;
    deskLight.intensity = originalDesk;
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

      // After first conversation, schedule the UNKNOWN contact with a 10 second gap
      setTimeout(async () => {
        await phone.startUnknownConversation();
        gameState = 'UNKNOWN_CONTACTED';
      }, 10000);
    }, 2000);
  } else if (gameState === 'UNKNOWN_CONTACTED') {
    // VISUAL FEEDBACK: Actually rotate the photo group to simulate turning it over
    photoGroup.rotation.x = Math.PI;

    // Sequential reveal of the hidden text
    hud.showMessage("There is something written behind it.");
    await new Promise(r => setTimeout(r, 1500));
    hud.showMessage("3:13 AM");
    await new Promise(r => setTimeout(r, 1500));
    hud.showPermanentMessage("3:13 AM\nYOU WERE NEVER ALONE.");

    gameState = 'PHOTO_REVEALED';

    // Silence gap: Let the player look around for 3 seconds
    setTimeout(async () => {
      // Trigger atmospheric effects
      flickerLights();
      highlightDoor();

      // Trigger final warning from Alex
      await phone.startWarningConversation();

      // Once phone closes, make the door subtly different
      doorPanel.rotation.y = 0.05;

      // Now the door becomes the final interactable
      interaction.register(doorPanel, '[ E ] Open Door', () => {
        hud.hideMessage();
        hud.showMessage("THE END");
      });
    }, 3000);
  }
});

document.addEventListener('keydown', async (e) => {
  if (e.code === 'KeyE') {
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
