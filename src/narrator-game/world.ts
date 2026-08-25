import {
  ABYSS_EDGE_X,
  ABYSS_FAR_EDGE_X,
  CAMERA_LOCK_X,
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  FALL_OUT_Y,
  GRAVITY,
  GROUND_Y,
  HANDOFF_X,
  INTRO_SPEED,
  INTRO_START_X,
  JUMP_VELOCITY,
  MOVE_SPEED,
  PLAYER_WIDTH,
  RESPAWN_X,
  SCREEN_WIDTH,
} from "./constants";
import { LINES } from "./script";
import { estimateDisplayMs } from "./timing";

export type Phase = "intro" | "playing" | "final_fall" | "ending";

export interface Input {
  left: boolean;
  right: boolean;
  /** Wird vom Aufrufer nach Konsum zurückgesetzt (edge-triggered). */
  jumpPressed: boolean;
}

interface SpeakFn {
  (line: string): void;
}

const TITLE_FADE_IN = 0.6;
const TITLE_HOLD = 2.4;
const TITLE_FADE_OUT = 0.7;
const TITLE_PAUSE = 0.6;
const ENDING_TOTAL = TITLE_FADE_IN + TITLE_HOLD + TITLE_FADE_OUT + TITLE_PAUSE;

export class NarratorWorld {
  phase: Phase = "intro";

  x = INTRO_START_X;
  y = GROUND_Y;
  vx = 0;
  vy = 0;
  onGround = true;
  facing: "left" | "right" = "right";

  cameraX = 0;
  t = 0;

  screensCrossed = 0;
  abyssLineFired = false;
  attempts = 0;
  canWalkBack = false;
  hasWrapped = false;
  pitTriggered = false;

  finalFallStage = 0;
  finalOffsetX = 0;

  endingT = 0;

  private speak: SpeakFn;
  /**
   * Eigene, simple Timer für die Erzähler-Sequenzierung (statt einer
   * Warteschlange in useVoiceOver) - so hängt der Spielfortschritt nie an
   * Sprachausgabe-Events, die manche Browser unzuverlässig feuern.
   */
  private timers: ReturnType<typeof setTimeout>[] = [];

  constructor(speak: SpeakFn) {
    this.speak = speak;
    this.speak(LINES.intro);
  }

  private after(ms: number, fn: () => void) {
    this.timers.push(setTimeout(fn, ms));
  }

  private clearTimers() {
    this.timers.forEach(clearTimeout);
    this.timers = [];
  }

  restart() {
    this.clearTimers();
    this.phase = "intro";
    this.x = INTRO_START_X;
    this.y = GROUND_Y;
    this.vx = 0;
    this.vy = 0;
    this.onGround = true;
    this.facing = "right";
    this.screensCrossed = 0;
    this.abyssLineFired = false;
    this.attempts = 0;
    this.canWalkBack = false;
    this.hasWrapped = false;
    this.pitTriggered = false;
    this.finalFallStage = 0;
    this.finalOffsetX = 0;
    this.endingT = 0;
    this.speak(LINES.intro);
  }

  private groundExistsAt(x: number) {
    return !(x > ABYSS_EDGE_X && x < ABYSS_FAR_EDGE_X);
  }

  private computeCamera() {
    if (this.canWalkBack) return CAMERA_LOCK_X;
    const raw = this.x - CANVAS_WIDTH / 2;
    return Math.min(Math.max(raw, 0), CAMERA_LOCK_X);
  }

  private onFallIntoPit() {
    if (this.hasWrapped) {
      this.phase = "final_fall";
      this.finalFallStage = 0;
      this.finalOffsetX = 0;
      this.vy = 0;
      this.playFinalFallSequence();
      return;
    }

    this.attempts += 1;
    this.x = RESPAWN_X;
    this.y = GROUND_Y;
    this.vx = 0;
    this.vy = 0;
    this.onGround = true;
    this.facing = "right";

    if (this.attempts === 1) {
      this.speak(LINES.died);
    } else if (this.attempts === 2) {
      this.speak(LINES.retry1);
    } else if (this.attempts === 3) {
      this.speak(LINES.retry2);
    } else if (this.attempts === 4) {
      // Wird sofort freigeschaltet, unabhängig von der Anzeigedauer der
      // Erzähler-Zeile - ein Spieler, der weiter ungeduldig springt, soll
      // trotzdem sofort rückwärts laufen können.
      this.canWalkBack = true;
      this.speak(`${LINES.retry3} ${LINES.gaveUp}`);
    } else {
      this.speak(LINES.stubborn);
    }
  }

