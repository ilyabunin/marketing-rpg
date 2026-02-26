/**
 * SocialSystem.ts — 1-on-1 character conversations with speech bubbles
 *
 * Characters periodically form PAIRS and show pixel speech-bubble
 * images above their heads, creating a lively office atmosphere.
 *
 * Rules:
 * - Only 1-on-1 conversations (exactly 2 characters)
 * - Max 5 conversations per minute, 10 sec cooldown
 * - Only idle characters participate (not working, not in chat)
 * - One character walks toward the other (not both to center)
 * - After talking they return to wandering
 */

import type { CharRef, CharacterSystemAPI } from "./CharacterSprites";

// All speech bubble PNG files in /public/sprites/talks/
const BUBBLE_NAMES = [
  "pixel-speech-bubble",
  "pixel-speech-bubble-2",
  "pixel-speech-bubble-3",
  "pixel-speech-bubble-4",
  "pixel-speech-bubble-5",
  "pixel-speech-bubble-6",
  "pixel-speech-bubble-7",
  "pixel-speech-bubble-8",
  "pixel-speech-bubble-9",
  "pixel-speech-bubble-10",
  "pixel-speech-bubble-11",
  "pixel-speech-bubble-12",
  "pixel-speech-bubble-13",
  "pixel-speech-bubble-14",
  "pixel-speech-bubble-15",
  "pixel-speech-bubble-16",
  "pixel-speech-bubble-17",
  "pixel-speech-bubble-18",
  "pixel-speech-bubble-19",
  "pixel-speech-bubble-20",
  "pixel-speech-bubble-21",
  "pixel-speech-bubble-22",
  "pixel-speech-bubble-23",
  "pixel-speech-bubble-24",
  "pixel-speech-bubble-25",
  "pixel-speech-bubble-26",
  "pixel-speech-bubble-27",
  "pixel-speech-bubble-28",
];

const CONVERSATION_COOLDOWN = 10_000; // 10 seconds between conversations
const MAX_PER_MINUTE = 5;
const BUBBLE_SCALE = 0.5; // 30% smaller than before (was 0.7)
const APPROACH_TIME = 2500; // ms for one char to walk toward the other

// Direction frame lookup for facing
const FACE_FRAMES: Record<string, number> = {
  down: 0,
  left: 4,
  right: 8,
  up: 12,
};

/** Call in Phaser preload() */
export function preloadSpeechBubbles(scene: Phaser.Scene) {
  BUBBLE_NAMES.forEach((name) => {
    scene.load.image(name, `/sprites/talks/${name}.png`);
  });
}

