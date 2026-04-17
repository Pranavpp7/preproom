import { useState, useMemo, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Briefcase, Building2, Clock, Users, FileText, Check, X, Loader2, Upload, Info, Sparkles, MessageSquare, Target, AlertTriangle } from "lucide-react";

export type InterviewType = "screening" | "behavioural" | "technical" | "final-round";

export interface UserContext {
  jobTitle: string;
  industry: string;
  companySize: string;
  experience: string;
  resumeText?: string;
  interviewRole?: string;
  interviewMotivation?: string;
  interviewType?: InterviewType;
  // Custom scenario fields
  customSituation?: string;
  customCounterpart?: string;
  customDesiredOutcome?: string;
  customWorry?: string;
  // Scenario-specific fields for context cards
  currentSalary?: string;
  targetSalary?: string;
  achievement?: string;
  targetRole?: string;
  decisionDescription?: string;
  alternative?: string;
  feedbackReceived?: string;
  counterEvidence?: string;
}

export interface GeneratedPersona {
  name: string;
  role: string;
  company: string;
  initials: string;
}

const industries = ["Technology", "Finance", "Healthcare", "Consulting", "Education", "Retail", "Government", "Other"];
const companySizes = ["Startup (under 50)", "Mid-size (50-500)", "Enterprise (500+)"];
const experienceLevels = ["Less than 1 year", "1-2 years", "3-5 years", "5+ years"];

const industryPersonas: Record<string, { names: string[]; roles: Record<string, string>; companies: string[] }> = {
  Technology: {
    names: ["Sarah Chen", "Marcus Liu", "Priya Sharma"],
    roles: { "Startup (under 50)": "VP of Engineering", "Mid-size (50-500)": "Engineering Director", "Enterprise (500+)": "Senior Engineering Manager" },
    companies: ["Meridian Labs", "Crestline Technologies", "Vertex Systems"],
  },
  Finance: {
    names: ["James Whitfield", "Victoria Okafor", "Robert Huang"],
    roles: { "Startup (under 50)": "Head of Operations", "Mid-size (50-500)": "Managing Director", "Enterprise (500+)": "Senior Vice President" },
    companies: ["Blackridge Capital", "Pinnacle Advisory Group", "Harmon Financial"],
  },
  Healthcare: {
    names: ["Dr. Angela Rivera", "Dr. Michael Osei", "Karen Matsuda"],
    roles: { "Startup (under 50)": "Medical Director", "Mid-size (50-500)": "Department Head", "Enterprise (500+)": "Chief Nursing Officer" },
    companies: ["Lakewood Medical Center", "Crestview Health System", "Beacon Regional Hospital"],
  },
  Consulting: {
    names: ["Rachel Moore", "David Park", "Natasha Gill"],
    roles: { "Startup (under 50)": "Managing Partner", "Mid-size (50-500)": "Principal", "Enterprise (500+)": "Senior Partner" },
    companies: ["Vertex Consulting", "Ashford & Cole", "Summit Strategy Group"],
  },
  Education: {
    names: ["Dr. Patricia Howard", "Thomas Nguyen", "Linda Fernandez"],
    roles: { "Startup (under 50)": "Head of School", "Mid-size (50-500)": "Dean of Faculty", "Enterprise (500+)": "Associate Provost" },
    companies: ["Westfield Academy", "Meridian University", "Pacific Institute"],
  },
  Retail: {
    names: ["Jessica Hartman", "Brandon Cole", "Maria Santos"],
    roles: { "Startup (under 50)": "Head of Retail", "Mid-size (50-500)": "Regional Director", "Enterprise (500+)": "VP of Retail Operations" },
    companies: ["Brightline Brands", "Everly & Co.", "Northgate Retail Group"],
  },
  Government: {
    names: ["Catherine Walsh", "Andre Mitchell", "Diana Reyes"],
    roles: { "Startup (under 50)": "Program Director", "Mid-size (50-500)": "Division Chief", "Enterprise (500+)": "Deputy Director" },
    companies: ["City of Meridian", "State Department of Labor", "Federal Bureau of Planning"],
  },
  Other: {
    names: ["Alex Morgan", "Jordan Ellis", "Sam Nakamura"],
    roles: { "Startup (under 50)": "Director", "Mid-size (50-500)": "Senior Manager", "Enterprise (500+)": "Vice President" },
    companies: ["Crestline Group", "Beacon Partners", "Atlas Corp"],
  },
};

