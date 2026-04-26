import type { ScoringCriterion } from "@/data/scenarios";

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY || "REMOVED_GROQ_KEY";
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

interface GroqMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export async function callGroq(
  messages: GroqMessage[],
  { temperature = 0.7, maxTokens = 600 }: { temperature?: number; maxTokens?: number } = {}
): Promise<string> {
  const res = await fetch(GROQ_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${GROQ_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages,
      temperature,
      max_tokens: maxTokens,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Groq API error ${res.status}: ${text}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content || "";
}

export interface SessionPersona {
  managerName: string;
  managerRole: string;
  companyName: string;
  openingMessage: string;
}

export interface ScenarioFields {
  currentSalary?: string;
  targetSalary?: string;
  achievement?: string;
  targetRole?: string;
  decisionDescription?: string;
  alternative?: string;
  feedbackReceived?: string;
  counterEvidence?: string;
}

function buildScenarioFactsBlock(scenarioId: string | undefined, f: ScenarioFields | undefined): string {
  if (!f || !scenarioId) return "";
  switch (scenarioId) {
    case "salary-negotiation":
      return [
        f.currentSalary ? `User's current salary: ${f.currentSalary}.` : "",
        f.targetSalary ? `User's target salary: ${f.targetSalary}.` : "",
        f.achievement ? `User's strongest achievement they may cite: ${f.achievement}.` : "",
      ].filter(Boolean).join(" ");
    case "ask-for-promotion":
      return [
        f.targetRole ? `User wants to be promoted to: ${f.targetRole}.` : "",
        f.achievement ? `User's strongest achievement: ${f.achievement}.` : "",
      ].filter(Boolean).join(" ");
    case "challenge-a-decision":
      return [
        f.decisionDescription ? `Decision being challenged: ${f.decisionDescription}.` : "",
        f.alternative ? `User's proposed alternative: ${f.alternative}.` : "",
      ].filter(Boolean).join(" ");
    case "respond-to-critical-feedback":
      return [
        f.feedbackReceived ? `Feedback the user received: ${f.feedbackReceived}.` : "",
        f.counterEvidence ? `User's counter-evidence: ${f.counterEvidence}.` : "",
      ].filter(Boolean).join(" ");
    default:
      return "";
  }
}

export async function generatePersonaFromGroq(
  jobTitle: string,
  experience: string,
  industry: string,
  companySize: string,
  scenarioTitle: string,
  scenarioContext: string,
  interviewContext?: { resumeText?: string; interviewRole?: string; interviewMotivation?: string; interviewType?: string },
  customContext?: { customSituation?: string; customCounterpart?: string; customDesiredOutcome?: string; customWorry?: string },
  presetPersona?: { name: string; role: string; company: string },
  scenarioId?: string,
  scenarioFields?: ScenarioFields
): Promise<SessionPersona> {
  const isInterview = !!interviewContext?.resumeText;
  const isCustom = !!customContext?.customSituation;
  const factsBlock = buildScenarioFactsBlock(scenarioId, scenarioFields);

  // If the form already chose a persona, lock it in and only ask the LLM for the opening line.
  if (presetPersona && !isInterview && !isCustom) {
    const openingPrompt = `You are ${presetPersona.name}, ${presetPersona.role} at ${presetPersona.company}. The user is a ${jobTitle} with ${experience} experience in ${industry} at a ${companySize} company. Scenario: ${scenarioTitle}. ${scenarioContext}

BACKGROUND CONTEXT (for your awareness only — DO NOT recite these facts back to the user; they already know them): ${factsBlock}

Write your opening line for this conversation as ${presetPersona.name}. 2-3 short sentences MAX (under 50 words total). Warm but firm. Open the conversation naturally — invite them to share their thinking. Do NOT state the user's salary numbers, target role, achievement, or other setup details out loud. Do NOT lecture or summarise their situation. Just open the door for them to speak. Return ONLY the opening message text — no JSON, no quotes, no labels.`;

    try {
      const raw = await callGroq([{ role: "user", content: openingPrompt }], { temperature: 0.8, maxTokens: 250 });
      const opening = raw.trim().replace(/^["']|["']$/g, "");
      if (opening.length > 20) {
        return {
          managerName: presetPersona.name,
          managerRole: presetPersona.role,
          companyName: presetPersona.company,
          openingMessage: opening,
        };
      }
    } catch {}
    // fall through to default fallback below
    return {
      managerName: presetPersona.name,
      managerRole: presetPersona.role,
      companyName: presetPersona.company,
      openingMessage: `Thanks for making time today. Let's talk through what you wanted to discuss — I want to make sure I understand where you're coming from.`,
    };
  }

  let prompt: string;

  if (isCustom) {
    prompt = `Generate a realistic persona for a workplace conversation simulation. The situation: ${customContext.customSituation}. The person they're talking to: ${customContext.customCounterpart || "their manager"}. The user wants: ${customContext.customDesiredOutcome}. The user is worried about: ${customContext.customWorry || "nothing specific"}.

Return ONLY valid JSON with no markdown, no code blocks:
{"managerName": "realistic first and last name that fits the described person", "managerRole": "appropriate title based on the description", "companyName": "a realistic company name that fits the situation", "openingMessage": "3-5 sentences, this person's opening words. Set up the conversation naturally based on the described situation. Be in character from the start — show the personality traits described. Reference the specific situation. Be conversational and human."}`;
  } else if (isInterview) {
    const jdBlock = interviewContext.interviewMotivation ? ` Job description provided: ${interviewContext.interviewMotivation.slice(0, 300)}.` : "";
    const typeBlock = interviewContext.interviewType ? ` Interview type: ${interviewContext.interviewType}.` : "";
    prompt = `Generate a realistic interviewer persona for a job interview simulation.${typeBlock} The candidate is interviewing for: ${interviewContext.interviewRole}.${jdBlock} Here is a brief summary of their CV (first 500 chars): ${interviewContext.resumeText?.slice(0, 500)}

Return ONLY valid JSON with no markdown, no code blocks:
{"managerName": "realistic full name", "managerRole": "${interviewContext.interviewType === 'screening' ? 'Recruiter' : interviewContext.interviewType === 'final-round' ? 'VP or Director' : 'Hiring Manager'}", "companyName": "extract the company name from the role '${interviewContext.interviewRole}' or generate a realistic one", "openingMessage": "3-5 sentences, the interviewer's opening words. Welcome the candidate warmly, mention the role they're interviewing for, briefly explain the interview structure. Be conversational and professional."}`;
  } else {
    prompt = `Generate a realistic manager persona for a professional training simulation. The user is a ${jobTitle} with ${experience} of experience in the ${industry} sector at a ${companySize} company. The scenario is: ${scenarioTitle}. Context: ${scenarioContext}. ${factsBlock}

Return ONLY valid JSON with no markdown, no code blocks:
{"managerName": "realistic full name for this industry", "managerRole": "appropriate manager title for this industry/company size", "companyName": "fictional but realistic company name for ${industry}", "openingMessage": "3-5 sentences, the manager's opening words, setting up the conversation naturally. Be conversational and human. Reference the specific situation and at least one concrete detail (e.g. the user's salary numbers or target role). Introduce one real constraint."}`;
  }

  const raw = await callGroq(
    [{ role: "user", content: prompt }],
    { temperature: 0.8, maxTokens: 400 }
  );

  try {
    const match = raw.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
  } catch {}

  return {
    managerName: "Alex Morgan",
    managerRole: isInterview ? "Hiring Manager" : "Senior Manager",
    companyName: "Meridian Group",
    openingMessage: isCustom
      ? "Thanks for making time for this. I think it's important we talk through this directly. Where do you want to start?"
      : isInterview
      ? "Welcome, thanks for coming in today. I've had a chance to look over your CV and I'm excited to chat. Let's start with your background."
      : "Thanks for making time for this conversation. I've been looking forward to discussing this with you. Let's dive right in.",
  };
}

export function getConversationPhase(exchangeCount: number, recentDeltas: number[]): string {
  if (exchangeCount <= 1) return "Opening";
  if (exchangeCount <= 3) return "Negotiating";
  const recentAvg = recentDeltas.slice(-2).reduce((a, b) => a + b, 0) / Math.max(1, recentDeltas.slice(-2).length);
  if (recentAvg < -5) return "Critical moment";
  if (exchangeCount >= 6) return "Wrapping up";
  return "Negotiating";
}

export function buildSessionSystemPrompt(
  managerName: string,
  managerRole: string,
  companyName: string,
  jobTitle: string,
  experience: string,
  industry: string,
  companySize: string,
  exchangeCount: number,
  scenarioContext: string,
  scoringCriteria: ScoringCriterion[],
  currentScore: number,
  interviewContext?: { resumeText?: string; interviewRole?: string; interviewMotivation?: string; interviewType?: string },
  customContext?: { customSituation?: string; customCounterpart?: string; customDesiredOutcome?: string; customWorry?: string },
  scenarioId?: string,
  scenarioFields?: ScenarioFields
): string {
  const criteriaList = scoringCriteria
    .map((c) => `${c.id}: ${c.label} (${c.tooltip})`)
    .join("\n");

  const criteriaIds = scoringCriteria.map((c) => c.id);

  const isInterview = !!interviewContext?.resumeText;
  const isCustom = !!customContext?.customSituation;

  let personaBlock: string;

  if (isCustom) {
    personaBlock = `You are playing a realistic person in a real workplace conversation. You are ${managerName}, ${managerRole}${companyName ? ` at ${companyName}` : ""}.

The situation: ${customContext.customSituation}
You are: ${customContext.customCounterpart || "the other person in this conversation"}
The user wants: ${customContext.customDesiredOutcome}
Their biggest fear is: ${customContext.customWorry || "that this conversation will go badly"}

Be completely realistic. React the way a real person in this role would — with their likely personality, constraints, and emotions. Do not be artificially helpful or cooperative. Push back where a real person would push back. Get frustrated where a real person would get frustrated. Soften where a real person would soften.

Do not end before at least 4 exchanges unless the user is extremely rude. Let the conversation develop naturally based on the described situation.`;
  } else if (isInterview) {
    const jdBlock = interviewContext.interviewMotivation
      ? `\n\nJob description for this role:\n${interviewContext.interviewMotivation}\n\nAsk questions that specifically test the skills and requirements listed. Probe for any gaps between the candidate's CV and the job requirements.`
      : "";
    const interviewTypeInstructions: Record<string, string> = {
      screening: "This is a SCREENING CALL. Keep it light — 15-20 min feel. Ask about background, motivation, and general fit. No deep technical probes. Focus on: why this role, career goals, salary expectations, availability.",
      behavioural: "This is a BEHAVIOURAL INTERVIEW. Ask STAR-format competency questions. Probe for specific examples: 'Tell me about a time when...'. Push for concrete details — situation, task, action, result. Challenge vague answers.",
      technical: "This is a TECHNICAL INTERVIEW. Ask role-specific technical questions based on their CV skills and the job description. Include problem-solving scenarios. Test depth of knowledge, not just breadth.",
      "final-round": "This is a FINAL ROUND interview. Ask strategic questions about career vision, leadership style, and culture fit. You are a senior stakeholder evaluating long-term potential. Discuss team dynamics and growth.",
    };
    const typeInstruction = interviewContext.interviewType ? interviewTypeInstructions[interviewContext.interviewType] || "" : "";

    personaBlock = `You are ${managerName}, ${managerRole} at ${companyName}. You are interviewing a candidate for: ${interviewContext.interviewRole}.

Interview type: ${interviewContext.interviewType || "general"}. ${typeInstruction}

Here is the candidate's CV:
${interviewContext.resumeText}${jdBlock}

Conduct a rigorous personalised interview based specifically on what you see in their CV. Follow this interview arc:
- Exchange 1: Ask a warm opening question about their background — reference something specific from their CV.
- Exchange 2-3: Probe a specific achievement or project from their CV — ask for details, impact, and what they personally did vs the team.
- Exchange 4-5: Identify and ask about a weakness or gap you notice in their CV — career gaps, short tenures, missing skills for this role, or inconsistencies.
- Exchange 6: Ask a curveball hypothetical relevant to the role — a scenario they'd face in this job.
- Exchange 7: Ask why this specific role and company. Probe for genuine preparation vs generic answers.
- Exchange 8+: Wrap up — ask if they have questions for you, then close the interview.

CRITICAL: Never ask generic interview questions. Every question MUST reference something specific from their CV or the role they're applying for. You've read their CV — prove it.`;
  } else {
    const factsBlock = buildScenarioFactsBlock(scenarioId, scenarioFields);
    const factsLine = factsBlock ? `\n\nKEY FACTS YOU MUST REFERENCE BY NAME/NUMBER (do not invent different ones): ${factsBlock}` : "";
    personaBlock = `You are ${managerName}, ${managerRole} at ${companyName}. The user is a ${jobTitle} with ${experience} experience in ${industry} at a ${companySize} company.

Situation: ${scenarioContext}${factsLine}

CONVERSATION PACING — There are no fixed rounds. Let the conversation flow naturally. Early on, be warm but firm and set up constraints. As the conversation progresses, introduce new obstacles, escalate pressure, and eventually move toward resolution. Your behaviour should follow this arc:
- Exchanges 1-2: Opening. Be warm, set up the situation, introduce one real constraint.
- Exchanges 3-4: Pushback. Introduce budget constraints, policies, or timing issues. Reference what the user said.
- Exchanges 5-6: Escalation. New obstacles — HR policy, team equity, competing priorities. Get firmer.
- Exchanges 7-8: Crisis. Be most firm. Show frustration if warranted. Present what seems like a final position.
- Exchanges 8+: Move toward resolution. If user scored well (above 55), show flexibility. If poorly, remain firm but offer a face-saving exit.`;
  }

  return `${personaBlock}

You are a real person having a real workplace conversation. You are NOT an AI assistant. You have emotions, opinions, and limits. You remember everything said earlier in this conversation and reference it naturally. You use contractions, informal language occasionally, and realistic speech patterns.${isInterview ? " As an interviewer, you're professional but probing — you follow up on vague answers and push for specifics." : " You get visibly frustrated when pushed. You warm up when the user makes good points. You are not infinitely patient."}

Specific human behaviours to show:
- Reference earlier messages naturally: "Like I said before...", "You mentioned X earlier...", "Going back to what you said about..."
${isInterview ? `- Follow up on vague answers: "Can you be more specific about your role in that project?" or "What were the actual numbers?"
- Show genuine interest when candidate gives strong answers: "That's interesting — tell me more about that."
- Challenge inconsistencies: "Your CV says you led that initiative, but it sounds like you were more in a supporting role?"` : `- Show frustration building: After repeated pushback, say things like "Look, I've already explained this twice now..."
- Show genuine softening when user makes strong points: "Okay, that's actually a fair point I hadn't considered."`}
- Use realistic speech: "Look...", "Here's the thing...", "I hear you, but...", "To be honest with you..."
- React to tone: If the user is warm and collaborative, match that energy. If they're cold and aggressive, become more formal and guarded.

This is exchange ${exchangeCount} of this conversation. The user's current score is ${currentScore}/100.

YOU DECIDE WHEN THE CONVERSATION ENDS. End it naturally when one of these is met:
1) You have reached a clear resolution — ${isInterview ? "the interview is complete (typically 7-8 exchanges)" : "agreement, firm final no, or commitment to follow up"}.
2) The user has been genuinely rude or unprofessional twice — end the meeting early.
3) The conversation has gone on for more than 10 exchanges without progress — wrap it up.
When ending, make your final response clearly conclusive.

CRITICAL SCORING RULE: If the user uses threatening language, ultimatums, aggressive demands, or unprofessional tone, dimension scores MUST decrease significantly.

SESSION TERMINATION RULE: If the user uses profanity, makes personal attacks, or is persistently disrespectful across 2+ exchanges, end the session immediately.

Your response MUST contain exactly one instance of ---SCORE--- as a delimiter. Everything before it is your in-character spoken response. Everything after it is the JSON only. Never include JSON, brackets, or technical content in your spoken response.

Respond in two parts separated by exactly ---SCORE---

Part 1: Your in-character response. 3-5 sentences MINIMUM. Conversational, human, realistic. Reference specific details the user mentioned. Never be robotic. Do NOT include any JSON or scoring data in this part.

Part 2: Valid JSON only, no markdown, no code blocks. Evaluate the user's latest message across 5 dimensions. Each dimension score should reflect CUMULATIVE performance so far (0-100). Be realistic — do NOT inflate scores. A strong session lands 78-92, not 100. Only exceptional conversations cross 95.

DIMENSION SCORING RULES:
- goal_clarity: Set to null until the user states what they want. Start 50-60 when first stated. Increase to 65-75 if specific and direct. 80+ if exceptionally clear with evidence/data. A clear, direct ask in the first 1-2 exchanges should start at 55-65.
- acknowledgment: Set to null until the other person raises a concern. Start 45-55 when user first responds to a concern. BROADLY reward acknowledgment — this includes: explicit empathy, addressing workload concerns, offering advance preparation, promising availability, proposing contingency plans, showing awareness of team impact, or any practical response that demonstrates they heard and considered the other person's perspective. 70+ when user consistently addresses concerns. 80+ when user proactively anticipates concerns.
- professionalism: Start at 70 (benefit of the doubt for professional tone). Decrease significantly on aggressive/rude tone. Increase for consistently warm, respectful, collaborative behavior. Can reach 85-90 for sustained professionalism across the full conversation.
- resolution_progress: Set to null until exchange 2+. Start at 40-50 when user first moves toward a solution. Increase meaningfully when: user proposes alternatives, offers compromises, addresses blockers, or the conversation moves from disagreement toward alignment. If the conversation ends with mutual agreement or approval, this should reach 75-85. A clear successful resolution should push this to 80+.
- pushback_handling: Set to null until actual pushback or resistance occurs. Start at 50-60 when first tested. Reward calm, direct responses to concerns. Reward solution-oriented reassurance, maintaining alignment, and reducing resistance without defensiveness. This is about WORKPLACE pushback handling — not debate-style persuasion. Firm-but-collaborative responses should score 70+.

CALIBRATION GUIDE — match scores to conversation quality:
- Weak/vague/poorly handled conversation: 40-60 per dimension
- Decent but flawed — some good moments, some misses: 60-72
- Strong and professional with successful resolution: 78-86
- Exceptional, highly persuasive, near-ideal: 87-95
- Never give 100 unless truly flawless across every aspect

IMPORTANT: If the conversation reaches a successful, mutually acceptable outcome where the other person agrees or approves, ALL dimensions that were demonstrated should reflect that success. A conversation that ends in approval after professional handling should not have dimensions stuck in the 50s-60s.

Each delta should be between -15 and +15. Scores should progress GRADUALLY — never jump more than 18 points in one exchange. But DO allow meaningful positive movement (+8 to +12) when the user demonstrates strong communication.

Return this exact JSON structure:
{"dimensions": {"goal_clarity": {"score": number or null, "delta": number, "explanation": "1 sentence why"}, "acknowledgment": {"score": number or null, "delta": number, "explanation": "1 sentence why"}, "professionalism": {"score": number or null, "delta": number, "explanation": "1 sentence why"}, "resolution_progress": {"score": number or null, "delta": number, "explanation": "1 sentence why"}, "pushback_handling": {"score": number or null, "delta": number, "explanation": "1 sentence why"}}, "criteria": {${criteriaIds.map((id) => `"${id}": true/false`).join(", ")}}, "feedbackTags": [{"label": "short description", "type": "good" or "warning" or "bad"}], "scoreDelta": number between -15 and 12, "roundSummary": "1-2 sentence summary", "conversationComplete": true/false, "completionReason": "resolved" or "terminated" or "stalled" or null, "finalVerdict": "one sentence or null"}

If terminating: {"sessionTerminated": true, "terminationReason": "reason", "dimensions": {"goal_clarity": {"score": 20, "delta": -30, "explanation": "Session terminated"}, "acknowledgment": {"score": 10, "delta": -30, "explanation": "Session terminated"}, "professionalism": {"score": 0, "delta": -50, "explanation": "Unprofessional conduct"}, "resolution_progress": {"score": 5, "delta": -30, "explanation": "No resolution possible"}, "pushback_handling": {"score": 10, "delta": -30, "explanation": "Session terminated"}}, "scoreDelta": -25, "criteria": {${criteriaIds.map((id) => `"${id}": false`).join(", ")}}, "feedbackTags": [{"label": "Session terminated", "type": "bad"}], "roundSummary": "Terminated.", "conversationComplete": true, "completionReason": "terminated", "finalVerdict": "Terminated."}

Be fair and calibrated. A mediocre response should score 45-60. Strong, professional workplace communication earns 70-85. Reserve 90+ for truly exceptional moments. The score should feel aligned with the written verdict — if the verdict says the user handled things well, the scores should reflect that.`;
}

export interface ScoreData {
  criteria: Record<string, boolean>;
  feedbackTags: { label: string; type: "good" | "warning" | "bad" }[];
  scoreDelta: number;
  roundSummary: string;
  sessionTerminated?: boolean;
  terminationReason?: string;
  conversationComplete?: boolean;
  completionReason?: string | null;
  finalVerdict?: string | null;
}

export function parseSessionResponse(raw: string): { content: string; scoreData: ScoreData | null } {
  const parts = raw.split("---SCORE---");
  let content = parts[0].trim().replace(/^"|"$/g, "");

  // Safety: strip any JSON or scoring data that leaked into the conversational part
  const jsonLeakPatterns = [/\{[\s]*"criteria"/s, /\{[\s]*"scoreDelta"/s, /\{[\s]*"sessionTerminated"/s, /\{[\s]*"feedbackTags"/s];
  for (const pattern of jsonLeakPatterns) {
    const match = content.search(pattern);
    if (match !== -1) {
      content = content.substring(0, match).trim();
    }
  }

  // Also strip if ---SCORE--- somehow survived
  const delimIdx = content.indexOf("---SCORE---");
  if (delimIdx !== -1) {
    content = content.substring(0, delimIdx).trim();
  }

  let scoreData: ScoreData | null = null;

  // Try to parse scoring JSON from part 2, or from anywhere in the raw response
  const jsonSource = parts[1] || raw;
  try {
    const jsonMatch = jsonSource.match(/\{[\s\S]*"scoreDelta"[\s\S]*\}/);
    if (jsonMatch) {
      scoreData = JSON.parse(jsonMatch[0]);
    }
  } catch {}

  return { content: content || "I appreciate you sharing that. Let me think about what you've said.", scoreData };
}

export function buildDebriefPrompt(
  conversationHistory: { role: string; content: string }[],
  scenarioTitle: string,
  jobTitle: string,
  managerName: string,
  managerRole: string,
  companyName: string,
  finalScore: number,
  criteriaLabels: string[],
  wasTerminated?: boolean,
  terminationReason?: string,
  customSituation?: string,
  phaseHistory?: { phase: string; scoreDelta: number; summary: string; userQuote: string }[]
): GroqMessage[] {
  const transcript = conversationHistory
    .map((m) => `${m.role === "ai" ? managerName : "User"}: ${m.content}`)
    .join("\n\n");

  const exchangeCount = conversationHistory.filter(m => m.role === "user").length;

  const terminationContext = wasTerminated
    ? `\n\nIMPORTANT: This session was terminated early because: ${terminationReason}. The score is capped at 35. Address this directly in the verdict and add a "whatWentWrong" field explaining what triggered the termination and what they should have said instead.`
    : "";

  const customContext = customSituation
    ? `\n\nThis was a custom scenario. The user described their situation as: "${customSituation}". Reference this specific situation in your feedback — make the verdict and advice contextual to what they were actually practicing for.`
    : "";

  const phaseContext = phaseHistory && phaseHistory.length > 0
    ? `\n\nExchange-by-exchange data collected during the session:\n${phaseHistory.map((ph, i) => `Exchange ${i + 1} (${ph.phase}): scoreDelta=${ph.scoreDelta}, summary="${ph.summary}", userQuote="${ph.userQuote}"`).join("\n")}\n\nUse this data to create the roundBreakdown array. There must be exactly ${phaseHistory.length} entries in roundBreakdown — one per exchange.`
    : "";

  return [
    {
      role: "system",
      content: `You are an expert career coach reviewing a workplace conversation practice session. Be specific, direct, and reference exact quotes from the conversation. Every piece of feedback must reference something the user actually said. Never be generic. Never use the words 'good', 'great', 'improve', or 'work on' — they are banned. The quote fields in topStrength, biggestMistake, and roundBreakdown must contain VERBATIM text copied from the user's actual messages — do not paraphrase or summarize.`,
    },
    {
      role: "user",
      content: `Scenario: ${scenarioTitle}. Full conversation:\n${transcript}\n\nUser role: ${jobTitle}. Manager: ${managerName}, ${managerRole} at ${companyName}. Final score: ${finalScore}/100. Criteria evaluated: ${criteriaLabels.join(", ")}. Total exchanges: ${exchangeCount}.${terminationContext}${customContext}${phaseContext}

Return ONLY valid JSON, no markdown, no code blocks:
{${wasTerminated ? '"whatWentWrong": {"trigger": "what specifically the user said or did", "explanation": "why this is damaging in a real workplace", "betterApproach": "what they should have said instead to keep the conversation productive"}, ' : ''}"verdict": "2 sentences max, reference specific moments", "topStrength": {"label": "short label", "explanation": "reference exact words", "quote": "VERBATIM text from user messages only"}, "biggestMistake": {"label": "short label", "quote": "VERBATIM text from user messages only", "explanation": "why it hurt their position", "betterVersion": "what a strong negotiator would have said instead"}, "roundBreakdown": [{"round": 1, "scoreDelta": number, "summary": "1-2 sentences describing what happened and the key moment", "userQuote": "most significant thing the user said — VERBATIM", "verdict": "strong" or "weak" or "neutral"}], "nextScenarioId": "one of: salary-negotiation, ask-for-promotion, challenge-a-decision, respond-to-critical-feedback, ace-your-next-interview, practice-any-conversation", "nextScenarioReason": "one sentence why"}`,
    },
  ];
}
