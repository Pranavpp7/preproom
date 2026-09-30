import { describe, it, expect } from "vitest";
import {
  normalize,
  verifyQuote,
  splitSentences,
  wordContainment,
  trimToSentences,
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
    // Original transcript uses a straight apostrophe
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
      "I'd like $78,000 for the mid-level role as I step into it",
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
    // Only user messages are passed (as the call site must do)
    const result = verifyQuote(
      "above the current band ceiling, which caps at $71K for this level",
      users
    );
    expect(result.status).toBe("removed");
    expect(result.quote).toBeNull();

    // Sanity: the same string WOULD match if AI text were wrongly treated as user
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