  private playFinalFallSequence() {
    this.speak(LINES.finalFall1);
    this.after(estimateDisplayMs(LINES.finalFall1), () => {
      this.finalFallStage = 1;
      this.speak(LINES.finalFall2);
      this.after(estimateDisplayMs(LINES.finalFall2), () => {
        this.finalFallStage = 2;
        this.speak(LINES.finalFall3);
        this.after(estimateDisplayMs(LINES.finalFall3), () => {
          this.phase = "ending";
          this.endingT = 0;
        });
      });
    });
  }

  update(dt: number, input: Input) {
    dt = Math.min(dt, 1 / 20);
    this.t += dt;

    if (this.phase === "intro") {
      this.x += INTRO_SPEED * dt;
      this.facing = "right";
      if (this.x >= HANDOFF_X) {
        this.x = HANDOFF_X;
        this.phase = "playing";
      }
      this.cameraX = this.computeCamera();
      return;
    }

    if (this.phase === "playing") {
      const leftAllowed = this.canWalkBack;
      const wasGrounded = this.onGround;
      this.vx = 0;
      if (input.left && leftAllowed) {
        this.vx = -MOVE_SPEED;
        this.facing = "left";
      }
      if (input.right) {
        this.vx = MOVE_SPEED;
        this.facing = "right";
      }
      let nextX = this.x + this.vx * dt;
      // Man muss aktiv über die Kante springen - stehend/laufend geht man
      // nicht versehentlich in den Abgrund.
      if (wasGrounded && this.x <= ABYSS_EDGE_X && nextX > ABYSS_EDGE_X) {
        nextX = ABYSS_EDGE_X;
      }
      this.x = nextX;

      if (input.jumpPressed && this.onGround) {
        this.vy = JUMP_VELOCITY;
        this.onGround = false;
      }

      this.vy += GRAVITY * dt;
      this.y += this.vy * dt;

      const grounded = this.groundExistsAt(this.x);
      if (grounded && this.y >= GROUND_Y) {
        this.y = GROUND_Y;
        this.vy = 0;
        this.onGround = true;
      } else {
        this.onGround = false;
      }

      if (!grounded && this.y > FALL_OUT_Y && !this.pitTriggered) {
        this.pitTriggered = true;
        this.onFallIntoPit();
        this.pitTriggered = false;
      }

      if (this.screensCrossed < 1 && this.x >= HANDOFF_X + SCREEN_WIDTH * 1) {
        this.screensCrossed = 1;
        this.speak(LINES.screen1);
      } else if (this.screensCrossed < 2 && this.x >= HANDOFF_X + SCREEN_WIDTH * 2) {
        this.screensCrossed = 2;
        this.speak(LINES.screen2);
      } else if (this.screensCrossed < 3 && this.x >= HANDOFF_X + SCREEN_WIDTH * 3) {
        this.screensCrossed = 3;
        this.speak(LINES.screen3);
      }
      if (!this.abyssLineFired && this.x >= ABYSS_EDGE_X - 40) {
        this.abyssLineFired = true;
        this.speak(LINES.abyssApproach);
      }

      if (this.canWalkBack && this.x < CAMERA_LOCK_X - PLAYER_WIDTH) {
        this.x = CAMERA_LOCK_X + 24;
        this.vx = 0;
        this.facing = "right";
        if (!this.hasWrapped) {
          this.hasWrapped = true;
          this.speak(LINES.returnImpossible);
        } else {
          this.speak(LINES.returnLoop);
        }
      }

      this.cameraX = this.computeCamera();
      return;
    }

    if (this.phase === "final_fall") {
      let steer = 0;
      if (input.left) steer -= 1;
      if (input.right) steer += 1;
      this.finalOffsetX += steer * MOVE_SPEED * dt;
      const maxOffset = CANVAS_WIDTH / 2 - PLAYER_WIDTH;
      this.finalOffsetX = Math.min(maxOffset, Math.max(-maxOffset, this.finalOffsetX));
      return;
    }

    if (this.phase === "ending") {
      this.endingT += dt;
      if (this.endingT >= ENDING_TOTAL) {
        this.restart();
      }
      return;
    }
  }

  /** Für den Renderer: Fortschritt (0..1) der Titelkarten-Sequenz. */
  getEndingProgress() {
    const t = this.endingT;
    if (t < TITLE_FADE_IN) return { bg: t / TITLE_FADE_IN, text: 0 };
    if (t < TITLE_FADE_IN + TITLE_HOLD) return { bg: 1, text: 1 };
    if (t < TITLE_FADE_IN + TITLE_HOLD + TITLE_FADE_OUT) {
      const local = (t - TITLE_FADE_IN - TITLE_HOLD) / TITLE_FADE_OUT;
      return { bg: 1, text: 1 - local };
    }
    return { bg: 1, text: 0 };
  }
}
