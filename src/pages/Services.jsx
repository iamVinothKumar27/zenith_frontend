import React from "react";
import { Link } from "react-router-dom";


const Card = ({ title, desc, icon }) => (
  <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl shadow-sm p-6 hover:shadow-md transition">
    <div className="flex items-start gap-4">
      <div className="w-12 h-12 rounded-2xl bg-[rgba(16,185,129,0.12)] flex items-center justify-center text-2xl">
        {icon}
      </div>
      <div className="flex-1">
        <h3 className="text-lg font-semibold text-[var(--text)]">{title}</h3>
        <p className="text-sm text-[var(--muted)] mt-1 leading-relaxed">{desc}</p>
      </div>
    </div>
  </div>
);

export default function Services() {
  const services = [
    {
      icon: "🧭",
      title: "Personalized Learning Roadmaps",
      desc: "Generate a customized week-wise roadmap based on your goal, skill level, timeline, and preferred domain so your learning path stays focused and practical."
    },
    {
      icon: "🎥",
      title: "Smart Video Curation",
      desc: "Zenith automatically selects relevant YouTube learning videos for each roadmap topic, helping you start quickly without wasting time searching across multiple sources."
    },
    {
      icon: "📝",
      title: "Transcript, Summary & Study Support",
      desc: "Access video transcripts, simplified summaries, and revision-friendly study material to understand concepts faster and revise important points with ease."
    },
    {
      icon: "✅",
      title: "Quiz-Based Course Progress",
      desc: "Each learning step includes quizzes to test your understanding. Unlock the next stage only after meeting the pass criteria, making learning more structured and effective."
    },
    {
      icon: "💬",
      title: "AI Doubt Chat",
      desc: "Get instant support while learning through a continuous doubt chat system that helps you clarify concepts, ask follow-up questions, and stay on track."
    },
    {
      icon: "💻",
      title: "Coding Practice Tests",
      desc: "Practice coding problems with difficulty selection, company-focused preparation, structured problem statements, starter code, and execution support for real interview-style learning."
    },
    {
      icon: "🗄️",
      title: "SQL Practice & Schema-Based Questions",
      desc: "Solve SQL problems with generated schemas, datasets, expected outputs, and execution panels designed to simulate a real coding platform experience for database preparation."
    },
    {
      icon: "🎯",
      title: "Mock Tests with Mixed Sections",
      desc: "Take complete mock tests that combine aptitude, technical MCQs, coding, and SQL sections based on user-selected question counts and difficulty settings."
    },
    {
      icon: "📊",
      title: "Performance Tracking & Progress Saving",
      desc: "Your course progress, quiz status, practice activity, and test attempts are saved so you can resume anytime and track how consistently you are improving."
    },
    {
      icon: "📄",
      title: "ATS Resume Intelligence",
      desc: "Improve your resume with ATS-based analysis, job-aligned feedback, and smart suggestions that help make your profile stronger for internships and placement opportunities."
    },
    {
      icon: "👨‍🏫",
      title: "Practice + Mock Test Experience",
      desc: "Zenith supports both focused practice sessions and full exam-style mock tests so you can prepare topic-wise first and then evaluate yourself in a complete test environment."
    },
    {
      icon: "🔐",
      title: "Secure Test Environment",
      desc: "Mock tests are designed to support monitored test experiences and structured evaluation, making the platform more suitable for serious assessment workflows."
    }
  ];

  return (
    <>
      

      <div className="bg-[var(--bg)] text-[var(--text)] min-h-screen">
        <div className="max-w-6xl mx-auto px-6 py-12">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div>
              <h1 className="text-3xl font-bold text-[var(--text)]">Services</h1>
              <p className="text-[var(--muted)] mt-2 max-w-2xl">
                Zenith Learning is an all-in-one learning and placement preparation platform
                that combines smart course guidance, AI-powered study support, coding and SQL
                practice, mock tests, progress tracking, and resume intelligence.
              </p>
            </div>

            <div className="flex gap-3 flex-wrap">
              <Link
                to="/#courses"
                className="px-5 py-2.5 rounded-xl bg-[var(--accent)] text-white hover:bg-[var(--accent-2)] transition"
              >
                Explore Courses
              </Link>
              <Link
                to="/my-courses"
                className="px-5 py-2.5 rounded-xl bg-[var(--card)] border border-[var(--border)] text-[var(--text)] hover:opacity-90 transition"
              >
                My Courses
              </Link>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-5 mt-10">
            {services.map((s) => (
              <Card key={s.title} {...s} />
            ))}
          </div>

          <div className="mt-12 bg-[var(--card)] border border-[var(--border)] rounded-2xl p-8 shadow-sm">
            <h2 className="text-xl font-semibold text-[var(--text)]">How Zenith works</h2>
            <ol className="mt-3 space-y-2 text-[var(--muted)] text-sm leading-relaxed list-decimal list-inside">
              <li>Login using email/password or Google account.</li>
              <li>Choose your course, domain, practice module, or mock test type.</li>
              <li>Generate a personalized roadmap or start a practice/mock session based on your needs.</li>
              <li>Learn using curated videos, transcripts, summaries, quizzes, coding tasks, and SQL exercises.</li>
              <li>Track your progress, revisit saved work, and improve using analytics and ATS insights.</li>
            </ol>
          </div>
        </div>
      </div>

      
    </>
  );
}