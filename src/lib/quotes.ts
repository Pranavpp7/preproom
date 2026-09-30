/**
 * Verify that debrief "verbatim" quotes actually appear in the user's transcript,
 * and reconcile model round breakdowns against real phaseHistory.
 */

export type QuoteStatus = "exact" | "corrected" | "removed";

export interface VerifiedQuote {
  quote: string | null;
  status: QuoteStatus;
}

export interface PhaseHistoryEntry {
  phase: string;
  scoreDelta: number;
  summary: string;
  userQuote: string;
}

export interface RoundBreakdownItem {
  round: number;
  scoreDelta: number;
  summary: string;
  userQuote?: string;
  verdict?: "strong" | "weak" | "neutral";
}

/** Lowercase, collapse whitespace, ASCII-ify quotes/dashes, trim outer quotes & trailing punctuation. */
export function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[\u2018\u2019\u201A\u201B]/g, "'")
    .replace(/[\u201C\u201D\u201E\u201F«»]/g, '"')
    .replace(/[\u2013\u2014\u2212]/g, "-")
    .replace(/"/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^['`]+|['`]+$/g, "")
    .replace(/[.,;:!?]+$/g, "")
    .trim();
}

function tokenize(text: string): string[] {
  // Drop apostrophes so "I'd" / "I’d" both become "id"
  const n = normalize(text).replace(/'/g, "");
  if (!n) return [];
  return n.split(/[^a-z0-9$%]+/).filter(Boolean);
}

/**
 * Split into sentences without breaking on decimals ("$78.5k") or mid-label periods like "Q1.2024".
 * A period after Q1 still ends a sentence when followed by whitespace and a capital letter.
 */
export function splitSentences(text: string): string[] {
  if (!text.trim()) return [];

  const protectedText = text
    .replace(/(\d)\.(\d)/g, "$1\u0000$2") // 78.5
    .replace(/\b([Qq]\d+)\.(?!\s+[A-Z])/g, "$1\u0000"); // Q1. mid-token, not "Q1. That"

  const parts = protectedText
    .split(/(?<=[.!?])\s+/)
    .map((p) => p.replace(/\u0000/g, ".").trim())
    .filter(Boolean);

  return parts.length > 0 ? parts : [text.trim()];
}

/** First 1–2 sentences, capped at maxChars. */
export function trimToSentences(text: string, maxSentences = 2, maxChars = 200): string {
  const sentences = splitSentences(text);
  let out = sentences.slice(0, maxSentences).join(" ").trim();
  if (out.length > maxChars) {
    out = out.slice(0, maxChars).replace(/\s+\S*$/, "").trim();
    if (!/[.!?]$/.test(out)) out += "…";
  }
  return out;
}

function ellipsisFragments(quote: string): string[] | null {
  if (!/[.]{3}|…/.test(quote)) return null;
  return quote
    .split(/[.]{3}|…/)
    .map((f) => f.trim())
    .filter(Boolean);
}

function fragmentsInOrder(haystackNorm: string, fragments: string[]): boolean {
  let from = 0;
  for (const frag of fragments) {
    const n = normalize(frag);
    if (!n) continue;
    const idx = haystackNorm.indexOf(n, from);
    if (idx === -1) return false;
    from = idx + n.length;
  }
  return true;
}

/**
 * Minimal consecutive original sentences whose joined normalized text covers needleNorm.
 */
function minimalSentenceSpan(message: string, needleNorm: string): string | null {
  const sentences = splitSentences(message);
  if (sentences.length === 0) return null;

  // Single-sentence hit
  for (const s of sentences) {
    if (normalize(s).includes(needleNorm)) return s.trim();
  }

  if (!normalize(message).includes(needleNorm)) return null;

  // Find shortest consecutive run that covers the needle
  let best: string | null = null;
  for (let i = 0; i < sentences.length; i++) {
    for (let j = i; j < sentences.length; j++) {
      const slice = sentences.slice(i, j + 1);
      const joined = slice.join(" ");
      if (normalize(joined).includes(needleNorm)) {
        const text = slice.map((s) => s.trim()).join(" ");
        if (!best || text.length < best.length) best = text;
        break; // longer j only grows; move to next i
      }
    }
  }
  return best;
}

/**
 * Minimal consecutive sentences covering ellipsis fragments in order.
 */
function minimalFragmentSpan(message: string, fragments: string[]): string | null {
  const sentences = splitSentences(message);
  if (sentences.length === 0) return null;

  for (let i = 0; i < sentences.length; i++) {
    for (let j = i; j < sentences.length; j++) {
      const slice = sentences.slice(i, j + 1);
      const joinedNorm = normalize(slice.join(" "));
      if (fragmentsInOrder(joinedNorm, fragments)) {
        return slice.map((s) => s.trim()).join(" ");
      }
    }
  }
  return null;
}

/**
 * Containment: share of the quote's words found in the candidate sentence.
 */
export function wordContainment(quote: string, sentence: string): number {
  const qWords = tokenize(quote);
  if (qWords.length === 0) return 0;
  const sSet = new Set(tokenize(sentence));
  let hit = 0;
  for (const w of qWords) {
    if (sSet.has(w)) hit += 1;
  }
  return hit / qWords.length;
}

function considerCandidate(
  best: { text: string; score: number } | null,
  text: string,
  score: number
): { text: string; score: number } {
  const t = text.trim();
  if (!best || score > best.score || (score === best.score && t.length < best.text.length)) {
    return { text: t, score };
  }
  return best;
}

/**
 * Verify a model-produced quote against USER messages only.
 * - exact: normalized quote (or ellipsis fragments) found; returns minimal original sentence span
 * - corrected: containment >= 0.75 on a 1- or 2-sentence window (quote must have >= 4 words)
 * - removed: nothing close enough
 */
export function verifyQuote(
  quote: string | null | undefined,
  userMessages: string[]
): VerifiedQuote {
  if (!quote || !quote.trim()) {
    return { quote: null, status: "removed" };
  }

  const users = userMessages.filter((m) => typeof m === "string" && m.trim());
  if (users.length === 0) {
    return { quote: null, status: "removed" };
  }

  const fragments = ellipsisFragments(quote);
  const normQuote = normalize(quote);

  // --- Exact ---
  if (fragments && fragments.length > 0) {
    for (const msg of users) {
      if (!fragmentsInOrder(normalize(msg), fragments)) continue;
      const span = minimalFragmentSpan(msg, fragments);
      if (span) return { quote: span, status: "exact" };
    }
  } else if (normQuote) {
    for (const msg of users) {
      if (!normalize(msg).includes(normQuote)) continue;
      const span = minimalSentenceSpan(msg, normQuote);
      if (span) return { quote: span, status: "exact" };
    }
  }

  // --- Corrected (containment on 1- and 2-sentence windows) ---
  const quoteWords = tokenize(quote);
  if (quoteWords.length < 4) {
    return { quote: null, status: "removed" };
  }

  let best: { text: string; score: number } | null = null;
  for (const msg of users) {
    const sentences = splitSentences(msg);
    for (let i = 0; i < sentences.length; i++) {
      best = considerCandidate(best, sentences[i], wordContainment(quote, sentences[i]));
      if (i + 1 < sentences.length) {
        const two = `${sentences[i].trim()} ${sentences[i + 1].trim()}`;
        best = considerCandidate(best, two, wordContainment(quote, two));
      }
    }
  }

  if (best && best.score >= 0.75) {
    return { quote: best.text, status: "corrected" };
  }

  return { quote: null, status: "removed" };
}

/** Coerce model round to a 1-based integer, or null if missing/non-numeric. */
export function coerceRound(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    const n = Math.trunc(value);
    return n >= 1 ? n : null;
  }
  if (typeof value === "string" && value.trim() !== "") {
    const n = Number(value.trim());
    if (Number.isFinite(n)) {
      const t = Math.trunc(n);
      return t >= 1 ? t : null;
    }
  }
  return null;
}

