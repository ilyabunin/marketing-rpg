/**
 * SocialSystem.ts — Character conversations with speech bubbles
 *
 * Characters periodically gather in groups and show pixel speech-bubble
 * images above their heads, creating a lively office atmosphere.
 *
 * Rules:
 * - Max 3 conversations per minute, 20 sec cooldown between them
 * - Only idle characters participate (not working, not in chat)
 * - Minimum 2 idle characters required
 * - Groups: 60% pairs, 25% trios, 15% quads/full
 * - Characters walk toward a meeting point, then show bubbles, then disperse
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

const CONVERSATION_COOLDOWN = 20_000; // 20 seconds
const MAX_PER_MINUTE = 3;
const BUBBLE_SCALE = 0.7;
const GATHER_TIME = 3000; // ms to walk to meeting point before starting bubbles

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
  let currentParticipants: CharRef[] = [];

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
    // Safety: check the texture exists in cache
    const bName = randomBubbleName();
    if (!scene.textures.exists(bName)) return null;

    const bubble = scene.add.image(
      char.sprite.x,
      char.sprite.y - 60,
      bName
    );
    bubble.setScale(0);
    bubble.setOrigin(0.5, 1); // anchor at bottom-center (above head)
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

    currentParticipants.forEach((p) => {
      p.isTalking = false;
      // Only restart walking if still idle
      if (p.status === "idle") api.startWalking(p);
    });
    currentParticipants = [];
  }

  // ─── Conversation flow ─────────────────────────────────────

  function startConversation() {
    const idle = getIdleChars();
    if (idle.length < 2) return;

    // Pick group size
    const roll = Math.random();
    let count: number;
    if (roll < 0.6) count = 2;
    else if (roll < 0.85) count = 3;
    else count = Math.min(idle.length, 4 + Math.floor(Math.random() * 2));
    count = Math.min(count, idle.length);

    // Shuffle and pick participants
    const shuffled = [...idle].sort(() => Math.random() - 0.5);
    const participants = shuffled.slice(0, count);

    activeConversation = true;
    currentParticipants = participants;

    // Mark as talking & stop walking
    participants.forEach((p) => {
      p.isTalking = true;
      api.stopWalking(p);
    });

    // Meeting point — somewhere in the center of the room
    const meetX = 350 + Math.random() * 550;
    const meetY = 280 + Math.random() * 300;

    // ── Phase 1: Walk toward meeting point ──

    participants.forEach((p, i) => {
      // Arrange in a small circle around meeting point
      const angle = (i / count) * Math.PI * 2;
      const offsetX = Math.cos(angle) * 30;
      const offsetY = Math.sin(angle) * 30;
      const targetX = Math.max(48, Math.min(1200, meetX + offsetX));
      const targetY = Math.max(48, Math.min(816, meetY + offsetY));

      const dx = targetX - p.sprite.x;
      const dy = targetY - p.sprite.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 10) return; // already close enough

      const dir = getDirection(dx, dy);
      p.sprite.play(`${p.spriteName}-walk-${dir}`);

      p.currentTween = scene.tweens.add({
        targets: p.sprite,
        x: targetX,
        y: targetY,
        duration: (dist / 55) * 1000,
        ease: "Linear",
        onUpdate: () => api.updateLabelPos(p),
        onComplete: () => {
          p.currentTween = null;
          p.sprite.stop();
          p.sprite.setFrame(0);
          api.updateLabelPos(p);
        },
      });
    });

    // ── Phase 2: Start bubbles after a fixed gather time ──
    // (Don't wait for all arrivals — timeout-based is more robust)

    scene.time.delayedCall(GATHER_TIME, () => {
      if (!activeConversation) return;

      // Stop any still-walking participants and face them toward center
      participants.forEach((p) => {
        if (p.currentTween) {
          p.currentTween.stop();
          p.currentTween = null;
          p.sprite.stop();
        }
        const dx = meetX - p.sprite.x;
        const dy = meetY - p.sprite.y;
        const dir = getDirection(dx, dy);
        p.sprite.setFrame(FACE_FRAMES[dir] ?? 0);
        api.updateLabelPos(p);
      });

      // Show speech bubbles sequentially
      const totalBubbles =
        participants.length * (1 + Math.floor(Math.random() * 2));
      let bubbleIdx = 0;

      function showNextBubble() {
        if (bubbleIdx >= totalBubbles || !activeConversation) {
          endConversation();
          return;
        }

        const speaker = participants[bubbleIdx % participants.length];
        // Check speaker is still in conversation
        if (!speaker.isTalking) {
          endConversation();
          return;
        }

        const bubble = showBubble(speaker);
        const displayTime = 1500 + Math.random() * 1000;

        scene.time.delayedCall(displayTime, () => {
          if (bubble) hideBubble(bubble);
          bubbleIdx++;
          const pause = 500 + Math.random() * 1000;
          scene.time.delayedCall(pause, showNextBubble);
        });
      }

      // Small pause then start
      scene.time.delayedCall(300, showNextBubble);
    });

    // Safety timeout — force end after 15 seconds
    scene.time.delayedCall(15_000, () => {
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
    const delay = 20_000 + Math.random() * 10_000; // 20-30 sec
    scene.time.delayedCall(delay, () => {
      tryStartConversation();
      scheduleNext();
    });
  }

  // First conversation attempt after 8 seconds (let characters spread out first)
  scene.time.delayedCall(8_000, () => {
    tryStartConversation();
    scheduleNext();
  });
}
