import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Briefcase, Building2, Clock, Users } from "lucide-react";

export interface UserContext {
  jobTitle: string;
  industry: string;
  companySize: string;
  experience: string;
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

interface Props {
  scenarioTitle: string;
  scenarioEmoji: string;
  onStart: (ctx: UserContext, persona: GeneratedPersona) => void;
}

export default function SessionContextForm({ scenarioTitle, scenarioEmoji, onStart }: Props) {
  const [jobTitle, setJobTitle] = useState("");
  const [industry, setIndustry] = useState("");
  const [companySize, setCompanySize] = useState("");
  const [experience, setExperience] = useState("");

  const persona = useMemo(() => {
    if (industry && companySize) return generatePersona(industry, companySize);
    return null;
  }, [industry, companySize]);

  const isValid = jobTitle.trim() && industry && companySize && experience;

  const handleStart = () => {
    if (!isValid || !persona) return;
    onStart({ jobTitle: jobTitle.trim(), industry, companySize, experience }, persona);
  };

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
          <p className="text-sm text-pb-text-secondary">Tell us about your background so the AI can match your real situation.</p>
        </div>

        <div className="card-pb p-6 space-y-5">
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
              style={{ background: "#161829", border: "1px solid rgba(255,255,255,0.08)" }}
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
              style={{ background: "#161829", border: "1px solid rgba(255,255,255,0.08)", color: industry ? undefined : "#444C6E" }}
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
              style={{ background: "#161829", border: "1px solid rgba(255,255,255,0.08)", color: companySize ? undefined : "#444C6E" }}
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
              style={{ background: "#161829", border: "1px solid rgba(255,255,255,0.08)", color: experience ? undefined : "#444C6E" }}
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

          {/* Start Button */}
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

export { generatePersona };
export type { GeneratedPersona };