function verdictFromDelta(scoreDelta: number): "strong" | "weak" | "neutral" {
  if (scoreDelta >= 5) return "strong";
  if (scoreDelta <= -5) return "weak";
  return "neutral";
}

function fromPhase(ph: PhaseHistoryEntry, round: number): RoundBreakdownItem {
  return {
    round,
    scoreDelta: ph.scoreDelta,
    summary: ph.summary,
    userQuote: ph.userQuote,
    verdict: verdictFromDelta(ph.scoreDelta),
  };
}

export interface ReconcileRoundsResult {
  rounds: RoundBreakdownItem[];
  counts: Record<QuoteStatus, number>;
}

/**
 * Align model roundBreakdown with real phaseHistory.
 * - Coerce round numbers; drop missing/dupe/OOB when phaseHistory is present.
 * - Verify each quote against that round's message only (phaseHistory[round-1].userQuote);
 *   if not found there, fall back to that same message (trimmed).
 * - Fill gaps from phaseHistory; sort by round.
 * - Prefer real scoreDelta from phaseHistory; keep model summary/verdict.
 * - If phaseHistory is empty: keep model rounds in order, verify quotes against all userMessages.
 */
export function reconcileRounds(
  modelRounds: unknown,
  phaseHistory: PhaseHistoryEntry[],
  userMessages: string[]
): ReconcileRoundsResult {
  const counts: Record<QuoteStatus, number> = { exact: 0, corrected: 0, removed: 0 };
  const rawList = Array.isArray(modelRounds) ? modelRounds : [];

  // --- No phaseHistory: keep model order, verify quotes, no fallback/gap-fill ---
  if (phaseHistory.length === 0) {
    const rounds: RoundBreakdownItem[] = [];
    for (const raw of rawList) {
      if (!raw || typeof raw !== "object") continue;
      const r = raw as Record<string, unknown>;
      const round = coerceRound(r.round) ?? rounds.length + 1;
      const v = verifyQuote(typeof r.userQuote === "string" ? r.userQuote : "", userMessages);
      counts[v.status] += 1;
      rounds.push({
        round,
        scoreDelta: typeof r.scoreDelta === "number" ? r.scoreDelta : 0,
        summary: typeof r.summary === "string" ? r.summary : "",
        userQuote: v.quote ?? "",
        verdict:
          r.verdict === "strong" || r.verdict === "weak" || r.verdict === "neutral"
            ? r.verdict
            : "neutral",
      });
    }
    return { rounds, counts };
  }

  // --- With phaseHistory: match by round number ---
  const byRound = new Map<number, RoundBreakdownItem>();
  const seen = new Set<number>();

  for (const raw of rawList) {
    if (!raw || typeof raw !== "object") continue;
    const r = raw as Record<string, unknown>;
    const round = coerceRound(r.round);
    if (round === null || round > phaseHistory.length) continue;
    if (seen.has(round)) continue;
    seen.add(round);

    const ph = phaseHistory[round - 1];
    // Only accept quotes that appear in THIS exchange's message
    const v = verifyQuote(
      typeof r.userQuote === "string" ? r.userQuote : "",
      ph?.userQuote ? [ph.userQuote] : []
    );
    counts[v.status] += 1;

    let userQuote = v.quote ?? "";
    if (v.status === "removed") {
      userQuote = ph?.userQuote ? trimToSentences(ph.userQuote, 2, 200) : "";
    }

    byRound.set(round, {
      round,
      scoreDelta: ph.scoreDelta,
      summary: typeof r.summary === "string" ? r.summary : ph.summary,
      userQuote,
      verdict:
        r.verdict === "strong" || r.verdict === "weak" || r.verdict === "neutral"
          ? r.verdict
          : verdictFromDelta(ph.scoreDelta),
    });
  }

  // Gap-fill every real exchange
  for (let i = 0; i < phaseHistory.length; i++) {
    const round = i + 1;
    if (!byRound.has(round)) {
      byRound.set(round, fromPhase(phaseHistory[i], round));
    }
  }

  const rounds = [...byRound.values()].sort((a, b) => a.round - b.round);
  return { rounds, counts };
}
