export interface PointerSample {
  x: number;
  y: number;
  t: number;
  speed: number; // px / ms
}

export class MotionTracker {
  private samples: PointerSample[] = [];
  private maxSamples = 120;
  private missedClicksCount = 0;
  private overshootsCount = 0;
  private currentTargetCenter: { x: number; y: number } | null = null;
  private targetSpawnTime: number = 0;
  private reactionTimes: number[] = [];
  private previousDistanceToTarget: number = Infinity;
  private wasApproaching: boolean = false;

  public reset() {
    this.samples = [];
    this.missedClicksCount = 0;
    this.overshootsCount = 0;
    this.currentTargetCenter = null;
    this.targetSpawnTime = performance.now();
    this.reactionTimes = [];
    this.previousDistanceToTarget = Infinity;
    this.wasApproaching = false;
  }

  public setTarget(x: number, y: number) {
    this.currentTargetCenter = { x, y };
    this.targetSpawnTime = performance.now();
    this.previousDistanceToTarget = Infinity;
    this.wasApproaching = false;
  }

  public registerTargetHit() {
    if (this.targetSpawnTime > 0) {
      const reaction = performance.now() - this.targetSpawnTime;
      if (reaction > 50 && reaction < 5000) {
        this.reactionTimes.push(reaction);
      }
    }
    this.currentTargetCenter = null;
  }

  public registerMissedClick() {
    this.missedClicksCount++;
  }

  public addSample(x: number, y: number) {
    const t = performance.now();
    let speed = 0;

    if (this.samples.length > 0) {
      const last = this.samples[this.samples.length - 1];
      const dt = t - last.t;
      if (dt > 0) {
        const dist = Math.hypot(x - last.x, y - last.y);
        speed = dist / dt;
      }
    }

    this.samples.push({ x, y, t, speed });
    if (this.samples.length > this.maxSamples) {
      this.samples.shift();
    }

    // Overshoot detection: cursor approached target closely, then moved further away without hitting
    if (this.currentTargetCenter) {
      const dist = Math.hypot(x - this.currentTargetCenter.x, y - this.currentTargetCenter.y);
      if (dist < 80) {
        if (this.wasApproaching && dist > this.previousDistanceToTarget + 12) {
          this.overshootsCount++;
          this.wasApproaching = false; // avoid double counting same approach
        } else if (dist < this.previousDistanceToTarget) {
          this.wasApproaching = true;
        }
      }
      this.previousDistanceToTarget = dist;
    }
  }

  // Calculate live stats
  public getLiveMetrics() {
    if (this.samples.length < 5) {
      return {
        speedPxMs: 0,
        jitterScore: 10,
        smoothIndex: 85,
      };
    }

    // Speed
    const recent = this.samples.slice(-10);
    const avgSpeed = recent.reduce((sum, s) => sum + s.speed, 0) / recent.length;

    // Calculate angular directional variation (jitter)
    let angleChanges: number[] = [];
    for (let i = 2; i < recent.length; i++) {
      const p0 = recent[i - 2];
      const p1 = recent[i - 1];
      const p2 = recent[i];

      const a1 = Math.atan2(p1.y - p0.y, p1.x - p0.x);
      const a2 = Math.atan2(p2.y - p1.y, p2.x - p1.x);

      let diff = Math.abs(a2 - a1);
      if (diff > Math.PI) diff = 2 * Math.PI - diff;
      angleChanges.push(diff);
    }

    const avgAngleChange = angleChanges.length > 0
      ? angleChanges.reduce((a, b) => a + b, 0) / angleChanges.length
      : 0;

    // Jitter score: 0 to 100
    const rawJitter = Math.min(100, (avgAngleChange / Math.PI) * 120);
    const jitterScore = Math.round(rawJitter);

    // Smoothness index: Inverse of speed variance and angle variance
    const speedVariance = recent.reduce((sum, s) => sum + Math.pow(s.speed - avgSpeed, 2), 0) / recent.length;
    const rawSmooth = Math.max(10, Math.min(100, 100 - (rawJitter * 0.6 + speedVariance * 25)));
    const smoothIndex = Math.round(rawSmooth);

    return {
      speedPxMs: Number(avgSpeed.toFixed(2)),
      jitterScore,
      smoothIndex,
    };
  }

  public getSummary(totalHits: number, targetCount: number, durationSeconds: number, difficultyFactor: number) {
    const live = this.getLiveMetrics();
    const totalAttempts = totalHits + this.missedClicksCount;
    const accuracy = totalAttempts > 0 ? (totalHits / totalAttempts) * 100 : (totalHits > 0 ? 100 : 0);

    const avgReaction = this.reactionTimes.length > 0
      ? this.reactionTimes.reduce((a, b) => a + b, 0) / this.reactionTimes.length
      : 450;

    // Calculate stars: 1 to 3
    let stars: 0 | 1 | 2 | 3 = 1;
    if (accuracy >= 85 && live.smoothIndex >= 70) {
      stars = 3;
    } else if (accuracy >= 65 || totalHits >= Math.floor(targetCount * 0.7)) {
      stars = 2;
    }

    return {
      accuracy: Math.round(accuracy),
      averageReactionTimeMs: Math.round(avgReaction),
      jitterScore: live.jitterScore,
      smoothIndex: live.smoothIndex,
      missedClicks: this.missedClicksCount,
      overshootsCount: this.overshootsCount,
      totalAttempts,
      durationSeconds: Math.round(durationSeconds),
      difficultyFactor,
      stars,
    };
  }
}

export const tracker = new MotionTracker();
