import React from "react";
import BannerPng from "../../assets/banner.png";
import { motion } from "framer-motion";
import { CheckCircle2, ArrowRight } from "lucide-react";

const POINTS = [
  "Learn at your own pace with expert-curated content",
  "Get real interview prep with mock tests & coding challenges",
  "Track your progress and earn completion certificates",
  "Access on any device — anytime, anywhere",
];

const Banner2 = () => {
  return (
    <section className="bg-[var(--surface)] py-20">
      <div className="container">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">

          {/* Text Side */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="flex flex-col gap-6"
          >
            <div className="section-eyebrow">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]" />
              Community
            </div>
            <h2 className="section-title">
              Join Our Community to<br />
              <span className="gradient-text">Start Your Journey</span>
            </h2>
            <p className="text-[var(--muted)] leading-relaxed">
              Zenith is dedicated to empowering aspiring developers. From beginner tutorials to advanced programming concepts, we provide a comprehensive learning experience designed to help you master coding, build projects, and launch your tech career.
            </p>

            <ul className="flex flex-col gap-3">
              {POINTS.map((point, i) => (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, x: -16 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.35 }}
                  className="flex items-start gap-3 text-sm text-[var(--muted)]"
                >
                  <CheckCircle2 className="w-5 h-5 text-[var(--accent)] shrink-0 mt-0.5" />
                  <span>{point}</span>
                </motion.li>
              ))}
            </ul>

            <div className="flex flex-wrap gap-3 pt-2">
              <a
                href="/signup"
                className="primary-btn gap-2 group"
              >
                Join For Free
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </a>
              <a
                href="https://chat.whatsapp.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="outline-btn gap-2"
              >
                WhatsApp Community
              </a>
            </div>
          </motion.div>

          {/* Image Side */}
          <div className="relative flex justify-center items-center">
            <div className="absolute inset-0 rounded-3xl opacity-10 blur-2xl"
              style={{ background: "linear-gradient(135deg, #059669, #10B981)" }} />
            <motion.img
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              src={BannerPng}
              alt="Community"
              className="relative z-10 w-full max-w-[380px] md:max-w-[420px] drop-shadow-xl"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Banner2;
