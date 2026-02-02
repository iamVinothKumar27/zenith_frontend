import React from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar/Navbar";
import Footer from "../components/Footer/Footer";

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
      title: "Personalized Roadmap",
      desc: "Answer a few questions and get a week-wise learning roadmap tailored to your pace, level, and goal."
    },
    {
      icon: "🎥",
      title: "Smart YouTube Video Selection",
      desc: "We pick relevant videos for each roadmap topic so you can start learning quickly."
    },
    {
      icon: "📝",
      title: "Transcript + Summary",
      desc: "View transcript and generate study-friendly summaries in your preferred format."
    },
    {
      icon: "✅",
      title: "Quiz-based Progress",
      desc: "Unlock next videos by passing the quiz (40%+). Reattempt until you pass."
    },
    {
      icon: "💬",
      title: "Doubt Chat Support",
      desc: "Ask doubts anytime during a course with a continuous conversation chatbot."
    }
  ];

  return (
    <>
    <Navbar />
    <div className="bg-[var(--bg)] text-[var(--text)]">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold text-[var(--text)]">Services</h1>
            <p className="text-[var(--muted)] mt-2 max-w-2xl">
              Zenith Learning helps you learn faster with personalized roadmaps, curated videos, summaries, quizzes, and doubt support — all in one place.
            </p>
          </div>

          <div className="flex gap-3">
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
          <h2 className="text-xl font-semibold text-[var(--text)]">How it works</h2>
          <ol className="mt-3 space-y-2 text-[var(--muted)] text-sm leading-relaxed list-decimal list-inside">
            <li>Login (Email/Password or Google).</li>
            <li>Choose a course (or pick “Other Domains” and type your subject).</li>
            <li>Fill the course form and generate the roadmap + videos.</li>
            <li>Watch, read transcript/summary, and take the quiz to unlock next videos.</li>
            <li>Resume anytime from My Courses — progress stays saved.</li>
          </ol>
        </div>
      </div>
    </div>
    <Footer />
    </>
  );
}