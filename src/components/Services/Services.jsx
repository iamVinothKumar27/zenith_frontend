import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Globe, Smartphone, Code2, BrainCircuit, Layers, Cpu, MoreHorizontal, ExternalLink } from "lucide-react";

const COURSES = [
  {
    id: 1,
    title: "Web Development",
    desc: "HTML, CSS, JS, React, Node.js & more",
    icon: Globe,
    color: "from-blue-500 to-indigo-600",
    lightBg: "bg-blue-50 dark:bg-blue-900/20",
    iconColor: "text-blue-600",
    blog: "https://www.geeksforgeeks.org/web-tech/web-technology/",
    level: "Beginner → Advanced",
    lessons: "120+ lessons",
  },
  {
    id: 2,
    title: "Mobile Development",
    desc: "Android, iOS, React Native, Flutter",
    icon: Smartphone,
    color: "from-emerald-500 to-teal-600",
    lightBg: "bg-emerald-50 dark:bg-emerald-900/20",
    iconColor: "text-emerald-600",
    blog: "https://www.geeksforgeeks.org/android/android-tutorial/",
    level: "Intermediate",
    lessons: "80+ lessons",
  },
  {
    id: 3,
    title: "Data Structures",
    desc: "Arrays, Trees, Graphs, DP, Sorting",
    icon: Code2,
    color: "from-violet-500 to-purple-600",
    lightBg: "bg-violet-50 dark:bg-violet-900/20",
    iconColor: "text-violet-600",
    blog: "https://www.geeksforgeeks.org/dsa/dsa-tutorial-learn-data-structures-and-algorithms/",
    level: "All levels",
    lessons: "150+ problems",
  },
  {
    id: 4,
    title: "Machine Learning",
    desc: "Supervised, Unsupervised, Deep Learning",
    icon: BrainCircuit,
    color: "from-orange-500 to-rose-600",
    lightBg: "bg-orange-50 dark:bg-orange-900/20",
    iconColor: "text-orange-600",
    blog: "https://www.geeksforgeeks.org/machine-learning/machine-learning/",
    level: "Intermediate → Advanced",
    lessons: "90+ lessons",
  },
  {
    id: 5,
    title: "OOP Concepts",
    desc: "Classes, Inheritance, Polymorphism, Design",
    icon: Layers,
    color: "from-pink-500 to-rose-600",
    lightBg: "bg-pink-50 dark:bg-pink-900/20",
    iconColor: "text-pink-600",
    blog: "https://www.geeksforgeeks.org/dsa/introduction-of-object-oriented-programming/",
    level: "Beginner",
    lessons: "60+ lessons",
  },
  {
    id: 6,
    title: "Artificial Intelligence",
    desc: "LLMs, Agents, Computer Vision, NLP",
    icon: Cpu,
    color: "from-sky-500 to-blue-600",
    lightBg: "bg-sky-50 dark:bg-sky-900/20",
    iconColor: "text-sky-600",
    blog: "https://www.geeksforgeeks.org/artificial-intelligence/artificial-intelligence/",
    level: "Advanced",
    lessons: "70+ lessons",
  },
  {
    id: 7,
    title: "Other Domains",
    desc: "Explore more specialized tracks",
    icon: MoreHorizontal,
    color: "from-slate-400 to-slate-600",
    lightBg: "bg-slate-50 dark:bg-slate-800/40",
    iconColor: "text-slate-500",
    blog: null,
    level: "Varies",
    lessons: "Coming soon",
  },
];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};
const item = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

const Services = () => {
  const navigate = useNavigate();

  return (
    <section id="courses" className="bg-[var(--surface)] py-20">
      <div className="container">
        {/* Header */}
        <div className="text-center mb-14">
          <div className="section-eyebrow justify-center mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]" />
            Our Curriculum
          </div>
          <h2 className="section-title text-center mb-4">
            Courses We Provide
          </h2>
          <p className="section-subtitle mx-auto text-center">
            Industry-aligned courses built by experts — from fundamentals to production-grade skills.
          </p>
        </div>

        {/* Grid */}
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-60px" }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5"
        >
          {COURSES.map((course) => {
            const Icon = course.icon;
            return (
              <motion.div
                key={course.id}
                variants={item}
                onClick={() => navigate(`/course/${course.title}/form`, { state: { title: course.title } })}
                className="group cursor-pointer bg-[var(--card)] rounded-2xl border border-[var(--border)] p-5 flex flex-col gap-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(79,70,229,0.12)] hover:border-[var(--accent-border)]"
              >
                {/* Icon */}
                <div className={`w-12 h-12 rounded-2xl ${course.lightBg} grid place-items-center shrink-0`}>
                  <Icon className={`w-6 h-6 ${course.iconColor}`} />
                </div>

                {/* Content */}
                <div className="flex-1">
                  <h3 className="font-semibold text-[var(--text)] text-base mb-1 group-hover:text-[var(--accent)] transition-colors">
                    {course.title}
                  </h3>
                  <p className="text-sm text-[var(--muted)] leading-snug">{course.desc}</p>
                </div>

                {/* Meta */}
                <div className="flex items-center justify-between text-xs text-[var(--muted)]">
                  <span>{course.lessons}</span>
                  <span className="badge badge-indigo">{course.level.split(" → ")[0]}</span>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-1">
                  <button
                    className="flex-1 py-2 rounded-xl text-sm font-semibold text-white transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
                    style={{ background: "var(--grad)" }}
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/course/${course.title}/form`, { state: { title: course.title } });
                    }}
                  >
                    Enroll
                  </button>
                  {course.blog && (
                    <a
                      href={course.blog}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="px-3 py-2 rounded-xl border border-[var(--border)] text-[var(--muted)] hover:text-[var(--accent)] hover:border-[var(--accent-border)] transition-all"
                      title="Read blog"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
};

export default Services;
