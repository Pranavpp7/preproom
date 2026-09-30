import { describe, it, expect } from "vitest";
import {
  normalize,
  verifyQuote,
  splitSentences,
  wordContainment,
  trimToSentences,
  reconcileRounds,
  coerceRound,
  type PhaseHistoryEntry,
} from "./quotes";

describe("normalize", () => {
  it("lowercases, collapses whitespace, and ASCII-ifies curly quotes and dashes", () => {
    expect(normalize("  I’d like — “seventy”  ")).toBe("i'd like - seventy");
  });

  it("strips surrounding quotes and trailing punctuation", () => {
    expect(normalize('"Hello there."')).toBe("hello there");
  });
});

describe("splitSentences", () => {
  it("does not break on decimals; still splits after Q1. when a new sentence follows", () => {
    const parts = splitSentences("I want $78.5k in Q1. That is my ask.");
    expect(parts.length).toBe(2);
    expect(parts[0]).toContain("$78.5k");
    expect(parts[0]).toContain("Q1.");
    expect(parts[1]).toMatch(/That is my ask/i);
  });

  it("does not treat Q1. as a boundary mid-label", () => {
    const parts = splitSentences("Target is Q1.2025 bonus payout for the team.");
    expect(parts.length).toBe(1);
    expect(parts[0]).toContain("Q1.2025");
  });
});

describe("verifyQuote", () => {
  const userA =
    "Thanks for making time, Sarah. I'd like to discuss moving to $78,000 as I step into the mid-level role.";
  const userB =
    "I understand the band ceiling is a real constraint. Could we structure this as $71k now?";
  const users = [userA, userB];

  it("returns exact match using the original sentence casing", () => {
    const result = verifyQuote(
      "I'd like to discuss moving to $78,000 as I step into the mid-level role.",
      users
    );
    expect(result.status).toBe("exact");
    expect(result.quote).toBe(
      "I'd like to discuss moving to $78,000 as I step into the mid-level role."
    );
  });

  it("treats curly quotes and dash differences as exact", () => {
    const result = verifyQuote(
      "I’d like to discuss moving to $78,000 as I step into the mid-level role",
      users
    );
    expect(result.status).toBe("exact");
    expect(result.quote).toBe(
      "I'd like to discuss moving to $78,000 as I step into the mid-level role."
    );
  });

  it("matches ellipsis fragments in order within the same message", () => {
    const result = verifyQuote(
      "I'd like to discuss moving to $78,000...mid-level role.",
      users
    );
    expect(result.status).toBe("exact");
    expect(result.quote).toContain("$78,000");
    expect(result.quote).toContain("mid-level role");
  });

  it("corrects a paraphrase to the real user sentence via containment", () => {
    const result = verifyQuote(
      "I would like $78,000 as I step into the mid-level role",
      users
    );
    expect(result.status).toBe("corrected");
    expect(result.quote).toBe(
      "I'd like to discuss moving to $78,000 as I step into the mid-level role."
    );
  });

  it("removes an invented quote with no overlap", () => {
    const result = verifyQuote(
      "The quarterly bonus structure is completely unacceptable to me right now",
      users
    );
    expect(result.status).toBe("removed");
    expect(result.quote).toBeNull();
  });

  it("removes a quote that matches the AI's line but not the user's", () => {
    const aiLine =
      "I hear you — $78K is definitely above the current band ceiling, which caps at $71K for this level.";
    const result = verifyQuote(
      "above the current band ceiling, which caps at $71K for this level",
      users
    );
    expect(result.status).toBe("removed");
    expect(result.quote).toBeNull();

    const ifAiIncluded = verifyQuote(
      "above the current band ceiling, which caps at $71K for this level",
      [aiLine]
    );
    expect(ifAiIncluded.status).not.toBe("removed");
  });

  it("removes short non-exact quotes instead of correcting them", () => {
    const result = verifyQuote("I want more", users);
    expect(result.status).toBe("removed");
    expect(result.quote).toBeNull();
  });

  it("exact quote spanning 2 of 4 sentences returns just those 2", () => {
    const four =
      "Alpha one is first. Bravo two is second. Charlie three is third. Delta four is last.";
    const result = verifyQuote(
      "Bravo two is second. Charlie three is third.",
      [four]
    );
    expect(result.status).toBe("exact");
    expect(result.quote).toBe("Bravo two is second. Charlie three is third.");
    expect(result.quote).not.toContain("Alpha");
    expect(result.quote).not.toContain("Delta");
  });

  it("corrects a 2-sentence paraphrase to the real 2 sentences", () => {
    const msg =
      "I led the migration last quarter. That saved the company four hundred thousand dollars in cloud costs.";
    const result = verifyQuote(
      "I led last quarter's migration which saved four hundred thousand dollars in cloud costs",
      [msg]
    );
    expect(result.status).toBe("corrected");
    expect(result.quote).toBe(msg);
  });
});

