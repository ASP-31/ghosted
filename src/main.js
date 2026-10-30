import * as THREE from 'three';
import { createScene } from './game/scene.js';
import { Player } from './game/player.js';
import { HUD } from './ui/hud.js';
import { InteractionManager } from './game/interaction.js';
import { PhoneUI } from './ui/phone.js';
import { SoundEngine } from './game/audio.js';

const {
  scene, camera, renderer, colliders, deskMain, photoGroup, doorPanel,
  ambient, deskLight, doorLight, doorCollider, headlightL, headlightR, hallLight,
  ghostGroup
} = createScene();
const player = new Player(camera, colliders);
const hud = new HUD();
const interaction = new InteractionManager(camera);
const phone = new PhoneUI();
const audio = new SoundEngine();

const initAudio = () => audio.init();
document.addEventListener('click', initAudio, { once: true });
document.addEventListener('keydown', initAudio, { once: true });

let gameState = 'START'; // START -> PHOTO_EXAMINED -> UNKNOWN_CONTACTED -> PHOTO_REVEALED -> DOOR_OPENED -> ACCIDENT_TRIGGERED -> ENDING_CHOICE -> ENDING_GHOSTED / ENDING_ESCAPED

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

const triggerSubtleScare = () => {
  const originalAmbient = ambient.intensity;
  const originalDesk = deskLight.intensity;
  const originalDoor = doorLight ? doorLight.intensity : 0;
  const originalAmbientColor = ambient.color.getHex();

  // Erratic flicker
  ambient.intensity = 0.0;
  deskLight.intensity = 0.0;
  if (doorLight) doorLight.intensity = 0.0;

  setTimeout(() => {
    ambient.color.setHex(0x330808);
    ambient.intensity = 0.2;
    deskLight.intensity = 0.3;
  }, 100);

  setTimeout(() => {
    ambient.intensity = 0.0;
    deskLight.intensity = 0.0;
    if (doorLight) doorLight.intensity = 0.0;
  }, 220);

  setTimeout(() => {
    ambient.color.setHex(0x1a0505);
    ambient.intensity = 0.15;
    deskLight.intensity = 1.6;
    if (doorLight) doorLight.intensity = 0.8;
  }, 350);

  setTimeout(() => {
    ambient.intensity = 0.02;
    deskLight.intensity = 0.1;
    if (doorLight) doorLight.intensity = 0.0;
  }, 500);

  setTimeout(() => {
    ambient.intensity = originalAmbient;
    ambient.color.setHex(originalAmbientColor);
    deskLight.intensity = originalDesk;
    if (doorLight) doorLight.intensity = originalDoor;
  }, 750);
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
    audio.playWhisper();

    // Sequential reveal of the hidden text
    hud.showMessage("There is something written behind it.");
    await new Promise(r => setTimeout(r, 1500));
    audio.playWhisper();
    hud.showMessage("3:13 AM");
    await new Promise(r => setTimeout(r, 1500));
    hud.showPermanentMessage("3:13 AM\nYOU WERE NEVER ALONE.");

    gameState = 'PHOTO_REVEALED';
    interaction.setPrompt(photoGroup, '[ E ] Examine Writing');
    audio.startHeartbeat(650);

    // Silence gap: Let the player look around — play whisper midway through
    setTimeout(() => audio.playWhisper(), 1500);
    setTimeout(async () => {
      // Trigger violent door pounding before Alex warning
      audio.playDoorKnock();
      flickerLights();
      highlightDoor();

      // Trigger final warning from Alex
      await phone.startWarningConversation();

      // Once phone closes, crack the door open into the room
      doorPanel.rotation.y = -0.15;
      hud.showMessage("Alex: \"Whatever you do... don't open the door.\"", 5000);

      // Now the door becomes the final interactable
      let doorOpening = false;
      interaction.register(doorPanel, '[ E ] Open Door', () => {
        if (doorOpening) return;
        doorOpening = true;
        hud.hideMessage();
        audio.playCreak();

        const start = performance.now();
        const duration = 1800;
        const initialRot = doorPanel.rotation.y;
        const targetRot = -1.4;

        function swingDoor(time) {
          const t = Math.min((time - start) / duration, 1);
          const ease = 1 - Math.pow(1 - t, 3);
          doorPanel.rotation.y = initialRot + (targetRot - initialRot) * ease;
          if (t < 1) {
            requestAnimationFrame(swingDoor);
          } else {
            // Door fully open
            interaction.unregister(doorPanel);
            const cIdx = colliders.indexOf(doorCollider);
            if (cIdx > -1) colliders.splice(cIdx, 1);

            hud.showMessage("The hallway is empty.", 2200);
            audio.playWhisper();
            setTimeout(() => {
              gameState = 'DOOR_OPENED';
              hud.showMessage("The door creaks open into the hallway...\nInvestigate.", 4000);
            }, 2200);
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
  if (gameState === 'ENDING_GHOSTED' || gameState === 'ENDING_ESCAPED') return;
  if (e.code === 'KeyE') {
    const phoneEl = document.getElementById('phone-container');
    if (phoneEl && phoneEl.style.display !== 'none') return;
    await interaction.interact();
  }
});

function animate() {
  requestAnimationFrame(animate);
  player.update();

  // Ghost twitch jitter animation when visible
  if (ghostGroup && ghostGroup.visible) {
    ghostGroup.position.x = 0.9 + (Math.random() - 0.5) * 0.04;
    ghostGroup.rotation.z = (Math.random() - 0.5) * 0.07;
  }

  // Accident Scene Discovery Trigger: Walking down the corridor
  if (gameState === 'DOOR_OPENED' && camera.position.z > 3.4) {
    gameState = 'ACCIDENT_TRIGGERED';

    // Violent crash sound & sudden blinding high-beams
    audio.playCrashSound();
    headlightL.intensity = 8;
    headlightR.intensity = 8;
    setTimeout(() => {
      headlightL.intensity = 0;
      headlightR.intensity = 0;
    }, 280);

    triggerSubtleScare();
    hud.showMessage("Tyre tracks... Broken glass and blood.\nThe crash happened here.", 4000);

    // After discovering the accident, UNKNOWN initiates the climax
    setTimeout(async () => {
      gameState = 'ENDING_CHOICE';

      await phone.startFinalConversation(async (choice) => {
        audio.stopHeartbeat();

        if (choice === 'alex') {
          gameState = 'ENDING_GHOSTED';

          // Terrifying jumpscare stinger: ghost lunges forward!
          audio.playJumpscareStinger();
          ghostGroup.position.z += 1.8;
          headlightL.intensity = 6;
          headlightR.intensity = 6;
          triggerSubtleScare();

          setTimeout(() => {
            headlightL.intensity = 0;
            headlightR.intensity = 0;
            player.disable();
            interaction.interactables.clear();
            hud.showEnding("GHOSTED", "You should have listened.", true);
          }, 1200);
        } else if (choice === 'unknown') {
          gameState = 'ENDING_ESCAPED';

          player.disable();
          interaction.interactables.clear();
          hud.showEnding("ESCAPED", "You were never supposed to remember.", false);
        }
      }, () => {
        // "Now look behind you" event:
        // Door violently SLAMS SHUT and shadow figure appears twitching!
        audio.playDoorSlam();
        doorPanel.rotation.y = 0;
        ghostGroup.visible = true;
        ghostGroup.position.set(0.9, 0, 2.2);
        audio.startHeartbeat(360);
      });
    }, 3500);
  }

  const target = interaction.update();
  hud.update(target);

  renderer.render(scene, camera);
}
animate();
