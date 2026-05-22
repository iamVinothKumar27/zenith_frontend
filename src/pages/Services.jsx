import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Map, Video, BookOpenCheck, MessageCircle, Code2, Database,
  Target, BarChart2, FileSearch, TestTube, Lock, ClipboardList,
  ArrowRight, Star,
} from "lucide-react";

const SERVICES = [
  { icon: Map, title: "Personalized Learning Roadmaps", desc: "Generate a customized week-wise roadmap based on your goal, skill level, timeline, and preferred domain so your learning path stays focused and practical.", color: "text-indigo-500", bg: "bg-indigo-50 dark:bg-indigo-900/20" },
  { icon: Video, title: "Smart Video Curation", desc: "Zenith automatically selects relevant YouTube learning videos for each roadmap topic, helping you start quickly without wasting time searching across multiple sources.", color: "text-violet-500", bg: "bg-violet-50 dark:bg-violet-900/20" },
  { icon: BookOpenCheck, title: "Transcript, Summary & Study Support", desc: "Access video transcripts, simplified summaries, and revision-friendly study material to understand concepts faster and revise important points with ease.", color: "text-sky-500", bg: "bg-sky-50 dark:bg-sky-900/20" },
  { icon: ClipboardList, title: "Quiz-Based Course Progress", desc: "Each learning step includes quizzes to test your understanding. Unlock the next stage only after meeting the pass criteria, making learning more structured and effective.", color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-900/20" },
  { icon: MessageCircle, title: "AI Doubt Chat", desc: "Get instant support while learning through a continuous doubt chat system that helps you clarify concepts, ask follow-up questions, and stay on track.", color: "text-teal-500", bg: "bg-teal-50 dark:bg-teal-900/20" },
  { icon: Code2, title: "Coding Practice Tests", desc: "Practice coding problems with difficulty selection, company-focused preparation, structured problem statements, starter code, and execution support for real interview-style learning.", color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-900/20" },
  { icon: Database, title: "SQL Practice & Schema-Based Questions", desc: "Solve SQL problems with generated schemas, datasets, expected outputs, and execution panels designed to simulate a real coding platform experience for database preparation.", color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-900/20" },
  { icon: Target, title: "Mock Tests with Mixed Sections", desc: "Take complete mock tests that combine aptitude, technical MCQs, coding, and SQL sections based on user-selected question counts and difficulty settings.", color: "text-rose-500", bg: "bg-rose-50 dark:bg-rose-900/20" },
  { icon: BarChart2, title: "Performance Tracking & Progress Saving", desc: "Your course progress, quiz status, practice activity, and test attempts are saved so you can resume anytime and track how consistently you are improving.", color: "text-purple-500", bg: "bg-purple-50 dark:bg-purple-900/20" },
  { icon: FileSearch, title: "ATS Resume Intelligence", desc: "Improve your resume with ATS-based analysis, job-aligned feedback, and smart suggestions that help make your profile stronger for internships and placement opportunities.", color: "text-pink-500", bg: "bg-pink-50 dark:bg-pink-900/20" },
  { icon: TestTube, title: "Practice + Mock Test Experience", desc: "Zenith supports both focused practice sessions and full exam-style mock tests so you can prepare topic-wise first and then evaluate yourself in a complete test environment.", color: "text-cyan-500", bg: "bg-cyan-50 dark:bg-cyan-900/20" },
  { icon: Lock, title: "Secure Test Environment", desc: "Mock tests are designed to support monitored test experiences and structured evaluation, making the platform more suitable for serious assessment workflows.", color: "text-slate-500", bg: "bg-slate-50 dark:bg-slate-800/40" },
];

const HOW_IT_WORKS = [
  "Login using email/password or Google account.",
  "Choose your course, domain, practice module, or mock test type.",
  "Generate a personalized roadmap or start a practice/mock session based on your needs.",
  "Learn using curated videos, transcripts, summaries, quizzes, coding tasks, and SQL exercises.",
  "Track your progress, revisit saved work, and improve using analytics and ATS insights.",
];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};
const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

function ServiceCard({ icon: Icon, title, desc, color, bg }) {
  return (
    <motion.div
      variants={item}
      className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-5 flex items-start gap-4 hover:border-[var(--accent-border)] hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(79,70,229,0.08)] transition-all duration-300 group"
    >
      <div className={`w-11 h-11 rounded-xl ${bg} grid place-items-center shrink-0 mt-0.5`}>
        <Icon className={`w-5 h-5 ${color}`} />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-[var(--text)] mb-1.5 group-hover:text-[var(--accent)] transition-colors">{title}</h3>
        <p className="text-sm text-[var(--muted)] leading-relaxed">{desc}</p>
      </div>
    </motion.div>
  );
}

export default function Services() {
  return (
    <div className="bg-[var(--bg)] text-[var(--text)] min-h-screen">
      {/* Hero */}
      <section className="bg-[var(--surface)] border-b border-[var(--border)]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl"
          >
            <div className="section-eyebrow mb-3">
              <Star className="w-3.5 h-3.5" />
              Platform Features
            </div>
            <h1 className="text-4xl font-bold text-[var(--text)] mb-4">
              Everything You Need to{" "}
              <span className="gradient-text">Succeed</span>
            </h1>
            <p className="text-[var(--muted)] text-lg leading-relaxed mb-8">
              Zenith Learning is an all-in-one platform combining smart course guidance, AI-powered study support, coding and SQL practice, mock tests, progress tracking, and resume intelligence.
            </p>
            <div className="flex gap-3 flex-wrap">
              <Link to="/#courses" className="primary-btn gap-2 group">
                Explore Courses
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link to="/my-courses" className="outline-btn gap-2">
                <BookOpenCheck className="w-4 h-4" />
                My Courses
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
        {/* Services grid */}
        <div className="mb-12">
          <div className="text-center mb-10">
            <div className="section-eyebrow justify-center mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]" />
              What We Offer
            </div>
            <h2 className="section-title text-center">All Platform Features</h2>
          </div>

          <motion.div
            variants={container}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-40px" }}
            className="grid md:grid-cols-2 gap-4"
          >
            {SERVICES.map((s) => (
              <ServiceCard key={s.title} {...s} />
            ))}
          </motion.div>
        </div>

        {/* How it works */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-[var(--card)] border border-[var(--border)] rounded-3xl p-8 shadow-sm"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl grid place-items-center shrink-0"
              style={{ background: "var(--accent-light)" }}>
              <Map className="w-5 h-5" style={{ color: "var(--accent)" }} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[var(--text)]">How Zenith Works</h2>
              <p className="text-sm text-[var(--muted)]">5 simple steps to get started</p>
            </div>
          </div>

          <ol className="space-y-3">
            {HOW_IT_WORKS.map((step, i) => (
              <motion.li
                key={i}
                initial={{ opacity: 0, x: -16 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="flex items-start gap-4"
              >
                <div className="w-7 h-7 rounded-xl text-white text-xs font-bold grid place-items-center shrink-0"
                  style={{ background: "var(--grad)" }}>
                  {i + 1}
                </div>
                <p className="text-sm text-[var(--muted)] leading-relaxed pt-1">{step}</p>
              </motion.li>
            ))}
          </ol>
        </motion.div>
      </div>
    </div>
  );
}
