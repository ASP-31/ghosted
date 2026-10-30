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

// ── Horror state ──────────────────────────────────────────────────
let footstepCooldown = 0;
let hallFlickerT = 0;
const hallBaseIntensity = 1.6;
let shakeAmount = 0;
const baseY = camera.position.y;
let hallwayHorrorStarted = false;
let hallwayHorrorInterval = null;
let whisperLoopInterval = null;
let hallwaySteps = 0;

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
            // Door fully open
            interaction.unregister(doorPanel);
            const cIdx = colliders.indexOf(doorCollider);
            if (cIdx > -1) colliders.splice(cIdx, 1);

            gameState = 'DOOR_OPENED';
            hallwaySteps = 0;
            hud.showMessage("The hallway is quiet...\nInvestigate.", 3500);
            audio.playWhisper();
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
  const now = performance.now();
  const camZ = camera.position.z;
  const inHallway = camZ > 2.3;
  const inTenseState = gameState === 'PHOTO_REVEALED' || gameState === 'DOOR_OPENED' ||
                       gameState === 'ACCIDENT_TRIGGERED' || gameState === 'ENDING_CHOICE';

  // ── 1. HALLWAY LIGHT FLICKER ────────────────────────────────────
  if (inHallway && hallLight) {
    hallFlickerT += 0.016;
    const base = hallBaseIntensity;
    // Slow swell + random micro-stutter
    const flicker = Math.sin(hallFlickerT * 1.3) * 0.15 +
                    (Math.random() < 0.04 ? (Math.random() - 0.5) * base : 0);
    hallLight.intensity = Math.max(0, base + flicker);
    // Occasional full-off stutter (1% chance per frame)
    if (Math.random() < 0.008) {
      hallLight.intensity = 0;
      setTimeout(() => { if (hallLight) hallLight.intensity = base; }, 60 + Math.random() * 80);
    }
  }

  // ── 2. CAMERA MICRO-SHAKE ───────────────────────────────────────
  if (shakeAmount > 0.001) {
    camera.position.x += (Math.random() - 0.5) * shakeAmount;
    camera.position.y += (Math.random() - 0.5) * shakeAmount * 0.5;
    shakeAmount *= 0.88; // decay
  } else if (inTenseState) {
    // Very subtle perpetual breathing sway
    const sway = Math.sin(now * 0.001) * 0.003;
    camera.position.y = baseY + sway;
  }

  // ── 3. FOOTSTEPS ────────────────────────────────────────────────
  if (footstepCooldown > 0) footstepCooldown -= 16;
  const isMoving = ['KeyW','KeyS','KeyA','KeyD'].some(k => player.keys[k]);
  if (isMoving && footstepCooldown <= 0) {
    audio.playFootstep();
    footstepCooldown = inHallway ? 480 : 520; // faster echo in hallway
    if (gameState === 'DOOR_OPENED' && inHallway) {
      hallwaySteps++;
    }
  }

  // ── HALLWAY HORROR ENGINE (Suspenseful quiet start) ─────────────
  if (gameState === 'DOOR_OPENED' && inHallway && !hallwayHorrorStarted) {
    hallwayHorrorStarted = true;
    audio.startBreathing(2200);

    // Subtle whispers begin after 4 seconds of walking
    whisperLoopInterval = setInterval(() => {
      audio.playWhisper();
      shakeAmount = Math.max(shakeAmount, 0.008);
    }, 4500);
  }

  // Stop hallway loops when accident hits
  if (gameState === 'ACCIDENT_TRIGGERED' && hallwayHorrorInterval) {
    clearInterval(hallwayHorrorInterval); hallwayHorrorInterval = null;
  }
  if (gameState === 'ACCIDENT_TRIGGERED' && whisperLoopInterval) {
    clearInterval(whisperLoopInterval); whisperLoopInterval = null;
  }

  // ── Ghost twitch jitter & sustained jumpscare animation ─────────
  if (gameState === 'ENDING_GHOSTED') {
    // Sustained terrifying jumpscare: ghost stays right in the player's face twitching violently
    const dir = new THREE.Vector3();
    camera.getWorldDirection(dir);
    ghostGroup.position.set(
      camera.position.x + dir.x * 0.65 + (Math.random() - 0.5) * 0.06,
      (Math.random() - 0.5) * 0.03,
      camera.position.z + dir.z * 0.65 + (Math.random() - 0.5) * 0.06
    );
    ghostGroup.rotation.z = (Math.random() - 0.5) * 0.22;
    ghostGroup.rotation.y = camera.rotation.y + Math.PI + (Math.random() - 0.5) * 0.15;
    ghostGroup.visible = true;

    // Headlights strobe wildly
    const strobe = Math.random() < 0.55;
    headlightL.intensity = strobe ? 16 : 2;
    headlightR.intensity = strobe ? 16 : 2;
    shakeAmount = Math.max(shakeAmount, 0.09 + Math.random() * 0.08);
  } else if (ghostGroup && ghostGroup.visible) {
    ghostGroup.position.x = 0.9 + (Math.random() - 0.5) * 0.04;
    ghostGroup.rotation.z = (Math.random() - 0.5) * 0.07;
  }

  // ── Accident Scene Discovery — player walks ~5 steps into hallway, thinking nothing is there ───
  if (gameState === 'DOOR_OPENED' && (hallwaySteps >= 5 || camZ > 3.85)) {
    gameState = 'ACCIDENT_TRIGGERED';
    audio.stopBreathing();
    shakeAmount = 0.14;

    audio.playCrashSound();
    headlightL.intensity = 15;
    headlightR.intensity = 15;
    setTimeout(() => {
      headlightL.intensity = 0;
      headlightR.intensity = 0;
    }, 380);

    triggerSubtleScare();
    hud.showPermanentMessage("Tyre tracks... Broken glass and blood.\nThe crash happened here.");

    setTimeout(async () => {
      gameState = 'ENDING_CHOICE';

      await phone.startFinalConversation(async (choice) => {
        audio.stopHeartbeat();

        if (choice === 'alex') {
          gameState = 'ENDING_GHOSTED';

          // Trap player facing the jumpscare:
          player.disable();
          interaction.interactables.clear();

          // Sustained horror roar and violent camera shake:
          audio.playJumpscareStinger();
          shakeAmount = 0.22;

          // Position ghost directly in camera face:
          const dir = new THREE.Vector3();
          camera.getWorldDirection(dir);
          ghostGroup.position.set(
            camera.position.x + dir.x * 0.65,
            0,
            camera.position.z + dir.z * 0.65
          );
          ghostGroup.lookAt(camera.position.x, ghostGroup.position.y, camera.position.z);
          ghostGroup.visible = true;

          triggerSubtleScare();

          // Jumpscare stays active and intense for 3.5 seconds before ending screen overlays
          setTimeout(() => {
            hud.showEnding("GHOSTED", "You should have listened.", true);
          }, 3500);
        } else if (choice === 'unknown') {
          gameState = 'ENDING_ESCAPED';
          player.disable();
          interaction.interactables.clear();
          hud.showEnding("ESCAPED", "You were never supposed to remember.", false);
        }
      }, () => {
        // "Now look behind you" event:
        // Door slams shut and shadow figure appears right behind player
        audio.playDoorSlam();
        shakeAmount = 0.08;
        doorPanel.rotation.y = 0;
        ghostGroup.visible = true;
        ghostGroup.position.set(0.9, 0, 2.15);
        audio.startHeartbeat(340);
        hud.showPermanentMessage("LOOK BEHIND YOU.");
      });
    }, 1200);
  }

  const target = interaction.update();
  hud.update(target);
  renderer.render(scene, camera);
}
animate();
