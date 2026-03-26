/**
 * Rubric-based scoring engine for Preproom sessions.
 *
 * Each user message is evaluated across 5 dimensions. Scores accumulate
 * gradually — they don't jump unrealistically. The overall session score
 * is always derived from the weighted average of the dimension scores.
 *
 * Dimensions that haven't been observed yet are marked as "not assessed"
 * and excluded from the weighted average until triggered.
 */

export interface DimensionScore {
  /** Current score 0-100, or null if not yet assessed */
  score: number | null;
  /** Human-readable explanation for the latest update */
  explanation: string;
  /** History of score changes per exchange */
  history: { delta: number; explanation: string }[];
}

export interface DimensionScores {
  goal_clarity: DimensionScore;
  acknowledgment: DimensionScore;
  professionalism: DimensionScore;
  resolution_progress: DimensionScore;
  pushback_handling: DimensionScore;
}

export type DimensionId = keyof DimensionScores;

export const DIMENSION_WEIGHTS: Record<DimensionId, number> = {
  goal_clarity: 0.25,
  acknowledgment: 0.20,
  professionalism: 0.20,
  resolution_progress: 0.20,
  pushback_handling: 0.15,
};

export const DIMENSION_LABELS: Record<DimensionId, string> = {
  goal_clarity: "Goal Clarity",
  acknowledgment: "Acknowledgment",
  professionalism: "Professionalism",
  resolution_progress: "Resolution Progress",
  pushback_handling: "Pushback Handling",
};

export const DIMENSION_TOOLTIPS: Record<DimensionId, string> = {
  goal_clarity: "How clearly you stated what you want from this conversation.",
  acknowledgment: "How well you listened to and addressed the other person's concerns.",
  professionalism: "Whether you maintained a calm, respectful, professional tone.",
  resolution_progress: "Whether you proposed solutions, alternatives, or next steps.",
  pushback_handling: "How you responded when challenged — firm but not aggressive.",
};

export const ALL_DIMENSION_IDS: DimensionId[] = [
  "goal_clarity",
  "acknowledgment",
  "professionalism",
  "resolution_progress",
  "pushback_handling",
];

/** AI returns this per exchange */
export interface DimensionUpdate {
  score: number | null; // null = not assessed this round
  delta: number;
  explanation: string;
}

export type DimensionUpdates = Record<DimensionId, DimensionUpdate>;

export function createInitialDimensionScores(): DimensionScores {
  const make = (): DimensionScore => ({ score: null, explanation: "Not assessed yet", history: [] });
  return {
    goal_clarity: make(),
    acknowledgment: make(),
    professionalism: make(),
    resolution_progress: make(),
    pushback_handling: make(),
  };
}

/**
 * Apply a set of dimension updates to the current scores.
 * Returns the new dimension scores (immutable).
 */
export function applyDimensionUpdates(
  current: DimensionScores,
  updates: DimensionUpdates
): DimensionScores {
  const next = { ...current };

  for (const id of ALL_DIMENSION_IDS) {
    const update = updates[id];
    if (!update || update.score === null) {
      // Not assessed this round — keep previous
      next[id] = { ...current[id] };
      continue;
    }

    const prev = current[id];
    // If first assessment, set directly (clamped)
    const newScore = prev.score === null
      ? clamp(update.score, 0, 100)
      : clamp(prev.score + update.delta, 0, 100);

    next[id] = {
      score: newScore,
      explanation: update.explanation,
      history: [...prev.history, { delta: update.delta, explanation: update.explanation }],
    };
  }

  return next;
}

/**
 * Compute the overall session score from weighted dimension scores.
 * Only assessed dimensions are included in the average.
 * Returns 50 if nothing is assessed yet.
 */
export function computeOverallScore(dimensions: DimensionScores): number {
  let weightedSum = 0;
  let totalWeight = 0;

  for (const id of ALL_DIMENSION_IDS) {
    const dim = dimensions[id];
    if (dim.score !== null) {
      weightedSum += dim.score * DIMENSION_WEIGHTS[id];
      totalWeight += DIMENSION_WEIGHTS[id];
    }
  }

  if (totalWeight === 0) return 50; // base score before any assessment
  return Math.round(weightedSum / totalWeight);
}

/**
 * Build a human-readable breakdown of how the final score was calculated.
 */
export function buildScoreBreakdown(dimensions: DimensionScores): string {
  const parts: string[] = [];
  let totalWeight = 0;

  for (const id of ALL_DIMENSION_IDS) {
    const dim = dimensions[id];
    const weight = Math.round(DIMENSION_WEIGHTS[id] * 100);
    if (dim.score !== null) {
      parts.push(`${DIMENSION_LABELS[id]}: ${dim.score}/100 × ${weight}%`);
      totalWeight += DIMENSION_WEIGHTS[id];
    } else {
      parts.push(`${DIMENSION_LABELS[id]}: Not assessed`);
    }
  }

  const overall = computeOverallScore(dimensions);
  return `${parts.join(" · ")} → Overall: ${overall}/100`;
}

/**
 * Get the color for a dimension score.
 */
export function getDimensionColor(score: number | null): string {
  if (score === null) return "rgba(255,255,255,0.3)";
  if (score >= 70) return "#3DD68C";
  if (score >= 50) return "#F5A623";
  return "#F56565";
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

/**
 * Parse dimension updates from AI response JSON.
 * Expects: { "dimensions": { "goal_clarity": { "score": 60, "delta": 10, "explanation": "..." }, ... } }
 */
export function parseDimensionUpdates(scoreData: any): DimensionUpdates | null {
  if (!scoreData?.dimensions) return null;

  const updates: Partial<DimensionUpdates> = {};
  for (const id of ALL_DIMENSION_IDS) {
    const d = scoreData.dimensions[id];
    if (d) {
      updates[id] = {
        score: typeof d.score === "number" ? d.score : null,
        delta: typeof d.delta === "number" ? d.delta : 0,
        explanation: d.explanation || "",
      };
    } else {
      updates[id] = { score: null, delta: 0, explanation: "" };
    }
  }

  return updates as DimensionUpdates;
}
