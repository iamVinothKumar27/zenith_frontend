import React from "react";
import { motion } from "framer-motion";
import { Users, BookOpen, Globe, Award, TrendingUp, Star } from "lucide-react";

const STATS = [
  { icon: Users, value: "500M+", label: "Students Worldwide", color: "text-indigo-400" },
  { icon: BookOpen, value: "10K+", label: "Courses Available", color: "text-violet-400" },
  { icon: Globe, value: "150+", label: "Countries Reached", color: "text-sky-400" },
  { icon: Award, value: "98%", label: "Completion Rate", color: "text-emerald-400" },
  { icon: Star, value: "4.9★", label: "Average Rating", color: "text-yellow-400" },
  { icon: TrendingUp, value: "3x", label: "Career Growth", color: "text-rose-400" },
];

const Subscribe = () => {
  return (
    <section className="py-20 relative overflow-hidden" style={{ background: "var(--surface)" }}>
      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full blur-3xl opacity-[0.06]"
          style={{ background: "var(--grad)" }} />
      </div>

      <div className="container relative">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-14"
        >
          <div className="section-eyebrow justify-center mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]" />
            By The Numbers
          </div>
          <h2 className="section-title text-center mb-4">
            500M+ Students Are Learning With Us
          </h2>
          <p className="section-subtitle mx-auto text-center">
            It&apos;s never too late to start learning. Join millions of learners building the future.
          </p>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {STATS.map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.06 }}
              className="bg-[var(--card)] rounded-2xl border border-[var(--border)] p-5 text-center flex flex-col items-center gap-3 hover:border-[var(--accent-border)] hover:-translate-y-1 hover:shadow-[0_8px_24px_rgba(79,70,229,0.1)] transition-all duration-300"
            >
              <div className="w-11 h-11 rounded-xl bg-[var(--surface)] grid place-items-center">
                <s.icon className={`w-5 h-5 ${s.color}`} />
              </div>
              <div>
                <div className="text-2xl font-bold text-[var(--text)]">{s.value}</div>
                <div className="text-xs text-[var(--muted)] mt-0.5">{s.label}</div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* CTA Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-12 rounded-3xl p-8 md:p-12 text-center text-white relative overflow-hidden"
          style={{ background: "var(--grad)" }}
        >
          <div className="absolute inset-0 opacity-10"
            style={{ backgroundImage: "radial-gradient(circle at 80% 50%, white 0%, transparent 60%)" }} />
          <div className="relative">
            <h3 className="text-2xl md:text-3xl font-bold mb-3">Ready to Start Your Journey?</h3>
            <p className="text-white/80 mb-6 text-base max-w-lg mx-auto">
              Join millions of learners. Free to start, expert-guided paths, lifetime access.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <a
                href="/signup"
                className="px-7 py-3 bg-white text-indigo-600 font-semibold rounded-xl hover:bg-indigo-50 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                Get Started Free
              </a>
              <a
                href="/services"
                className="px-7 py-3 border-2 border-white/40 text-white font-semibold rounded-xl hover:bg-white/10 transition-all duration-200"
              >
                Browse Courses
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Subscribe;