function generatePersona(industry: string, companySize: string): GeneratedPersona {
  const data = industryPersonas[industry] || industryPersonas["Other"];
  const name = data.names[Math.floor(Math.random() * data.names.length)];
  const role = data.roles[companySize] || data.roles["Mid-size (50-500)"];
  const company = data.companies[Math.floor(Math.random() * data.companies.length)];
  const initials = name.replace(/Dr\.\s*/, "").split(" ").map(w => w[0]).join("").slice(0, 2);
  return { name, role, company, initials };
}

async function extractPdfText(file: File): Promise<string> {
  const pdfjsLib = await import("pdfjs-dist");
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;
  
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  
  let fullText = "";
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items.map((item: any) => item.str).join(" ");
    fullText += pageText + "\n";
  }
  
  return fullText.trim();
}

interface Props {
  scenarioTitle: string;
  scenarioEmoji: string;
  scenarioId: string;
  onStart: (ctx: UserContext, persona: GeneratedPersona) => void;
}

const interviewTypes: { id: InterviewType; label: string; desc: string }[] = [
  { id: "screening", label: "Screening call", desc: "30 min, recruiter, general fit" },
  { id: "behavioural", label: "Behavioural", desc: "Competency, STAR method" },
  { id: "technical", label: "Technical", desc: "Role-specific skills, problem solving" },
  { id: "final-round", label: "Final round", desc: "Senior stakeholders, culture fit" },
];

export { type GeneratedPersona as GeneratedPersonaType };

