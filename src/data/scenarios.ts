export interface Scenario {
  id: string;
  title: string;
  emoji: string;
  difficulty: "Beginner" | "Medium" | "Hard";
  duration: string;
  category: string;
  categoryColor: string;
  context: string;
  description: string;
  completions: number;
  locked: boolean;
  persona: {
    name: string;
    role: string;
    company: string;
    initials: string;
  };
  criteria: string[];
}

export const scenarios: Scenario[] = [
  {
    id: "salary-negotiation",
    title: "Salary Negotiation",
    emoji: "🤝",
    difficulty: "Hard",
    duration: "15 min",
    category: "Negotiation",
    categoryColor: "#7C6FF7",
    context: "You're a Junior Data Analyst at Meridian Analytics earning $62k. You've just been told you're being promoted to Mid-level. You want $78k. Your manager Sarah Chen says the band tops out at $71k.",
    description: "Your manager is reasonable but constrained. Use market data, cite your impact, and don't let a budget ceiling end the conversation.",
    completions: 14200,
    locked: false,
    persona: { name: "Sarah Chen", role: "Engineering Manager", company: "Meridian Analytics", initials: "SC" },
    criteria: ["Anchoring", "Market Evidence", "No Hedging", "Composure", "Held Position"],
  },
  {
    id: "ask-for-promotion",
    title: "Ask for a Promotion",
    emoji: "⬆️",
    difficulty: "Medium",
    duration: "12 min",
    category: "Negotiation",
    categoryColor: "#7C6FF7",
    context: "You're a Marketing Coordinator at Vantage Group, 22 months in. You've been hinting at a promotion for 6 months. Your manager James Rivera keeps saying 'soon.' You want a concrete timeline.",
    description: "James likes you but avoids commitment. Turn a vague conversation into a written agreement with a date.",
    completions: 9870,
    locked: false,
    persona: { name: "James Rivera", role: "Marketing Director", company: "Vantage Group", initials: "JR" },
    criteria: ["Directness", "Specificity", "Evidence", "Composure", "Got Commitment"],
  },
  {
    id: "disagree-with-manager",
    title: "Disagree with Your Manager",
    emoji: "💬",
    difficulty: "Medium",
    duration: "12 min",
    category: "Difficult Conversations",
    categoryColor: "#F56565",
    context: "You're a Business Analyst at Crestline Partners. Your manager David Park just decided to cut the user research phase of a major project to save 2 weeks. You believe this will cause problems at launch.",
    description: "David is confident in his call. Push back with logic and alternatives — without sounding like you're undermining him.",
    completions: 7340,
    locked: false,
    persona: { name: "David Park", role: "Senior PM", company: "Crestline Partners", initials: "DP" },
    criteria: ["Respectful Framing", "Alternatives Offered", "Evidence", "Composure", "Held Position"],
  },
  {
    id: "bad-performance-review",
    title: "Handle a Bad Performance Review",
    emoji: "📊",
    difficulty: "Medium",
    duration: "12 min",
    category: "Difficult Conversations",
    categoryColor: "#F56565",
    context: "You're a Junior Account Manager at Beacon Digital. Your manager Lisa Tran has rated you 'meets expectations' — the second-lowest rating. You believe you delivered strong results on two major clients and deserve 'exceeds expectations.'",
    description: "Lisa isn't hostile — she's just going by incomplete information. Make your case calmly and specifically.",
    completions: 11500,
    locked: false,
    persona: { name: "Lisa Tran", role: "Account Director", company: "Beacon Digital", initials: "LT" },
    criteria: ["Specific Evidence", "Calm Tone", "No Defensiveness", "Composure", "Reframed Narrative"],
  },
  {
    id: "job-interview",
    title: "Nail the Job Interview",
    emoji: "💼",
    difficulty: "Beginner",
    duration: "20 min",
    category: "Interviews",
    categoryColor: "#38BDF8",
    context: "You're interviewing for a Senior Associate role at Vertex Consulting. The interviewer is Rachel Moore, Principal. She's reviewing your CV and notices you moved jobs twice in 2 years and have a 4-month gap.",
    description: "Behavioral questions, career gap probing, salary expectations. Rachel is thorough and doesn't let vague answers slide.",
    completions: 19800,
    locked: false,
    persona: { name: "Rachel Moore", role: "Principal", company: "Vertex Consulting", initials: "RM" },
    criteria: ["Self-Awareness", "Specificity", "Confidence", "Composure", "Addressed Concerns"],
  },
  // Locked scenarios
  { id: "vendor-contract", title: "Vendor Contract Negotiation", emoji: "📝", difficulty: "Hard", duration: "15 min", category: "Negotiation", categoryColor: "#7C6FF7", context: "", description: "Negotiate better terms with a key vendor threatening to raise prices.", completions: 0, locked: true, persona: { name: "", role: "", company: "", initials: "" }, criteria: [] },
  { id: "deadline-extension", title: "Negotiate a Deadline Extension", emoji: "⏰", difficulty: "Medium", duration: "12 min", category: "Negotiation", categoryColor: "#7C6FF7", context: "", description: "Your team can't hit the deadline. Convince stakeholders without losing trust.", completions: 0, locked: true, persona: { name: "", role: "", company: "", initials: "" }, criteria: [] },
  { id: "project-budget", title: "Fight for Project Budget", emoji: "💰", difficulty: "Hard", duration: "15 min", category: "Negotiation", categoryColor: "#7C6FF7", context: "", description: "Finance wants to cut your project budget by 30%. Make the case to keep it.", completions: 0, locked: true, persona: { name: "", role: "", company: "", initials: "" }, criteria: [] },
  { id: "hard-review", title: "Deliver a Hard Performance Review", emoji: "📋", difficulty: "Hard", duration: "15 min", category: "Leadership", categoryColor: "#F5A623", context: "", description: "Give honest, constructive feedback to an underperforming team member.", completions: 0, locked: true, persona: { name: "", role: "", company: "", initials: "" }, criteria: [] },
  { id: "let-someone-go", title: "Let Someone Go with Dignity", emoji: "🚪", difficulty: "Hard", duration: "15 min", category: "Leadership", categoryColor: "#F5A623", context: "", description: "Handle a termination conversation with empathy and professionalism.", completions: 0, locked: true, persona: { name: "", role: "", company: "", initials: "" }, criteria: [] },
  { id: "team-conflict", title: "Resolve Team Conflict", emoji: "⚖️", difficulty: "Medium", duration: "12 min", category: "Leadership", categoryColor: "#F5A623", context: "", description: "Two team members are at odds. Mediate without picking sides.", completions: 0, locked: true, persona: { name: "", role: "", company: "", initials: "" }, criteria: [] },
  { id: "manage-up", title: "Manage Up — Push Back on Your Boss", emoji: "🔼", difficulty: "Hard", duration: "15 min", category: "Leadership", categoryColor: "#F5A623", context: "", description: "Your boss has an unrealistic expectation. Set boundaries without damaging the relationship.", completions: 0, locked: true, persona: { name: "", role: "", company: "", initials: "" }, criteria: [] },
  { id: "board-presentation", title: "Board Presentation Under Fire", emoji: "🎯", difficulty: "Hard", duration: "20 min", category: "Public Speaking", categoryColor: "#3DD68C", context: "", description: "Present quarterly results that missed targets. Handle tough board questions.", completions: 0, locked: true, persona: { name: "", role: "", company: "", initials: "" }, criteria: [] },
  { id: "crisis-allhands", title: "All-Hands During a Crisis", emoji: "🔥", difficulty: "Hard", duration: "15 min", category: "Public Speaking", categoryColor: "#3DD68C", context: "", description: "Address the entire company after a major incident. Be honest without causing panic.", completions: 0, locked: true, persona: { name: "", role: "", company: "", initials: "" }, criteria: [] },
  { id: "investor-pitch", title: "Investor Pitch Tough Q&A", emoji: "📈", difficulty: "Hard", duration: "20 min", category: "Public Speaking", categoryColor: "#3DD68C", context: "", description: "Your pitch went well but the Q&A is brutal. Handle skeptical investors.", completions: 0, locked: true, persona: { name: "", role: "", company: "", initials: "" }, criteria: [] },
  { id: "ceo-update", title: "CEO Walks In — 2 Minute Update", emoji: "⚡", difficulty: "Medium", duration: "10 min", category: "Decision Making", categoryColor: "#38BDF8", context: "", description: "The CEO wants a status update right now. Communicate clearly under pressure.", completions: 0, locked: true, persona: { name: "", role: "", company: "", initials: "" }, criteria: [] },
  { id: "unpopular-decision", title: "Defend an Unpopular Decision", emoji: "🛡️", difficulty: "Hard", duration: "15 min", category: "Decision Making", categoryColor: "#38BDF8", context: "", description: "You made the right call but nobody agrees. Stand your ground with evidence.", completions: 0, locked: true, persona: { name: "", role: "", company: "", initials: "" }, criteria: [] },
  { id: "angry-client", title: "Handle an Angry Client", emoji: "😤", difficulty: "Hard", duration: "15 min", category: "Difficult Conversations", categoryColor: "#F56565", context: "", description: "A major client is furious about a missed deliverable. De-escalate and rebuild trust.", completions: 0, locked: true, persona: { name: "", role: "", company: "", initials: "" }, criteria: [] },
  { id: "company-direction", title: "Disagree with Company Direction", emoji: "🧭", difficulty: "Hard", duration: "15 min", category: "Difficult Conversations", categoryColor: "#F56565", context: "", description: "You think the company is making a strategic mistake. Raise your concern to leadership.", completions: 0, locked: true, persona: { name: "", role: "", company: "", initials: "" }, criteria: [] },
];

export const freeScenarios = scenarios.filter(s => !s.locked);
export const lockedScenarios = scenarios.filter(s => s.locked);

export function getScenarioById(id: string) {
  return scenarios.find(s => s.id === id);
}

export function getDifficultyColor(difficulty: string) {
  switch (difficulty) {
    case "Beginner": return "#3DD68C";
    case "Medium": return "#F5A623";
    case "Hard": return "#F56565";
    default: return "#8891B4";
  }
}

export function getScoreColor(score: number) {
  if (score >= 80) return "#3DD68C";
  if (score >= 60) return "#7C6FF7";
  if (score >= 40) return "#F5A623";
  return "#F56565";
}
