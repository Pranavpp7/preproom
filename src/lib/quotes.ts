/**
 * Verify that debrief "verbatim" quotes actually appear in the user's transcript.
 */

export type QuoteStatus = "exact" | "corrected" | "removed";

export interface VerifiedQuote {
  quote: string | null;
  status: QuoteStatus;
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

  // Protect periods that are not sentence boundaries
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

function sentenceContainingNormalized(message: string, needleNorm: string): string | null {
  const sentences = splitSentences(message);
  for (const s of sentences) {
    if (normalize(s).includes(needleNorm)) return s.trim();
  }
  // Quote spans multiple sentences — return the full message
  if (normalize(message).includes(needleNorm)) return message.trim();
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

/**
 * Verify a model-produced quote against USER messages only.
 * - exact: normalized quote (or ellipsis fragments) found; returns the original sentence that contains it
 * - corrected: containment >= 0.75 on a user sentence (quote must have >= 4 words)
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
      const msgNorm = normalize(msg);
      if (!fragmentsInOrder(msgNorm, fragments)) continue;
      // Prefer the sentence that holds the first fragment
      const firstNorm = normalize(fragments[0]);
      const sentence = sentenceContainingNormalized(msg, firstNorm);
      if (sentence && fragmentsInOrder(normalize(sentence), fragments)) {
        return { quote: sentence, status: "exact" };
      }
      return { quote: msg.trim(), status: "exact" };
    }
  } else if (normQuote) {
    for (const msg of users) {
      if (!normalize(msg).includes(normQuote)) continue;
      const sentence = sentenceContainingNormalized(msg, normQuote);
      if (sentence) return { quote: sentence, status: "exact" };
    }
  }

  // --- Corrected (containment); short quotes that aren't exact are removed ---
  const quoteWords = tokenize(quote);
  if (quoteWords.length < 4) {
    return { quote: null, status: "removed" };
  }

  let best: { sentence: string; score: number } | null = null;
  for (const msg of users) {
    const sentences = splitSentences(msg);
    for (const sentence of sentences) {
      const score = wordContainment(quote, sentence);
      if (
        !best ||
        score > best.score ||
        (score === best.score && sentence.trim().length < best.sentence.length)
      ) {
        best = { sentence: sentence.trim(), score };
      }
    }
  }

  if (best && best.score >= 0.75) {
    return { quote: best.sentence, status: "corrected" };
  }

  return { quote: null, status: "removed" };
}
