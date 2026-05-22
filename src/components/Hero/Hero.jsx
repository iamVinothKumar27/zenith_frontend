import React from "react";
import { motion } from "framer-motion";
import { useNavigate, Link } from "react-router-dom";
import { ArrowRight, Play, Star, Users, BookOpen, Award } from "lucide-react";
import heroPng from "../../assets/hero.png";
import { useAuth } from "../../auth/AuthProvider";

export const FadeUp = (delay) => ({
  initial: { opacity: 0, y: 40 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 90, duration: 0.6, delay, ease: "easeOut" },
  },
});

const STATS = [
  { icon: Users, value: "500K+", label: "Active Learners" },
  { icon: BookOpen, value: "10K+", label: "Courses" },
  { icon: Award, value: "98%", label: "Success Rate" },
  { icon: Star, value: "4.9", label: "Avg Rating" },
];

const TRUSTED = ["Google", "Microsoft", "Amazon", "Meta", "Netflix"];

const Hero = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleGetStarted = () => navigate(user ? "/#courses" : "/signup");

  return (
    <section className="relative overflow-hidden bg-[var(--bg)]">
      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full opacity-[0.06]"
          style={{ background: "radial-gradient(circle, var(--accent) 0%, transparent 70%)" }} />
        <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full opacity-[0.05]"
          style={{ background: "radial-gradient(circle, var(--accent-2) 0%, transparent 70%)" }} />
      </div>

      <div className="container relative">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 min-h-[620px] items-center py-16 lg:py-20">

          {/* Left: Copy */}
          <div className="flex flex-col gap-6 text-center lg:text-left">
            {/* Eyebrow */}
            <motion.div variants={FadeUp(0.1)} initial="initial" animate="animate">
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold border"
                style={{ background: "var(--accent-light)", borderColor: "var(--accent-border)", color: "var(--accent)" }}>
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] animate-pulse" />
                #1 Tech Learning Platform
              </span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              variants={FadeUp(0.2)}
              initial="initial"
              animate="animate"
              className="text-4xl sm:text-5xl lg:text-[3.5rem] font-bold leading-[1.1] tracking-tight text-[var(--text)]"
            >
              Master Tech Skills &{" "}
              <span className="gradient-text">Launch Your</span>
              <br />
              <span className="gradient-text">Dream Career</span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              variants={FadeUp(0.3)}
              initial="initial"
              animate="animate"
              className="text-lg text-[var(--muted)] max-w-lg mx-auto lg:mx-0 leading-relaxed"
            >
              From beginner tutorials to advanced coding challenges — learn web development, DSA, AI, and more with expert-curated content.
            </motion.p>

            {/* CTAs */}
            <motion.div
              variants={FadeUp(0.4)}
              initial="initial"
              animate="animate"
              className="flex flex-wrap items-center gap-3 justify-center lg:justify-start"
            >
              <button
                onClick={handleGetStarted}
                className="primary-btn gap-2 text-base px-7 py-3 group"
              >
                {user ? "Browse Courses" : "Start Learning Free"}
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
              <Link
                to="/services"
                className="outline-btn gap-2 text-base px-7 py-3"
              >
                <Play className="w-4 h-4" />
                View Services
              </Link>
            </motion.div>

            {/* Social Proof */}
            <motion.div
              variants={FadeUp(0.5)}
              initial="initial"
              animate="animate"
              className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start"
            >
              <div className="flex -space-x-2">
                {["bg-indigo-400", "bg-violet-400", "bg-pink-400", "bg-sky-400"].map((c, i) => (
                  <div key={i} className={`w-8 h-8 rounded-full ${c} border-2 border-[var(--bg)] flex items-center justify-center text-white text-xs font-bold`}>
                    {String.fromCharCode(65 + i)}
                  </div>
                ))}
              </div>
              <div className="text-sm text-[var(--muted)]">
                <span className="font-semibold text-[var(--text)]">500,000+</span> learners already enrolled
              </div>
            </motion.div>
          </div>

          {/* Right: Image + floating cards */}
          <div className="relative flex justify-center items-center">
            {/* Glow */}
            <div className="absolute w-80 h-80 rounded-full blur-3xl opacity-20"
              style={{ background: "var(--grad)" }} />

            {/* Hero Image */}
            <motion.img
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2, ease: "easeOut" }}
              src={heroPng}
              alt="Learning illustration"
              className="relative z-10 w-full max-w-[420px] lg:max-w-[500px] drop-shadow-2xl animate-[float_6s_ease-in-out_infinite]"
            />

            {/* Floating stat cards */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.7 }}
              className="absolute top-8 -left-4 glass-card px-4 py-3 flex items-center gap-3 z-20 shadow-lg"
            >
              <div className="w-10 h-10 rounded-xl grid place-items-center text-white shrink-0"
                style={{ background: "var(--grad)" }}>
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs text-[var(--muted)]">Courses</div>
                <div className="text-sm font-bold text-[var(--text)]">10,000+</div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.9 }}
              className="absolute bottom-16 -right-4 glass-card px-4 py-3 flex items-center gap-3 z-20 shadow-lg"
            >
              <div className="w-10 h-10 rounded-xl grid place-items-center text-white shrink-0"
                style={{ background: "linear-gradient(135deg, #059669, #10B981)" }}>
                <Award className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs text-[var(--muted)]">Success Rate</div>
                <div className="text-sm font-bold text-[var(--text)]">98%</div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Stats Row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 pb-14"
        >
          {STATS.map((s, i) => (
            <div key={i} className="ui-card p-5 flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl grid place-items-center shrink-0"
                style={{ background: "var(--accent-light)" }}>
                <s.icon className="w-5 h-5" style={{ color: "var(--accent)" }} />
              </div>
              <div>
                <div className="text-xl font-bold text-[var(--text)]">{s.value}</div>
                <div className="text-xs text-[var(--muted)]">{s.label}</div>
              </div>
            </div>
          ))}
        </motion.div>

        {/* Trusted By */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 1.0 }}
          className="pb-14 flex flex-col items-center gap-4"
        >
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
            Trusted by learners from top companies
          </p>
          <div className="flex flex-wrap justify-center gap-6">
            {TRUSTED.map((c) => (
              <span key={c} className="text-sm font-semibold text-[var(--muted-light)] hover:text-[var(--muted)] transition-colors">
                {c}
              </span>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;
