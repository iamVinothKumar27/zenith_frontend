import React from "react";
import BannerPng from "../../assets/education.png";
import { motion } from "framer-motion";
import { BookMarked, UserCheck, Clock, TrendingUp, CheckCircle2 } from "lucide-react";

const FEATURES = [
  {
    icon: BookMarked,
    title: "10,000+ Courses",
    desc: "From beginner to expert-level content across all tech domains",
    color: "text-indigo-500",
    bg: "bg-indigo-50 dark:bg-indigo-900/20",
  },
  {
    icon: UserCheck,
    title: "Expert Instruction",
    desc: "Learn from industry professionals with real-world experience",
    color: "text-violet-500",
    bg: "bg-violet-50 dark:bg-violet-900/20",
  },
  {
    icon: Clock,
    title: "Lifetime Access",
    desc: "Learn at your own pace with permanent access to all content",
    color: "text-sky-500",
    bg: "bg-sky-50 dark:bg-sky-900/20",
  },
  {
    icon: TrendingUp,
    title: "Career Outcomes",
    desc: "98% of our learners report improved job prospects after completion",
    color: "text-emerald-500",
    bg: "bg-emerald-50 dark:bg-emerald-900/20",
  },
];

const Banner = () => {
  return (
    <section className="bg-[var(--bg)] py-20">
      <div className="container">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">

          {/* Image Side */}
          <div className="relative flex justify-center items-center order-2 md:order-1">
            <div className="absolute inset-0 rounded-3xl opacity-10 blur-2xl"
              style={{ background: "var(--grad)" }} />
            <motion.img
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              src={BannerPng}
              alt="Education"
              className="relative z-10 w-full max-w-[380px] md:max-w-[420px] drop-shadow-xl"
            />
          </div>

          {/* Content Side */}
          <div className="order-1 md:order-2">
            <div className="section-eyebrow mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]" />
              Why Choose Zenith
            </div>
            <h2 className="section-title mb-5">
              The World&apos;s Leading<br />
              <span className="gradient-text">Online Learning Platform</span>
            </h2>
            <p className="text-[var(--muted)] mb-8 leading-relaxed">
              We combine expert instruction with cutting-edge tools to give you everything you need to succeed in your tech career.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {FEATURES.map((f, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.1 }}
                  className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-4 flex items-start gap-3 hover:border-[var(--accent-border)] hover:shadow-[0_4px_20px_rgba(79,70,229,0.08)] transition-all duration-300"
                >
                  <div className={`w-10 h-10 rounded-xl ${f.bg} grid place-items-center shrink-0`}>
                    <f.icon className={`w-5 h-5 ${f.color}`} />
                  </div>
                  <div>
                    <div className="font-semibold text-sm text-[var(--text)] mb-0.5">{f.title}</div>
                    <div className="text-xs text-[var(--muted)] leading-relaxed">{f.desc}</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Banner;
