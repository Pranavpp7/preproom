import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Search } from "lucide-react";
import ScenarioCard from "@/components/ScenarioCard";
import Footer from "@/components/Footer";
import { scenarios } from "@/data/scenarios";

const categories = ["All", "Negotiation", "Difficult Conversations", "Interviews", "Leadership", "Public Speaking", "Decision Making"];
const difficulties = ["All", "Beginner", "Medium", "Hard"];

export default function Scenarios() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [difficulty, setDifficulty] = useState("All");

  const filtered = useMemo(() => {
    return scenarios.filter(s => {
      if (search && !s.title.toLowerCase().includes(search.toLowerCase()) && !s.description.toLowerCase().includes(search.toLowerCase())) return false;
      if (category !== "All" && s.category !== category) return false;
      if (difficulty !== "All" && s.difficulty !== difficulty) return false;
      return true;
    });
  }, [search, category, difficulty]);

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight mb-3">Training Scenarios</h1>
          <p className="text-pb-text-secondary">Real workplace situations. AI that pushes back. Feedback that sticks.</p>
        </motion.div>

        {/* Search & Filters */}
        <div className="mb-8 space-y-4">
          <div className="relative max-w-md mx-auto">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-pb-text-muted" />
            <input
              type="text"
              placeholder="Search scenarios..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm text-foreground placeholder:text-pb-text-muted outline-none transition-all"
              style={{ background: "#161829", border: "1px solid rgba(255,255,255,0.08)" }}
              onFocus={e => e.currentTarget.style.borderColor = "#6C63F6"}
              onBlur={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"}
            />
          </div>

          <div className="flex flex-wrap justify-center gap-2">
            {categories.map(c => (
              <button key={c} onClick={() => setCategory(c)} className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${category === c ? "text-primary-foreground bg-gradient-primary" : "text-pb-text-secondary hover:text-foreground"}`} style={category !== c ? { border: "1px solid rgba(255,255,255,0.1)" } : {}}>
                {c}
              </button>
            ))}
          </div>

          <div className="flex justify-center gap-2">
            {difficulties.map(d => (
              <button key={d} onClick={() => setDifficulty(d)} className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${difficulty === d ? "text-foreground bg-pb-surface3" : "text-pb-text-muted hover:text-pb-text-secondary"}`}>
                {d}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((s, i) => (
            <motion.div key={s.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
              <ScenarioCard scenario={s} />
            </motion.div>
          ))}
        </div>

        {filtered.length === 0 && (
          <p className="text-center text-pb-text-muted py-16">No scenarios match your filters.</p>
        )}
      </div>
      <div className="mt-20">
        <Footer />
      </div>
    </div>
  );
}