describe("wordContainment", () => {
  it("scores share of quote words found in the sentence", () => {
    expect(wordContainment("want seventy eight", "I want seventy eight thousand")).toBe(1);
    expect(wordContainment("want bonus stock", "I want seventy")).toBeCloseTo(1 / 3);
  });
});

describe("trimToSentences", () => {
  it("keeps the first 1–2 sentences within a char cap", () => {
    const text = "First sentence here. Second one follows. Third should drop.";
    expect(trimToSentences(text, 2, 200)).toBe("First sentence here. Second one follows.");
  });
});

describe("coerceRound", () => {
  it("accepts numbers and numeric strings; rejects non-numeric", () => {
    expect(coerceRound(2)).toBe(2);
    expect(coerceRound("2")).toBe(2);
    expect(coerceRound(" 3 ")).toBe(3);
    expect(coerceRound("two")).toBeNull();
    expect(coerceRound(null)).toBeNull();
    expect(coerceRound(undefined)).toBeNull();
    expect(coerceRound(0)).toBeNull();
  });
});

describe("reconcileRounds", () => {
  const phase: PhaseHistoryEntry[] = [
    { phase: "Opening", scoreDelta: 5, summary: "Ask stated", userQuote: "I want seventy eight thousand." },
    { phase: "Negotiating", scoreDelta: 8, summary: "Compromise", userQuote: "Seventy one now with a written review." },
    { phase: "Negotiating", scoreDelta: -3, summary: "Pushback", userQuote: "Can we lock the review date today?" },
  ];
  const users = phase.map((p) => p.userQuote);

  function roundsOf(model: unknown) {
    return reconcileRounds(model, phase, users).rounds;
  }

  it("fills missing rounds from phaseHistory so there is one entry per exchange in order", () => {
    const rounds = roundsOf([
      { round: 2, scoreDelta: 99, summary: "Model summary for 2", userQuote: "Seventy one now with a written review.", verdict: "strong" },
    ]);
    expect(rounds.map((r) => r.round)).toEqual([1, 2, 3]);
    expect(rounds[0].userQuote).toContain("seventy eight");
    expect(rounds[1].summary).toBe("Model summary for 2");
    expect(rounds[1].scoreDelta).toBe(8); // real delta, not model's 99
    expect(rounds[2].userQuote).toContain("lock the review");
  });

  it("drops extra / OOB rounds and keeps only real exchanges", () => {
    const rounds = roundsOf([
      { round: 1, scoreDelta: 1, summary: "A", userQuote: "I want seventy eight thousand.", verdict: "neutral" },
      { round: 4, scoreDelta: 1, summary: "Ghost", userQuote: "invented", verdict: "weak" },
      { round: 99, scoreDelta: 1, summary: "Nope", userQuote: "nope", verdict: "weak" },
    ]);
    expect(rounds.map((r) => r.round)).toEqual([1, 2, 3]);
    expect(rounds.every((r) => !/Ghost|Nope|invented/i.test(r.summary + (r.userQuote || "")))).toBe(true);
  });

  it("keeps the first of duplicate round numbers", () => {
    const rounds = roundsOf([
      { round: 1, scoreDelta: 1, summary: "First copy", userQuote: "I want seventy eight thousand.", verdict: "strong" },
      { round: 1, scoreDelta: 1, summary: "Second copy", userQuote: "I want seventy eight thousand.", verdict: "weak" },
      { round: 2, scoreDelta: 1, summary: "Round two", userQuote: "Seventy one now with a written review.", verdict: "strong" },
    ]);
    expect(rounds.map((r) => r.round)).toEqual([1, 2, 3]);
    expect(rounds[0].summary).toBe("First copy");
  });

  it("sorts out-of-order rounds and uses phaseHistory scoreDelta", () => {
    const rounds = roundsOf([
      { round: 3, scoreDelta: 50, summary: "Third", userQuote: "Can we lock the review date today?", verdict: "neutral" },
      { round: 1, scoreDelta: 50, summary: "First", userQuote: "I want seventy eight thousand.", verdict: "strong" },
    ]);
    expect(rounds.map((r) => r.round)).toEqual([1, 2, 3]);
    expect(rounds.map((r) => r.scoreDelta)).toEqual([5, 8, -3]);
    expect(rounds[0].summary).toBe("First");
    expect(rounds[2].summary).toBe("Third");
  });

  it("treats missing or non-numeric round as droppable when phaseHistory exists", () => {
    const rounds = roundsOf([
      { round: "two", scoreDelta: 1, summary: "Bad", userQuote: "invented nonsense words here forever", verdict: "weak" },
      { scoreDelta: 1, summary: "Also bad", userQuote: "invented nonsense words here forever", verdict: "weak" },
      { round: "2", scoreDelta: 99, summary: "String two", userQuote: "Seventy one now with a written review.", verdict: "strong" },
    ]);
    expect(rounds.map((r) => r.round)).toEqual([1, 2, 3]);
    expect(rounds[1].summary).toBe("String two");
    expect(rounds[1].scoreDelta).toBe(8);
  });

  it("falls back to the correct exchange quote when model invents one", () => {
    const rounds = roundsOf([
      { round: 2, scoreDelta: 0, summary: "X", userQuote: "Totally fabricated bonus demand about stock options", verdict: "weak" },
    ]);
    expect(rounds[1].userQuote).toContain("Seventy one now");
    expect(rounds[1].userQuote).not.toMatch(/fabricated/i);
  });

  it("replaces a quote stolen from another round with that round's real message", () => {
    // Model labels round 3's sentence as round 2
    const rounds = roundsOf([
      { round: 2, scoreDelta: 0, summary: "Wrong attribution", userQuote: "Can we lock the review date today?", verdict: "neutral" },
    ]);
    expect(rounds[1].userQuote).toContain("Seventy one now");
    expect(rounds[1].userQuote).not.toContain("lock the review date");
    // Round 3 still gap-filled with its own message
    expect(rounds[2].userQuote).toContain("lock the review date");
  });

  it("when phaseHistory is empty, keeps model rounds in order and skips fallback", () => {
    const { rounds } = reconcileRounds(
      [
        { round: 2, scoreDelta: 3, summary: "B", userQuote: "hello there friend okay", verdict: "neutral" },
        { round: 1, scoreDelta: 1, summary: "A", userQuote: "hello there friend okay", verdict: "neutral" },
      ],
      [],
      ["hello there friend okay"]
    );
    expect(rounds).toHaveLength(2);
    expect(rounds[0].round).toBe(2);
    expect(rounds[1].round).toBe(1);
    expect(rounds[0].scoreDelta).toBe(3); // model delta kept when no phaseHistory
  });
});
