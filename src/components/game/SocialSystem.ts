/**
 * SocialSystem.ts — 1-on-1 character conversations with speech bubbles
 *
 * Dialogue always starts with a QUESTION, always ends with an ANSWER.
 * Pattern: Q → A (1 exchange), Q → A → Q → A (2 exchanges), etc.
 * 1–4 exchanges per conversation.
 *
 * Uses pathfinding for conversation meeting points.
 */

import type { CharRef, CharacterSystemAPI } from "./CharacterSprites";

// ─── Question bubbles (in /public/sprites/questions/) ────────
const QUESTION_NAMES = [
  "q-3", "q-7", "q-8", "q-9", "q-10",
  "q-11", "q-12", "q-13", "q-14", "q-15",
  "q-16", "q-17", "q-18", "q-19", "q-20",
  "q-21", "q-22", "q-23", "q-24", "q-25", "q-26",
];
const QUESTION_PATHS: Record<string, string> = {
  "q-3": "/sprites/questions/pixel-speech-bubble-3.png",
  "q-7": "/sprites/questions/pixel-speech-bubble-7.png",
  "q-8": "/sprites/questions/pixel-speech-bubble-8.png",
  "q-9": "/sprites/questions/pixel-speech-bubble-9.png",
  "q-10": "/sprites/questions/pixel-speech-bubble-10.png",
  "q-11": "/sprites/questions/pixel-speech-bubble-11.png",
  "q-12": "/sprites/questions/pixel-speech-bubble-12.png",
  "q-13": "/sprites/questions/pixel-speech-bubble-13.png",
  "q-14": "/sprites/questions/pixel-speech-bubble-14.png",
  "q-15": "/sprites/questions/pixel-speech-bubble-15.png",
  "q-16": "/sprites/questions/pixel-speech-bubble-16.png",
  "q-17": "/sprites/questions/pixel-speech-bubble-17.png",
  "q-18": "/sprites/questions/pixel-speech-bubble-18.png",
  "q-19": "/sprites/questions/pixel-speech-bubble-19.png",
  "q-20": "/sprites/questions/pixel-speech-bubble-20.png",
  "q-21": "/sprites/questions/pixel-speech-bubble-21.png",
  "q-22": "/sprites/questions/pixel-speech-bubble-22.png",
  "q-23": "/sprites/questions/pixel-speech-bubble-23.png",
  "q-24": "/sprites/questions/pixel-speech-bubble-24.png",
  "q-25": "/sprites/questions/pixel-speech-bubble-25.png",
  "q-26": "/sprites/questions/pixel-speech-bubble-26.png",
};

// ─── Answer/talk bubbles (in /public/sprites/talks/) ─────────
const ANSWER_NAMES = [
  "a-0", "a-2", "a-3", "a-4", "a-5", "a-6", "a-7", "a-8",
  "a-10", "a-11", "a-12", "a-13", "a-15", "a-16",
  "a-18", "a-19", "a-21", "a-22",
  "a-24", "a-25", "a-26", "a-27", "a-28",
];
const ANSWER_PATHS: Record<string, string> = {
  "a-0": "/sprites/talks/pixel-speech-bubble.png",
  "a-2": "/sprites/talks/pixel-speech-bubble-2.png",
  "a-3": "/sprites/talks/pixel-speech-bubble-3.png",
  "a-4": "/sprites/talks/pixel-speech-bubble-4.png",
  "a-5": "/sprites/talks/pixel-speech-bubble-5.png",
  "a-6": "/sprites/talks/pixel-speech-bubble-6.png",
  "a-7": "/sprites/talks/pixel-speech-bubble-7.png",
  "a-8": "/sprites/talks/pixel-speech-bubble-8.png",
  "a-10": "/sprites/talks/pixel-speech-bubble-10.png",
  "a-11": "/sprites/talks/pixel-speech-bubble-11.png",
  "a-12": "/sprites/talks/pixel-speech-bubble-12.png",
  "a-13": "/sprites/talks/pixel-speech-bubble-13.png",
  "a-15": "/sprites/talks/pixel-speech-bubble-15.png",
  "a-16": "/sprites/talks/pixel-speech-bubble-16.png",
  "a-18": "/sprites/talks/pixel-speech-bubble-18.png",
  "a-19": "/sprites/talks/pixel-speech-bubble-19.png",
  "a-21": "/sprites/talks/pixel-speech-bubble-21.png",
  "a-22": "/sprites/talks/pixel-speech-bubble-22.png",
  "a-24": "/sprites/talks/pixel-speech-bubble-24.png",
  "a-25": "/sprites/talks/pixel-speech-bubble-25.png",
  "a-26": "/sprites/talks/pixel-speech-bubble-26.png",
  "a-27": "/sprites/talks/pixel-speech-bubble-27.png",
  "a-28": "/sprites/talks/pixel-speech-bubble-28.png",
};

const CONVERSATION_COOLDOWN = 10_000;
const MAX_PER_MINUTE = 5;
const BUBBLE_SCALE = 0.5;

const FACE_FRAMES: Record<string, number> = {
  down: 0, left: 4, right: 8, up: 12,
};

/** Call in Phaser preload() */
export function preloadSpeechBubbles(scene: Phaser.Scene) {
  QUESTION_NAMES.forEach((k) => scene.load.image(k, QUESTION_PATHS[k]));
  ANSWER_NAMES.forEach((k) => scene.load.image(k, ANSWER_PATHS[k]));
}