/** Call in Phaser create() after placeCharacters */
export function initSocialSystem(
  scene: Phaser.Scene,
  api: CharacterSystemAPI
) {
  let lastConvTime = 0;
  let convThisMinute = 0;
  let minuteStart = scene.time.now;
  let activeConversation = false;
  let currentPair: [CharRef, CharRef] | null = null;

  // ─── Helpers ───────────────────────────────────────────────

  function getIdleChars(): CharRef[] {
    return Array.from(api.charRefs.values()).filter(
      (r) => r.status === "idle" && !r.isTalking
    );
  }

  function randomBubbleName(): string {
    return BUBBLE_NAMES[Math.floor(Math.random() * BUBBLE_NAMES.length)];
  }

  function getDirection(dx: number, dy: number): string {
    if (Math.abs(dx) > Math.abs(dy)) return dx > 0 ? "right" : "left";
    return dy > 0 ? "down" : "up";
  }

  // ─── Speech bubble show/hide ───────────────────────────────

  function showBubble(char: CharRef): Phaser.GameObjects.Image | null {
    const bName = randomBubbleName();
    if (!scene.textures.exists(bName)) return null;

    const bubble = scene.add.image(
      char.sprite.x,
      char.sprite.y - 60,
      bName
    );
    bubble.setScale(0);
    bubble.setOrigin(0.5, 1);
    bubble.setDepth(8);

    scene.tweens.add({
      targets: bubble,
      scale: BUBBLE_SCALE,
      duration: 200,
      ease: "Back.easeOut",
    });

    return bubble;
  }

  function hideBubble(bubble: Phaser.GameObjects.Image) {
    scene.tweens.add({
      targets: bubble,
      alpha: 0,
      duration: 300,
      onComplete: () => bubble.destroy(),
    });
  }

  // ─── End conversation (cleanup) ────────────────────────────

  function endConversation() {
    if (!activeConversation) return;
    activeConversation = false;
    lastConvTime = scene.time.now;
    convThisMinute++;

    if (currentPair) {
      currentPair.forEach((p) => {
        p.isTalking = false;
        if (p.status === "idle") api.startWalking(p);
      });
      currentPair = null;
    }
  }

  // ─── 1-on-1 Conversation ──────────────────────────────────

  function startConversation() {
    const idle = getIdleChars();
    if (idle.length < 2) return;

    // Pick 2 random idle characters
    const shuffled = [...idle].sort(() => Math.random() - 0.5);
    const charA = shuffled[0]; // stays put
    const charB = shuffled[1]; // walks toward charA

    activeConversation = true;
    currentPair = [charA, charB];

    // Mark as talking & stop walking
    charA.isTalking = true;
    charB.isTalking = true;
    api.stopWalking(charA);
    api.stopWalking(charB);

    // charB walks toward charA (stop ~35px away)
    const dx = charA.sprite.x - charB.sprite.x;
    const dy = charA.sprite.y - charB.sprite.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    // Target: 35px from charA, on the line between them
    let targetX = charB.sprite.x;
    let targetY = charB.sprite.y;
    if (dist > 40) {
      const ratio = (dist - 35) / dist;
      targetX = charB.sprite.x + dx * ratio;
      targetY = charB.sprite.y + dy * ratio;
    }
    targetX = Math.max(48, Math.min(1200, targetX));
    targetY = Math.max(48, Math.min(816, targetY));

    const moveDist = Math.sqrt(
      (targetX - charB.sprite.x) ** 2 + (targetY - charB.sprite.y) ** 2
    );

    if (moveDist > 5) {
      const dir = getDirection(
        targetX - charB.sprite.x,
        targetY - charB.sprite.y
      );
      charB.sprite.play(`${charB.spriteName}-walk-${dir}`);

      charB.currentTween = scene.tweens.add({
        targets: charB.sprite,
        x: targetX,
        y: targetY,
        duration: Math.min((moveDist / 55) * 1000, APPROACH_TIME),
        ease: "Linear",
        onUpdate: () => api.updateLabelPos(charB),
        onComplete: () => {
          charB.currentTween = null;
          charB.sprite.stop();
          api.updateLabelPos(charB);
        },
      });
    }

    // ── Phase 2: Start bubbles after approach time ──

    scene.time.delayedCall(APPROACH_TIME, () => {
      if (!activeConversation) return;

      // Stop charB if still walking, face each other
      if (charB.currentTween) {
        charB.currentTween.stop();
        charB.currentTween = null;
        charB.sprite.stop();
      }

      // Face each other
      const fdx = charA.sprite.x - charB.sprite.x;
      const fdy = charA.sprite.y - charB.sprite.y;
      const dirAtoB = getDirection(-fdx, -fdy);
      const dirBtoA = getDirection(fdx, fdy);
      charA.sprite.setFrame(FACE_FRAMES[dirAtoB] ?? 0);
      charB.sprite.setFrame(FACE_FRAMES[dirBtoA] ?? 0);
      api.updateLabelPos(charA);
      api.updateLabelPos(charB);

      // Show 2-4 bubbles, alternating speakers
      const totalBubbles = 2 + Math.floor(Math.random() * 3); // 2-4
      let bubbleIdx = 0;

      function showNextBubble() {
        if (bubbleIdx >= totalBubbles || !activeConversation) {
          endConversation();
          return;
        }

        const speaker = bubbleIdx % 2 === 0 ? charA : charB;
        if (!speaker.isTalking) {
          endConversation();
          return;
        }

        const bubble = showBubble(speaker);
        const displayTime = 1200 + Math.random() * 800; // 1.2-2s

        scene.time.delayedCall(displayTime, () => {
          if (bubble) hideBubble(bubble);
          bubbleIdx++;
          const pause = 400 + Math.random() * 600; // 0.4-1s
          scene.time.delayedCall(pause, showNextBubble);
        });
      }

      scene.time.delayedCall(200, showNextBubble);
    });

    // Safety timeout — force end after 12 seconds
    scene.time.delayedCall(12_000, () => {
      if (activeConversation) endConversation();
    });
  }

  // ─── Scheduler ─────────────────────────────────────────────

  function tryStartConversation() {
    const now = scene.time.now;

    // Reset per-minute counter
    if (now - minuteStart > 60_000) {
      convThisMinute = 0;
      minuteStart = now;
    }

    if (activeConversation) return;
    if (convThisMinute >= MAX_PER_MINUTE) return;
    if (now - lastConvTime < CONVERSATION_COOLDOWN) return;

    const idle = getIdleChars();
    if (idle.length < 2) return;

    startConversation();
  }

  function scheduleNext() {
    const delay = 10_000 + Math.random() * 8_000; // 10-18 sec
    scene.time.delayedCall(delay, () => {
      tryStartConversation();
      scheduleNext();
    });
  }

  // First conversation attempt after 6 seconds
  scene.time.delayedCall(6_000, () => {
    tryStartConversation();
    scheduleNext();
  });
}