export default function SessionContextForm({ scenarioTitle, scenarioEmoji, scenarioId, onStart }: Props) {
  const isInterview = scenarioId === "ace-your-next-interview" || scenarioId === "job-interview";
  const isCustom = scenarioId === "practice-any-conversation" || scenarioId === "custom-situation";
  const isSalary = scenarioId === "salary-negotiation";
  const isPromotion = scenarioId === "ask-for-promotion";
  const isChallenge = scenarioId === "challenge-a-decision";
  const isFeedback = scenarioId === "respond-to-critical-feedback";

  // Common fields
  const [jobTitle, setJobTitle] = useState("");
  const [industry, setIndustry] = useState("");
  const [companySize, setCompanySize] = useState("");
  const [experience, setExperience] = useState("");

  // Scenario-specific fields
  const [currentSalary, setCurrentSalary] = useState("");
  const [targetSalary, setTargetSalary] = useState("");
  const [achievement, setAchievement] = useState("");
  const [targetRole, setTargetRole] = useState("");
  const [decisionDescription, setDecisionDescription] = useState("");
  const [alternative, setAlternative] = useState("");
  const [feedbackReceived, setFeedbackReceived] = useState("");
  const [counterEvidence, setCounterEvidence] = useState("");
  
  // Interview-specific fields
  const [resumeText, setResumeText] = useState("");
  const [resumeFileName, setResumeFileName] = useState("");
  const [resumeParsing, setResumeParsing] = useState(false);
  const [resumeError, setResumeError] = useState("");
  const [interviewRole, setInterviewRole] = useState("");
  const [interviewMotivation, setInterviewMotivation] = useState("");
  const [interviewType, setInterviewType] = useState<InterviewType | "">("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Custom scenario fields
  const [customSituation, setCustomSituation] = useState("");
  const [customCounterpart, setCustomCounterpart] = useState("");
  const [customDesiredOutcome, setCustomDesiredOutcome] = useState("");
  const [customWorry, setCustomWorry] = useState("");

  const persona = useMemo(() => {
    if (industry && companySize) return generatePersona(industry, companySize);
    return null;
  }, [industry, companySize]);

  const baseValid = jobTitle.trim() && industry && companySize && experience;
  const isValid = isCustom
    ? customSituation.trim() && customDesiredOutcome.trim()
    : isInterview
    ? resumeText && interviewRole.trim() && interviewType
    : isSalary
    ? baseValid && currentSalary.trim() && targetSalary.trim()
    : isPromotion
    ? baseValid && targetRole.trim()
    : isChallenge
    ? baseValid && decisionDescription.trim()
    : isFeedback
    ? baseValid && feedbackReceived.trim()
    : baseValid;

  const handleFileUpload = useCallback(async (file: File) => {
    if (file.type !== "application/pdf") {
      setResumeError("Please upload a PDF file.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setResumeError("File too large. Maximum 10MB.");
      return;
    }
    
    setResumeParsing(true);
    setResumeError("");
    
    try {
      const text = await extractPdfText(file);
      if (!text || text.length < 50) {
        setResumeError("Could not extract text from this PDF. Try a different file.");
        return;
      }
      setResumeText(text);
      setResumeFileName(file.name);
    } catch (err) {
      console.error("PDF parse error:", err);
      setResumeError("Failed to parse PDF. Please try a different file.");
    } finally {
      setResumeParsing(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFileUpload(file);
  }, [handleFileUpload]);

  const handleStart = () => {
    if (!isValid) return;

    if (isCustom) {
      const customPersona: GeneratedPersona = {
        name: "Counterpart",
        role: customCounterpart.trim() || "The other person",
        company: "",
        initials: "CP",
      };
      onStart({
        jobTitle: "Custom",
        industry: "Other",
        companySize: "Mid-size (50-500)",
        experience: "3-5 years",
        customSituation: customSituation.trim(),
        customCounterpart: customCounterpart.trim(),
        customDesiredOutcome: customDesiredOutcome.trim(),
        customWorry: customWorry.trim(),
      }, customPersona);
    } else if (isInterview) {
      const interviewPersona: GeneratedPersona = {
        name: "Interviewer",
        role: "Hiring Manager",
        company: interviewRole.split(" at ").pop() || "the company",
        initials: "HM",
      };
      onStart({
        jobTitle: interviewRole.trim(),
        industry: "Technology",
        companySize: "Mid-size (50-500)",
        experience: "3-5 years",
        resumeText,
        interviewRole: interviewRole.trim(),
        interviewMotivation: interviewMotivation.trim(),
        interviewType: interviewType as InterviewType,
      }, interviewPersona);
    } else {
      if (!persona) return;
      onStart({
        jobTitle: jobTitle.trim(),
        industry,
        companySize,
        experience,
        currentSalary: currentSalary.trim() || undefined,
        targetSalary: targetSalary.trim() || undefined,
        achievement: achievement.trim() || undefined,
        targetRole: targetRole.trim() || undefined,
        decisionDescription: decisionDescription.trim() || undefined,
        alternative: alternative.trim() || undefined,
        feedbackReceived: feedbackReceived.trim() || undefined,
        counterEvidence: counterEvidence.trim() || undefined,
      }, persona);
    }
  };

  const inputStyle = { background: "#161829", border: "1px solid rgba(255,255,255,0.08)" };

  return (
    <div className="min-h-screen pt-16 flex items-center justify-center px-4" style={{ background: "#07080F" }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg"
      >
        <div className="text-center mb-8">
          {isCustom ? (
            <div className="w-12 h-12 rounded-xl mx-auto mb-3 flex items-center justify-center" style={{ background: "linear-gradient(135deg, rgba(124,111,247,0.2), rgba(6,182,212,0.2))" }}>
              <Sparkles className="w-6 h-6" style={{ color: "#7C6FF7" }} />
            </div>
          ) : (
            <span className="text-4xl mb-3 block">{scenarioEmoji}</span>
          )}
          <h1 className="text-2xl font-bold text-foreground tracking-tight mb-2">
            {isCustom ? "Describe your situation" : scenarioTitle}
          </h1>
          <p className="text-sm text-pb-text-secondary">
            {isCustom
              ? "Be as specific as possible. The more detail you give, the more realistic the practice."
              : isInterview
              ? "Upload your CV so the AI interviewer can ask questions specific to your experience."
              : "Tell us about your background so the AI can match your real situation."}
          </p>
        </div>

        <div className="card-pb p-6 space-y-5">
          {isCustom ? (
            <>
              {/* Situation */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                  <MessageSquare className="w-4 h-4 text-pb-text-muted" />
                  What is this conversation about?
                </label>
                <textarea
                  value={customSituation}
                  onChange={e => setCustomSituation(e.target.value)}
                  placeholder="e.g. I need to tell my manager that I disagree with their decision to rush the product launch. They are very senior and don't like being challenged."
                  rows={5}
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm text-foreground placeholder:text-pb-text-muted outline-none transition-all resize-none"
                  style={{ ...inputStyle, minHeight: "120px" }}
                  onFocus={e => e.currentTarget.style.borderColor = "#6C63F6"}
                  onBlur={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"}
                />
              </div>

              {/* Counterpart */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                  <Users className="w-4 h-4 text-pb-text-muted" />
                  Who are you talking to?
                </label>
                <input
                  type="text"
                  value={customCounterpart}
                  onChange={e => setCustomCounterpart(e.target.value)}
                  placeholder="e.g. My direct manager, Sarah, who has been at the company 10 years and is very results-driven"
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm text-foreground placeholder:text-pb-text-muted outline-none transition-all"
                  style={inputStyle}
                  onFocus={e => e.currentTarget.style.borderColor = "#6C63F6"}
                  onBlur={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"}
                />
              </div>

              {/* Desired outcome */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                  <Target className="w-4 h-4 text-pb-text-muted" />
                  What outcome do you want?
                </label>
                <input
                  type="text"
                  value={customDesiredOutcome}
                  onChange={e => setCustomDesiredOutcome(e.target.value)}
                  placeholder="e.g. I want them to agree to delay the launch by 2 weeks for proper testing"
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm text-foreground placeholder:text-pb-text-muted outline-none transition-all"
                  style={inputStyle}
                  onFocus={e => e.currentTarget.style.borderColor = "#6C63F6"}
                  onBlur={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"}
                />
              </div>

              {/* Worry */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                  <AlertTriangle className="w-4 h-4 text-pb-text-muted" />
                  What are you most worried about?
                </label>
                <input
                  type="text"
                  value={customWorry}
                  onChange={e => setCustomWorry(e.target.value)}
                  placeholder="e.g. They'll dismiss my concerns or think I'm being difficult"
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm text-foreground placeholder:text-pb-text-muted outline-none transition-all"
                  style={inputStyle}
                  onFocus={e => e.currentTarget.style.borderColor = "#6C63F6"}
                  onBlur={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"}
                />
              </div>
            </>
          ) : isInterview ? (
            <>
              {/* Interview Type */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                  <Users className="w-4 h-4 text-pb-text-muted" />
                  What type of interview is this?
                </label>
                <div className="flex flex-wrap gap-2">
                  {interviewTypes.map(t => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setInterviewType(t.id)}
                      className="px-3 py-2 rounded-xl text-xs font-medium transition-all text-left"
                      style={{
                        background: interviewType === t.id ? "rgba(108,99,246,0.15)" : "#161829",
                        border: `1px solid ${interviewType === t.id ? "rgba(108,99,246,0.4)" : "rgba(255,255,255,0.08)"}`,
                        color: interviewType === t.id ? "#A59BFA" : "#94A3B8",
                      }}
                    >
                      <span className="block font-semibold" style={{ color: interviewType === t.id ? "#E2E8F0" : "#CBD5E1" }}>{t.label}</span>
                      <span className="block mt-0.5 text-[10px]" style={{ color: "#94A3B8" }}>{t.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* CV Upload */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                  <FileText className="w-4 h-4 text-pb-text-muted" />
                  Upload your CV
                </label>

                {resumeText ? (
                  <div className="rounded-xl p-4 flex items-center gap-3" style={{ background: "rgba(61,214,140,0.06)", border: "1px solid rgba(61,214,140,0.15)" }}>
                    <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "rgba(61,214,140,0.15)" }}>
                      <Check className="w-4 h-4" style={{ color: "#3DD68C" }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">CV uploaded — {resumeFileName}</p>
                      <p className="text-xs text-pb-text-muted">{resumeText.length.toLocaleString()} characters extracted</p>
                    </div>
                    <button
                      onClick={() => { setResumeText(""); setResumeFileName(""); }}
                      className="text-xs font-medium hover:underline flex-shrink-0"
                      style={{ color: "#F56565" }}
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => !resumeParsing && fileInputRef.current?.click()}
                    onDragOver={e => e.preventDefault()}
                    onDrop={handleDrop}
                    className="rounded-xl p-6 text-center cursor-pointer transition-all hover:border-opacity-30"
                    style={{ ...inputStyle, borderStyle: "dashed" }}
                  >
                    {resumeParsing ? (
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" style={{ color: "#7C6FF7" }} />
                        <span className="text-sm text-pb-text-secondary">Parsing PDF...</span>
                      </div>
                    ) : (
                      <>
                        <Upload className="w-6 h-6 mx-auto mb-2 text-pb-text-muted" />
                        <p className="text-sm text-pb-text-secondary mb-1">Drag & drop your CV or click to browse</p>
                        <p className="text-xs text-pb-text-muted">PDF only · Max 10MB</p>
                      </>
                    )}
                  </div>
                )}
                {resumeError && <p className="text-xs mt-2" style={{ color: "#F56565" }}>{resumeError}</p>}
                <input ref={fileInputRef} type="file" accept=".pdf" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleFileUpload(f); }} />
              </div>

              {/* Role */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                  <Briefcase className="w-4 h-4 text-pb-text-muted" />
                  What role are you interviewing for?
                </label>
                <input
                  type="text"
                  value={interviewRole}
                  onChange={e => setInterviewRole(e.target.value)}
                  placeholder="e.g. Senior Product Manager at Stripe"
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm text-foreground placeholder:text-pb-text-muted outline-none transition-all"
                  style={inputStyle}
                  onFocus={e => e.currentTarget.style.borderColor = "#6C63F6"}
                  onBlur={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"}
                />
              </div>

              {/* Motivation */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                  <Info className="w-4 h-4 text-pb-text-muted" />
                  Job description <span className="text-pb-text-muted text-xs">(optional)</span>
                </label>
                <textarea
                  value={interviewMotivation}
                  onChange={e => setInterviewMotivation(e.target.value)}
                  placeholder="e.g. Paste the job description here so the interviewer can ask targeted questions"
                  rows={3}
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm text-foreground placeholder:text-pb-text-muted outline-none transition-all"
                  style={inputStyle}
                  onFocus={e => e.currentTarget.style.borderColor = "#6C63F6"}
                  onBlur={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"}
                />
              </div>
            </>
          ) : (
            <>
              {/* Job Title */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                  <Briefcase className="w-4 h-4 text-pb-text-muted" />
                  Your current role
                </label>
                <input
                  type="text"
                  value={jobTitle}
                  onChange={e => setJobTitle(e.target.value)}
                  placeholder="e.g. Junior Data Analyst, Marketing Coordinator"
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm text-foreground placeholder:text-pb-text-muted outline-none transition-all"
                  style={inputStyle}
                  onFocus={e => e.currentTarget.style.borderColor = "#6C63F6"}
                  onBlur={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"}
                />
              </div>

              {/* Industry */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                  <Building2 className="w-4 h-4 text-pb-text-muted" />
                  Industry
                </label>
                <div className="flex flex-wrap gap-2">
                  {industries.map(ind => (
                    <button
                      key={ind}
                      type="button"
                      onClick={() => setIndustry(ind)}
                      className="px-3.5 py-2 rounded-xl text-xs font-medium transition-all"
                      style={{
                        background: industry === ind ? "rgba(108,99,246,0.15)" : "#161829",
                        border: `1px solid ${industry === ind ? "rgba(108,99,246,0.4)" : "rgba(255,255,255,0.08)"}`,
                        color: industry === ind ? "#A59BFA" : "#94A3B8",
                      }}
                    >
                      {ind}
                    </button>
                  ))}
                </div>
              </div>

              {/* Company Size */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                  <Users className="w-4 h-4 text-pb-text-muted" />
                  Company size
                </label>
                <div className="flex flex-wrap gap-2">
                  {companySizes.map(size => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => setCompanySize(size)}
                      className="px-3.5 py-2 rounded-xl text-xs font-medium transition-all"
                      style={{
                        background: companySize === size ? "rgba(108,99,246,0.15)" : "#161829",
                        border: `1px solid ${companySize === size ? "rgba(108,99,246,0.4)" : "rgba(255,255,255,0.08)"}`,
                        color: companySize === size ? "#A59BFA" : "#94A3B8",
                      }}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              {/* Experience */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                  <Clock className="w-4 h-4 text-pb-text-muted" />
                  Experience
                </label>
                <div className="flex flex-wrap gap-2">
                  {experienceLevels.map(exp => (
                    <button
                      key={exp}
                      type="button"
                      onClick={() => setExperience(exp)}
                      className="px-3.5 py-2 rounded-xl text-xs font-medium transition-all"
                      style={{
                        background: experience === exp ? "rgba(108,99,246,0.15)" : "#161829",
                        border: `1px solid ${experience === exp ? "rgba(108,99,246,0.4)" : "rgba(255,255,255,0.08)"}`,
                        color: experience === exp ? "#A59BFA" : "#94A3B8",
                      }}
                    >
                      {exp}
                    </button>
                  ))}
                </div>
              </div>

              {/* Generated persona preview */}
              {persona && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl p-4" style={{ background: "rgba(108,99,246,0.06)", border: "1px solid rgba(108,99,246,0.12)" }}>
                  <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: "#7C6FF7" }}>Your AI counterpart</p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold" style={{ background: "rgba(245,101,101,0.15)", color: "#F56565" }}>
                      {persona.initials}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{persona.name}</p>
                      <p className="text-xs text-pb-text-secondary">{persona.role} at {persona.company}</p>
                    </div>
                  </div>
                </motion.div>
              )}
            </>
          )}

          {/* Start button */}
          <button
            onClick={handleStart}
            disabled={!isValid}
            className="w-full py-3 rounded-xl text-sm font-semibold text-primary-foreground bg-gradient-primary hover:opacity-90 transition-opacity disabled:opacity-40 flex items-center justify-center gap-2"
          >
            Start Session <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
    </div>
  );
}