export interface SocialSystemAPI {
  triggerConversation: (askerId: string, answererId: string) => void;
}

/** Call in Phaser create() after placeCharacters */
export function initSocialSystem(
  scene: Phaser.Scene,
  api: CharacterSystemAPI
): SocialSystemAPI {
  let lastConvTime = 0;
  let convThisMinute = 0;
  let minuteStart = scene.time.now;
  let activeConversation = false;
  let currentPair: [CharRef, CharRef] | null = null;

  function getIdleChars(): CharRef[] {
    return Array.from(api.charRefs.values()).filter(
      (r) => r.status === "idle" && !r.isTalking
    );
  }

  function pickRandom<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function getDirection(dx: number, dy: number): string {
    if (Math.abs(dx) > Math.abs(dy)) return dx > 0 ? "right" : "left";
    return dy > 0 ? "down" : "up";
  }

  // ─── Speech bubble ─────────────────────────────────────────

  function showBubble(
    char: CharRef,
    textureKey: string,
    participantIndex = 0,
    totalParticipants = 1
  ): Phaser.GameObjects.Image | null {
    if (!scene.textures.exists(textureKey)) return null;
    const bubble = scene.add.image(char.sprite.x, char.sprite.y - 35, textureKey);
    bubble.setScale(0);
    bubble.setOrigin(0.5, 1);
    bubble.setDepth(10);

    // Anti-overlap offset for group conversations
    if (totalParticipants > 1) {
      const offsetX = (participantIndex - (totalParticipants - 1) / 2) * 15;
      bubble.x += offsetX;
    }

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

  // ─── End conversation ──────────────────────────────────────

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

  // ─── 1-on-1 conversation (auto-scheduled) ────────────────

  function startConversation() {
    const idle = getIdleChars();
    if (idle.length < 2) return;

    const shuffled = [...idle].sort(() => Math.random() - 0.5);
    runConversation(shuffled[0], shuffled[1]);
  }

  // ─── User-triggered conversation between two specific characters ──

  async function runConversation(asker: CharRef, answerer: CharRef) {
    activeConversation = true;
    currentPair = [asker, answerer];

    asker.isTalking = true;
    answerer.isTalking = true;
    api.stopWalking(asker);
    api.stopWalking(answerer);

    // Answerer walks toward asker
    const target = {
      x: asker.sprite.x + (Math.random() - 0.5) * 40,
      y: asker.sprite.y + (Math.random() - 0.5) * 40,
    };

    const walkPromise = api.walkToPoint(answerer, target, 55);
    const timeout = new Promise<void>((r) => {
      scene.time.delayedCall(3000, r);
    });
    await Promise.race([walkPromise, timeout]);

    if (!activeConversation) return;

    answerer.interrupted = true;
    answerer.currentTween?.stop();
    answerer.currentTween = null;
    answerer.sprite.stop();

    const distBetween = Math.sqrt(
      (asker.sprite.x - answerer.sprite.x) ** 2 +
      (asker.sprite.y - answerer.sprite.y) ** 2
    );
    if (distBetween > 120) {
      endConversation();
      return;
    }

    const fdx = asker.sprite.x - answerer.sprite.x;
    const fdy = asker.sprite.y - answerer.sprite.y;
    asker.sprite.setFrame(FACE_FRAMES[getDirection(-fdx, -fdy)] ?? 0);
    answerer.sprite.setFrame(FACE_FRAMES[getDirection(fdx, fdy)] ?? 0);
    api.updateLabelPos(asker);
    api.updateLabelPos(answerer);

    const exchanges = 1 + Math.floor(Math.random() * 4);
    const totalSteps = exchanges * 2;

    for (let step = 0; step < totalSteps; step++) {
      if (!activeConversation) break;

      const isQuestion = step % 2 === 0;
      const speaker = isQuestion ? asker : answerer;
      if (!speaker.isTalking) break;

      const key = isQuestion
        ? pickRandom(QUESTION_NAMES)
        : pickRandom(ANSWER_NAMES);

      const speakerIdx = speaker === asker ? 0 : 1;
      const bubble = showBubble(speaker, key, speakerIdx, 2);
      const displayTime = 1200 + Math.random() * 800;

      await new Promise<void>((resolve) => {
        scene.time.delayedCall(displayTime, () => {
          if (bubble) hideBubble(bubble);
          resolve();
        });
      });

      if (step < totalSteps - 1) {
        await new Promise<void>((resolve) => {
          scene.time.delayedCall(400 + Math.random() * 600, resolve);
        });
      }
    }

    endConversation();
  }

  function triggerConversation(askerId: string, answererId: string) {
    if (activeConversation) return;
    const asker = api.charRefs.get(askerId);
    const answerer = api.charRefs.get(answererId);
    if (!asker || !answerer) return;
    if (asker.status !== "idle" || answerer.status !== "idle") return;
    runConversation(asker, answerer);
  }

  // ─── Scheduler ─────────────────────────────────────────────

  function tryStartConversation() {
    const now = scene.time.now;
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
    const delay = 10_000 + Math.random() * 8_000;
    scene.time.delayedCall(delay, () => {
      tryStartConversation();
      scheduleNext();
    });
  }

  scene.time.delayedCall(6_000, () => {
    tryStartConversation();
    scheduleNext();
  });

  return { triggerConversation };
}
