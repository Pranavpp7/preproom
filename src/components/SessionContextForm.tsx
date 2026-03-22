import { useState, useMemo, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Briefcase, Building2, Clock, Users, FileText, Check, X, Loader2, Upload, Info } from "lucide-react";

export interface UserContext {
  jobTitle: string;
  industry: string;
  companySize: string;
  experience: string;
  resumeText?: string;
  interviewRole?: string;
  interviewMotivation?: string;
  // Custom scenario fields
  customSituation?: string;
  customCounterpart?: string;
  customDesiredOutcome?: string;
  customWorry?: string;
}

interface GeneratedPersona {
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

export default function SessionContextForm({ scenarioTitle, scenarioEmoji, scenarioId, onStart }: Props) {
  const isInterview = scenarioId === "job-interview";
  const isCustom = scenarioId === "custom-situation";
  
  // Common fields
  const [jobTitle, setJobTitle] = useState("");
  const [industry, setIndustry] = useState("");
  const [companySize, setCompanySize] = useState("");
  const [experience, setExperience] = useState("");
  
  // Interview-specific fields
  const [resumeText, setResumeText] = useState("");
  const [resumeFileName, setResumeFileName] = useState("");
  const [resumeParsing, setResumeParsing] = useState(false);
  const [resumeError, setResumeError] = useState("");
  const [interviewRole, setInterviewRole] = useState("");
  const [interviewMotivation, setInterviewMotivation] = useState("");
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

  const isValid = isCustom
    ? customSituation.trim() && customDesiredOutcome.trim()
    : isInterview
    ? resumeText && interviewRole.trim() && interviewMotivation.trim()
    : jobTitle.trim() && industry && companySize && experience;

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
      }, interviewPersona);
    } else {
      if (!persona) return;
      onStart({ jobTitle: jobTitle.trim(), industry, companySize, experience }, persona);
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
          <span className="text-4xl mb-3 block">{scenarioEmoji}</span>
          <h1 className="text-2xl font-bold text-foreground tracking-tight mb-2">{scenarioTitle}</h1>
          <p className="text-sm text-pb-text-secondary">
            {isInterview
              ? "Upload your CV so the AI interviewer can ask questions specific to your experience."
              : "Tell us about your background so the AI can match your real situation."}
          </p>
        </div>

        <div className="card-pb p-6 space-y-5">
          {isInterview ? (
            <>
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
                    onDrop={handleDrop}
                    onDragOver={e => e.preventDefault()}
                    className="rounded-xl p-6 text-center cursor-pointer transition-all hover:border-primary/30"
                    style={{ background: "#161829", border: "2px dashed rgba(255,255,255,0.12)" }}
                  >
                    {resumeParsing ? (
                      <div className="flex flex-col items-center gap-2">
                        <Loader2 className="w-6 h-6 animate-spin text-pb-text-muted" />
                        <p className="text-sm text-pb-text-secondary">Parsing your CV...</p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <Upload className="w-6 h-6 text-pb-text-muted" />
                        <p className="text-sm text-pb-text-secondary">Click to upload or drag and drop</p>
                        <p className="text-xs text-pb-text-muted">PDF only · Parsed locally · Never stored</p>
                      </div>
                    )}
                  </div>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,application/pdf"
                  className="hidden"
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(file);
                    e.target.value = "";
                  }}
                />

                {resumeError && (
                  <p className="text-xs mt-2 font-medium" style={{ color: "#F56565" }}>{resumeError}</p>
                )}

                <div className="flex items-start gap-2 mt-2.5 p-2.5 rounded-lg" style={{ background: "rgba(108,99,246,0.06)" }}>
                  <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color: "#7C6FF7" }} />
                  <p className="text-[11px] leading-relaxed" style={{ color: "#8891B4" }}>
                    Your CV is processed entirely in your browser. It is sent to our AI for analysis but never stored on our servers.
                  </p>
                </div>
              </div>

              {/* Interview Role */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                  <Briefcase className="w-4 h-4 text-pb-text-muted" />
                  Role and company you're interviewing for
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
                  <Building2 className="w-4 h-4 text-pb-text-muted" />
                  Why you want this specific role
                </label>
                <input
                  type="text"
                  value={interviewMotivation}
                  onChange={e => setInterviewMotivation(e.target.value)}
                  placeholder="e.g. Excited about their API-first approach and growth stage"
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
                  Your current job title
                </label>
                <input
                  type="text"
                  value={jobTitle}
                  onChange={e => setJobTitle(e.target.value)}
                  placeholder="e.g. Marketing Coordinator, Software Engineer, Nurse"
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
                  Your industry
                </label>
                <select
                  value={industry}
                  onChange={e => setIndustry(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm text-foreground outline-none transition-all appearance-none cursor-pointer"
                  style={{ ...inputStyle, color: industry ? undefined : "#444C6E" }}
                  onFocus={e => e.currentTarget.style.borderColor = "#6C63F6"}
                  onBlur={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"}
                >
                  <option value="" disabled>Select your industry</option>
                  {industries.map(i => <option key={i} value={i}>{i}</option>)}
                </select>
              </div>

              {/* Company Size */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                  <Users className="w-4 h-4 text-pb-text-muted" />
                  Company size
                </label>
                <select
                  value={companySize}
                  onChange={e => setCompanySize(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm text-foreground outline-none transition-all appearance-none cursor-pointer"
                  style={{ ...inputStyle, color: companySize ? undefined : "#444C6E" }}
                  onFocus={e => e.currentTarget.style.borderColor = "#6C63F6"}
                  onBlur={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"}
                >
                  <option value="" disabled>Select company size</option>
                  {companySizes.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              {/* Experience */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                  <Clock className="w-4 h-4 text-pb-text-muted" />
                  Years of experience
                </label>
                <select
                  value={experience}
                  onChange={e => setExperience(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm text-foreground outline-none transition-all appearance-none cursor-pointer"
                  style={{ ...inputStyle, color: experience ? undefined : "#444C6E" }}
                  onFocus={e => e.currentTarget.style.borderColor = "#6C63F6"}
                  onBlur={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"}
                >
                  <option value="" disabled>Select experience level</option>
                  {experienceLevels.map(e => <option key={e} value={e}>{e}</option>)}
                </select>
              </div>

              {/* Persona Preview */}
              {persona && jobTitle.trim() && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="rounded-xl p-4"
                  style={{ background: "rgba(108,99,246,0.06)", border: "1px solid rgba(108,99,246,0.15)" }}
                >
                  <p className="text-xs font-bold uppercase tracking-wider text-pb-text-muted mb-1.5">Your scenario</p>
                  <p className="text-sm text-foreground">
                    You'll be speaking with: <span className="font-semibold" style={{ color: "#7C6FF7" }}>{persona.name}</span>, {persona.role} at {persona.company}
                  </p>
                  <p className="text-xs text-pb-text-secondary mt-1">
                    Adapted for a {jobTitle.trim()} with {experience || "your"} experience in {industry}
                  </p>
                </motion.div>
              )}
            </>
          )}

          {/* Start Button */}
          <div className="relative group">
            <button
              onClick={handleStart}
              disabled={!isValid}
              className="w-full py-3 rounded-xl text-sm font-semibold text-primary-foreground bg-gradient-primary hover:opacity-90 transition-opacity disabled:opacity-40 flex items-center justify-center gap-2"
            >
              Start Session <ArrowRight className="w-4 h-4" />
            </button>
            {isInterview && !isValid && (
              <div className="absolute -top-10 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-lg text-xs text-foreground whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" style={{ background: "#1A1D2E", border: "1px solid rgba(255,255,255,0.1)" }}>
                {!resumeText ? "Please upload your CV to begin" : "Fill in all required fields"}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export { generatePersona };
export type { GeneratedPersona };
